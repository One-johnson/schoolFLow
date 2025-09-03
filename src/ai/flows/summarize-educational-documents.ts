'use server';

/**
 * @fileOverview A flow for answering questions based on a given document.
 *
 * - answerQuestionFromDocument - A function that accepts a document and a question, and returns an answer.
 * - DocumentQaInput - The input type for the answerQuestionFromDocument function.
 * - DocumentQaOutput - The return type for the answerQuestionFromDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DocumentQaInputSchema = z.object({
  documentText: z.string().describe('The document to search for answers within.'),
  question: z.string().describe('The question to answer based on the document.'),
});
export type DocumentQaInput = z.infer<typeof DocumentQaInputSchema>;

const DocumentQaOutputSchema = z.object({
  answer: z.string().describe('The answer to the question, based *only* on the provided document. If the answer is not in the document, say so.'),
});
export type DocumentQaOutput = z.infer<typeof DocumentQaOutputSchema>;

export async function answerQuestionFromDocument(input: DocumentQaInput): Promise<DocumentQaOutput> {
  return documentQaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'documentQaPrompt',
  input: {schema: DocumentQaInputSchema},
  output: {schema: DocumentQaOutputSchema},
  prompt: `You are an expert at answering questions based on a provided document.

  Carefully read the document below and answer the user's question. Your answer must be based solely on the information found within the document. If the document does not contain the answer, you must state that the information is not available in the provided text.

  Document:
  """
  {{{documentText}}}
  """

  Question: "{{{question}}}"
  `,
});

const documentQaFlow = ai.defineFlow(
  {
    name: 'documentQaFlow',
    inputSchema: DocumentQaInputSchema,
    outputSchema: DocumentQaOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
