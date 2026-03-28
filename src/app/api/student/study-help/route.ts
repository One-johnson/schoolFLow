import { NextResponse } from "next/server";
import { getStudentFromSessionCookie } from "@/lib/student-session-server";
import { STUDY_HELP_SYSTEM_PROMPT } from "@/lib/study-help-prompt";
import {
  STUDY_HELP_MAX_MESSAGES,
  STUDY_HELP_MAX_MESSAGE_CHARS,
  STUDY_HELP_MAX_OUTPUT_TOKENS,
} from "@/lib/study-help-limits";

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

export async function GET(): Promise<NextResponse> {
  const student = await getStudentFromSessionCookie();
  if (!student) {
    return NextResponse.json({ available: false }, { status: 401 });
  }
  const hasKey = Boolean(process.env.OPENAI_API_KEY?.trim());
  const available = !studyHelpDisabled() && hasKey;
  return NextResponse.json({ available });
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

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
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

  const messages = parseMessages(body);
  if (!messages) {
    return NextResponse.json(
      { error: "Invalid messages. Send a short history starting with a user message." },
      { status: 400 },
    );
  }

  const model = process.env.STUDY_HELP_MODEL?.trim() || "gpt-4o-mini";
  const base =
    process.env.OPENAI_BASE_URL?.trim().replace(/\/$/, "") || "https://api.openai.com/v1";

  const openaiMessages = [
    { role: "system" as const, content: STUDY_HELP_SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const logEnabled = process.env.STUDY_HELP_LOG?.trim().toLowerCase() === "true";
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (logEnabled) {
    const preview = lastUser?.content.slice(0, 120).replace(/\s+/g, " ") ?? "";
    console.info("[study-help]", {
      schoolId: student.schoolId,
      studentId: student.convexStudentId,
      turns: messages.length,
      lastUserChars: lastUser?.content.length ?? 0,
      preview,
    });
  }

  let res: Response;
  try {
    res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        max_tokens: STUDY_HELP_MAX_OUTPUT_TOKENS,
        temperature: 0.6,
      }),
    });
  } catch (e) {
    console.error("Study help upstream error:", e);
    return NextResponse.json(
      { error: "Could not reach the assistant. Try again later." },
      { status: 502 },
    );
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("Study help OpenAI error:", res.status, errText.slice(0, 500));
    return NextResponse.json(
      { error: "The assistant had a problem. Try a shorter question." },
      { status: 502 },
    );
  }

  type OpenAIChat = {
    choices?: Array<{ message?: { content?: string } }>;
  };

  let data: OpenAIChat;
  try {
    data = (await res.json()) as OpenAIChat;
  } catch {
    return NextResponse.json({ error: "Bad response from assistant." }, { status: 502 });
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    return NextResponse.json({ error: "Empty reply. Try rephrasing." }, { status: 502 });
  }

  return NextResponse.json({ message: text });
}
