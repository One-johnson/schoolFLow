/**
 * Client-only quiz history & “stages” for Study help (per student id).
 * Not synced across devices unless you later add Convex.
 */

export type QuizAttemptRecord = {
  id: string;
  at: string;
  topic: string;
  difficulty: string;
  correct: number;
  total: number;
  percent: number;
  gradeLetter: string;
};

export type QuizProgressState = {
  xp: number;
  attempts: QuizAttemptRecord[];
};

const MAX_ATTEMPTS = 25;
const XP_PER_STAGE = 280;

const STAGE_LABELS = [
  "Explorer",
  "Learner",
  "Scholar",
  "Achiever",
  "Expert",
  "Master",
];

export function storageKeyForStudent(studentId: string): string {
  return `schoolflow:study-quiz-progress:${studentId}`;
}

export function gradeLetterFromPercent(percent: number): string {
  if (percent >= 90) return "A";
  if (percent >= 80) return "B";
  if (percent >= 70) return "C";
  if (percent >= 60) return "D";
  if (percent >= 50) return "E";
  return "F";
}

export function performanceBand(percent: number): string {
  if (percent >= 90) return "Outstanding";
  if (percent >= 80) return "Great work";
  if (percent >= 70) return "Good progress";
  if (percent >= 60) return "Keep practising";
  if (percent >= 50) return "Room to grow";
  return "Try another round";
}

export function xpForQuiz(correct: number, total: number, percent: number): number {
  if (total <= 0) return 0;
  return Math.round(percent * 1.2 + correct * 4 + Math.min(total, 20));
}

export function stageFromXp(xp: number): {
  stage: number;
  label: string;
  xpIntoStage: number;
  xpForNext: number;
  progressPercent: number;
} {
  const stage = Math.floor(xp / XP_PER_STAGE) + 1;
  const xpIntoStage = xp % XP_PER_STAGE;
  const xpForNext = XP_PER_STAGE;
  const progressPercent = Math.min(100, Math.round((xpIntoStage / XP_PER_STAGE) * 100));
  const label =
    STAGE_LABELS[Math.min(stage - 1, STAGE_LABELS.length - 1)] ?? "Master";
  return { stage, label, xpIntoStage, xpForNext, progressPercent };
}

export function loadQuizProgress(studentId: string): QuizProgressState {
  if (typeof window === "undefined") {
    return { xp: 0, attempts: [] };
  }
  try {
    const raw = localStorage.getItem(storageKeyForStudent(studentId));
    if (!raw) return { xp: 0, attempts: [] };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return { xp: 0, attempts: [] };
    const xp = Number((parsed as { xp?: unknown }).xp);
    const attempts = (parsed as { attempts?: unknown }).attempts;
    const safeXp = Number.isFinite(xp) && xp >= 0 ? xp : 0;
    const safeAttempts = Array.isArray(attempts)
      ? (attempts as QuizAttemptRecord[]).filter(
          (a) =>
            a &&
            typeof a.id === "string" &&
            typeof a.topic === "string" &&
            typeof a.correct === "number" &&
            typeof a.total === "number",
        )
      : [];
    return { xp: safeXp, attempts: safeAttempts.slice(-MAX_ATTEMPTS) };
  } catch {
    return { xp: 0, attempts: [] };
  }
}

export function appendQuizAttempt(
  studentId: string,
  attempt: Omit<QuizAttemptRecord, "id" | "at"> & { id?: string; at?: string },
): QuizProgressState {
  const prev = loadQuizProgress(studentId);
  const record: QuizAttemptRecord = {
    id: attempt.id ?? crypto.randomUUID(),
    at: attempt.at ?? new Date().toISOString(),
    topic: attempt.topic,
    difficulty: attempt.difficulty,
    correct: attempt.correct,
    total: attempt.total,
    percent: attempt.percent,
    gradeLetter: attempt.gradeLetter,
  };
  const gain = xpForQuiz(record.correct, record.total, record.percent);
  const nextXp = prev.xp + gain;
  const attempts = [...prev.attempts, record].slice(-MAX_ATTEMPTS);
  const state: QuizProgressState = { xp: nextXp, attempts };
  try {
    localStorage.setItem(storageKeyForStudent(studentId), JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
  return state;
}
