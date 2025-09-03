import { DocumentQa } from "@/components/ai/document-qa";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SummarizePage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Q&amp;A</CardTitle>
          <CardDescription>
            Paste any lengthy educational text below and ask specific questions to get answers directly from the content. This tool helps you find information quickly without reading the entire document.
          </CardDescription>
        </CardHeader>
        <DocumentQa />
      </Card>
    </div>
  );
}
