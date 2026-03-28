export type QuizQuestion = {
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  /** Why the correct answer is right (from the model). */
  explanation: string;
};

function stripCodeFences(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/u, "");
  }
  return s.trim();
}

export function parseQuizJson(raw: string): QuizQuestion[] | null {
  let data: unknown;
  try {
    data = JSON.parse(stripCodeFences(raw));
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const questions = (data as { questions?: unknown }).questions;
  if (!Array.isArray(questions) || questions.length === 0) return null;

  const out: QuizQuestion[] = [];
  for (const q of questions) {
    if (!q || typeof q !== "object") return null;
    const question = (q as { question?: unknown }).question;
    const options = (q as { options?: unknown }).options;
    const correctIndex = (q as { correctIndex?: unknown }).correctIndex;
    const explanationRaw = (q as { explanation?: unknown }).explanation;

    if (typeof question !== "string" || !question.trim()) return null;
    if (!Array.isArray(options) || options.length !== 4) return null;
    if (!options.every((o) => typeof o === "string" && o.trim())) return null;
    if (
      typeof correctIndex !== "number" ||
      correctIndex !== Math.floor(correctIndex) ||
      correctIndex < 0 ||
      correctIndex > 3
    ) {
      return null;
    }

    let explanation = "";
    if (typeof explanationRaw === "string" && explanationRaw.trim()) {
      explanation = explanationRaw.trim();
    } else {
      explanation = `The correct choice is: ${String(options[correctIndex]).trim()}.`;
    }

    out.push({
      question: question.trim(),
      options: options.map((o) => String(o).trim()) as [
        string,
        string,
        string,
        string,
      ],
      correctIndex: correctIndex as 0 | 1 | 2 | 3,
      explanation,
    });
  }
  return out.length ? out : null;
}
