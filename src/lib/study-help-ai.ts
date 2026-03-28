import {
  STUDY_HELP_MAX_OUTPUT_TOKENS,
  STUDY_HELP_QUIZ_MAX_OUTPUT_TOKENS,
} from "@/lib/study-help-limits";
import { getStudyHelpProvider } from "@/lib/study-help-ai-config";

type ChatTurn = { role: "user" | "assistant"; content: string };

/** Thrown when the LLM API returns a status we want to surface to students (e.g. quota). */
export class StudyHelpUpstreamError extends Error {
  constructor(
    public readonly httpStatus: number,
    message: string,
  ) {
    super(message);
    this.name = "StudyHelpUpstreamError";
  }
}

export const STUDY_HELP_QUOTA_USER_MESSAGE =
  "The study assistant is over its usage limit right now (too many requests or daily quota). Wait a few minutes and try again. If this keeps happening, your school should check their AI provider account—Google AI Studio (Gemini) or OpenAI—for quotas and billing.";

const OPENAI_429_BILLING_MESSAGE =
  "OpenAI returned a billing or quota error: the API key may be out of credits or needs a payment method. The school admin should open https://platform.openai.com/settings/organization/billing and add credits or a card, then try again.";

const OPENAI_429_RATE_MESSAGE =
  "OpenAI rate limit: too many requests in a short time. Wait one minute and try again. If many students use Study help at once, the school may need a higher OpenAI usage tier.";

function openAi429UserMessage(errBody: string): string {
  const lower = errBody.toLowerCase();
  try {
    const parsed = JSON.parse(errBody) as {
      error?: { code?: string; type?: string; message?: string };
    };
    const code = parsed?.error?.code?.toLowerCase() ?? "";
    const type = parsed?.error?.type?.toLowerCase() ?? "";
    if (
      code === "insufficient_quota" ||
      type === "insufficient_quota" ||
      lower.includes("insufficient_quota")
    ) {
      return OPENAI_429_BILLING_MESSAGE;
    }
    if (
      code === "rate_limit_exceeded" ||
      type === "rate_limit_exceeded" ||
      lower.includes("rate_limit")
    ) {
      return OPENAI_429_RATE_MESSAGE;
    }
  } catch {
    /* use heuristics below */
  }
  if (lower.includes("billing") || lower.includes("credit")) {
    return OPENAI_429_BILLING_MESSAGE;
  }
  if (lower.includes("rate") || lower.includes("too many requests")) {
    return OPENAI_429_RATE_MESSAGE;
  }
  return STUDY_HELP_QUOTA_USER_MESSAGE;
}

async function openaiChat(
  systemPrompt: string,
  messages: ChatTurn[],
  maxTokens: number,
  jsonMode: boolean,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  const model = process.env.STUDY_HELP_MODEL?.trim() || "gpt-4o-mini";
  const base =
    process.env.OPENAI_BASE_URL?.trim().replace(/\/$/, "") || "https://api.openai.com/v1";

  const openaiMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const body: Record<string, unknown> = {
    model,
    messages: openaiMessages,
    max_tokens: maxTokens,
    temperature: jsonMode ? 0.5 : 0.6,
  };
  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    if (res.status === 429) {
      console.error(
        "[study-help] OpenAI 429:",
        errText.slice(0, 500).replace(/\s+/g, " "),
      );
      throw new StudyHelpUpstreamError(429, openAi429UserMessage(errText));
    }
    throw new Error(`OpenAI ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty OpenAI reply");
  return text;
}

async function geminiChat(
  systemPrompt: string,
  messages: ChatTurn[],
  maxTokens: number,
  jsonMode: boolean,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  // Bare names like "gemini-1.5-flash" often 404 on v1beta; use a current ID from
  // https://ai.google.dev/gemini-api/docs/models or override STUDY_HELP_GEMINI_MODEL.
  const model =
    process.env.STUDY_HELP_GEMINI_MODEL?.trim() || "gemini-2.0-flash";

  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  for (const m of messages) {
    contents.push({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    });
  }

  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: maxTokens,
    temperature: jsonMode ? 0.5 : 0.6,
  };
  if (jsonMode) {
    generationConfig.responseMimeType = "application/json";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    if (res.status === 429) {
      throw new StudyHelpUpstreamError(429, STUDY_HELP_QUOTA_USER_MESSAGE);
    }
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const parts = data.candidates?.[0]?.content?.parts;
  const text = parts?.map((p) => p.text ?? "").join("").trim();
  if (!text) throw new Error("Empty Gemini reply");
  return text;
}

async function completeChat(
  systemPrompt: string,
  messages: ChatTurn[],
  maxTokens: number,
  jsonMode: boolean,
): Promise<string> {
  const provider = getStudyHelpProvider();
  if (provider === "gemini") {
    return geminiChat(systemPrompt, messages, maxTokens, jsonMode);
  }
  return openaiChat(systemPrompt, messages, maxTokens, jsonMode);
}

/** Multi-turn study chat (student + assistant history). */
export async function runStudyHelpChat(
  systemPrompt: string,
  messages: ChatTurn[],
): Promise<string> {
  return completeChat(systemPrompt, messages, STUDY_HELP_MAX_OUTPUT_TOKENS, false);
}

/** Single-shot JSON string (quiz payload). */
export async function runStudyHelpQuizJson(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  return completeChat(
    systemPrompt,
    [{ role: "user", content: userPrompt }],
    STUDY_HELP_QUIZ_MAX_OUTPUT_TOKENS,
    true,
  );
}
