import { NextResponse } from "next/server";
import { getStudentFromSessionCookie } from "@/lib/student-session-server";
import { STUDY_HELP_SYSTEM_PROMPT } from "@/lib/study-help-prompt";
import { STUDY_HELP_QUIZ_SYSTEM_PROMPT } from "@/lib/study-help-quiz-prompt";
import {
  STUDY_HELP_MAX_MESSAGES,
  STUDY_HELP_MAX_MESSAGE_CHARS,
  STUDY_HELP_QUIZ_MAX_TOPIC_CHARS,
  STUDY_HELP_QUIZ_MIN_COUNT,
  STUDY_HELP_QUIZ_MAX_COUNT,
} from "@/lib/study-help-limits";
import {
  getStudyHelpProvider,
  isStudyHelpAiConfigured,
} from "@/lib/study-help-ai-config";
import {
  runStudyHelpChat,
  runStudyHelpQuizJson,
  StudyHelpUpstreamError,
} from "@/lib/study-help-ai";
import { parseQuizJson } from "@/lib/study-help-quiz-parse";

function jsonUpstreamError(e: unknown): NextResponse {
  if (e instanceof StudyHelpUpstreamError) {
    return NextResponse.json({ error: e.message }, { status: e.httpStatus });
  }
  return NextResponse.json(
    { error: "Could not reach the assistant. Try again later." },
    { status: 502 },
  );
}

type ChatRole = "user" | "assistant";

type IncomingMessage = { role: ChatRole; content: string };

function studyHelpDisabled(): boolean {
  const v = process.env.STUDY_HELP_DISABLED?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

function parseMessages(body: unknown): IncomingMessage[] | null {
  if (!body || typeof body !== "object") return null;
  const raw = (body as { messages?: unknown }).messages;
  if (!Array.isArray(raw)) return null;
  const out: IncomingMessage[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") return null;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    if (content.length > STUDY_HELP_MAX_MESSAGE_CHARS) return null;
    out.push({ role, content });
  }
  if (out.length === 0) return null;
  if (out.length > STUDY_HELP_MAX_MESSAGES) return null;
  if (out[0].role !== "user") return null;
  return out;
}

function parseQuizGenerateBody(body: unknown): {
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  count: number;
} | null {
  if (!body || typeof body !== "object") return null;
  const mode = (body as { mode?: unknown }).mode;
  if (mode !== "quiz_generate") return null;
  const topicRaw = (body as { topic?: unknown }).topic;
  if (typeof topicRaw !== "string") return null;
  const topic = topicRaw.trim();
  if (!topic.length || topic.length > STUDY_HELP_QUIZ_MAX_TOPIC_CHARS) return null;

  let difficulty: "easy" | "medium" | "hard" = "medium";
  const d = (body as { difficulty?: unknown }).difficulty;
  if (d === "easy" || d === "medium" || d === "hard") difficulty = d;

  let count = 5;
  const c = (body as { count?: unknown }).count;
  if (typeof c === "number" && Number.isFinite(c)) {
    count = Math.round(c);
  }
  if (count < STUDY_HELP_QUIZ_MIN_COUNT || count > STUDY_HELP_QUIZ_MAX_COUNT) {
    return null;
  }

  return { topic, difficulty, count };
}

export async function GET(): Promise<NextResponse> {
  const student = await getStudentFromSessionCookie();
  if (!student) {
    return NextResponse.json({ available: false }, { status: 401 });
  }
  const available = !studyHelpDisabled() && isStudyHelpAiConfigured();
  return NextResponse.json({
    available,
    provider: getStudyHelpProvider(),
  });
}

export async function POST(req: Request): Promise<NextResponse> {
  const student = await getStudentFromSessionCookie();
  if (!student) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (studyHelpDisabled()) {
    return NextResponse.json(
      { error: "Study help is turned off for your school right now." },
      { status: 503 },
    );
  }

  if (!isStudyHelpAiConfigured()) {
    return NextResponse.json(
      { error: "Study help is not configured yet. Ask your teacher or school admin." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const quizArgs = parseQuizGenerateBody(body);
  if (quizArgs) {
    const logEnabled = process.env.STUDY_HELP_LOG?.trim().toLowerCase() === "true";
    if (logEnabled) {
      console.info("[study-help quiz]", {
        schoolId: student.schoolId,
        studentId: student.convexStudentId,
        topicChars: quizArgs.topic.length,
        difficulty: quizArgs.difficulty,
        count: quizArgs.count,
      });
    }

    const userPrompt = `Generate exactly ${quizArgs.count} multiple-choice practice questions.
Difficulty: ${quizArgs.difficulty}.
Topic / focus (from the student): ${quizArgs.topic}

Return only the JSON object with key "questions" as specified.`;

    let rawJson: string;
    try {
      rawJson = await runStudyHelpQuizJson(STUDY_HELP_QUIZ_SYSTEM_PROMPT, userPrompt);
    } catch (e) {
      console.error("Study help quiz upstream error:", e);
      return jsonUpstreamError(e);
    }

    const questions = parseQuizJson(rawJson);
    if (
      !questions?.length ||
      questions.length < STUDY_HELP_QUIZ_MIN_COUNT ||
      questions.length > STUDY_HELP_QUIZ_MAX_COUNT
    ) {
      console.error("Study help quiz parse failed; raw length", rawJson.length);
      return NextResponse.json(
        {
          error:
            "The quiz did not come back in the right format. Try a shorter topic or different wording.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ questions });
  }

  const messages = parseMessages(body);
  if (!messages) {
    return NextResponse.json(
      { error: "Invalid messages. Send a short history starting with a user message." },
      { status: 400 },
    );
  }

  const logEnabled = process.env.STUDY_HELP_LOG?.trim().toLowerCase() === "true";
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (logEnabled) {
    const preview = lastUser?.content.slice(0, 120).replace(/\s+/g, " ") ?? "";
    console.info("[study-help]", {
      schoolId: student.schoolId,
      studentId: student.convexStudentId,
      provider: getStudyHelpProvider(),
      turns: messages.length,
      lastUserChars: lastUser?.content.length ?? 0,
      preview,
    });
  }

  let text: string;
  try {
    text = await runStudyHelpChat(STUDY_HELP_SYSTEM_PROMPT, messages);
  } catch (e) {
    console.error("Study help chat upstream error:", e);
    return jsonUpstreamError(e);
  }

  if (!text) {
    return NextResponse.json({ error: "Empty reply. Try rephrasing." }, { status: 502 });
  }

  return NextResponse.json({ message: text });
}
