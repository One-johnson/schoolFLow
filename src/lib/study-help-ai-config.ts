/** Which LLM backs Study help (chat + quizzes). */
export type StudyHelpProvider = "openai" | "gemini";

export function getStudyHelpProvider(): StudyHelpProvider {
  const p = process.env.STUDY_HELP_AI_PROVIDER?.trim().toLowerCase();
  if (p === "gemini" || p === "google") return "gemini";
  return "openai";
}

export function isStudyHelpAiConfigured(): boolean {
  if (getStudyHelpProvider() === "gemini") {
    return Boolean(process.env.GEMINI_API_KEY?.trim());
  }
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
