export const STUDY_HELP_MAX_MESSAGES = 24;
export const STUDY_HELP_MAX_MESSAGE_CHARS = 4000;
export const STUDY_HELP_MAX_OUTPUT_TOKENS = 1600;

export const STUDY_HELP_QUIZ_MAX_TOPIC_CHARS = 600;
export const STUDY_HELP_QUIZ_MIN_COUNT = 3;
/** Large quizzes need a high output token cap (model may still truncate at provider max). */
export const STUDY_HELP_QUIZ_MAX_COUNT = 50;
/** OpenAI gpt-4o-mini supports up to 16k output; Gemini Flash often ~8k–8k+ depending on model. */
export const STUDY_HELP_QUIZ_MAX_OUTPUT_TOKENS = 16384;
