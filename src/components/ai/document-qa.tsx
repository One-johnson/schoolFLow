"use client";

import { useState } from "react";
import { answerQuestionFromDocument } from "@/ai/flows/summarize-educational-documents";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, HelpCircle } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function DocumentQa() {
  const [documentText, setDocumentText] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetAnswer = async () => {
    if (!documentText.trim() || !question.trim()) {
      toast({
        title: "Input required",
        description: "Please provide both a document and a question.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setAnswer("");

    try {
      const result = await answerQuestionFromDocument({ documentText, question });
      setAnswer(result.answer);
    } catch (error) {
      console.error("Q&A failed:", error);
      toast({
        title: "Error",
        description: "Failed to get an answer from the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CardContent>
      <div className="grid w-full gap-6">
        <div className="space-y-2">
            <Label htmlFor="document">Document</Label>
            <Textarea
            id="document"
            placeholder="Paste your educational document here..."
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
            rows={10}
            disabled={isLoading}
            />
        </div>
        <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Input
                id="question"
                placeholder="Ask a question about the document..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={isLoading}
            />
        </div>

        <Button onClick={handleGetAnswer} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <HelpCircle className="mr-2 h-4 w-4" />
          )}
          Get Answer
        </Button>

        {(isLoading || answer) && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Answer:</h3>
            <Card className="min-h-[100px] bg-secondary/50">
              <CardContent className="p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <p className="text-sm text-foreground whitespace-pre-wrap">{answer}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </CardContent>
  );
}
