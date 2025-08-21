import { AiSummarizer } from "@/components/ai-summarizer";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SummarizePage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Summarization</CardTitle>
          <CardDescription>
            Paste any lengthy educational text below to get a concise summary. This tool helps extract key points, enhancing productivity and learning.
          </CardDescription>
        </CardHeader>
        <AiSummarizer />
      </Card>
    </div>
  );
}
