"use client";

import { useState } from "react";
import { summarizeDocument } from "@/ai/flows/summarize-educational-documents";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

export function AiSummarizer() {
  const [documentText, setDocumentText] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSummarize = async () => {
    if (!documentText.trim()) {
      toast({
        title: "Input required",
        description: "Please paste some text to summarize.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSummary("");

    try {
      const result = await summarizeDocument({ documentText });
      setSummary(result.summary);
    } catch (error) {
      console.error("Summarization failed:", error);
      toast({
        title: "Error",
        description: "Failed to summarize the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CardContent>
      <div className="grid w-full gap-4">
        <Textarea
          placeholder="Paste your educational document here..."
          value={documentText}
          onChange={(e) => setDocumentText(e.target.value)}
          rows={10}
          disabled={isLoading}
        />
        <Button onClick={handleSummarize} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate Summary
        </Button>

        {(isLoading || summary) && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Summary:</h3>
            <Card className="min-h-[100px] bg-secondary/50">
              <CardContent className="p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <p className="text-sm text-foreground whitespace-pre-wrap">{summary}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </CardContent>
  );
}
