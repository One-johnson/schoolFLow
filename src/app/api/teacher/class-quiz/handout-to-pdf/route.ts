import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";
import { TeacherSessionManager } from "@/lib/session";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024;

async function assertTeacherSession(): Promise<NextResponse | null> {
  const token = await TeacherSessionManager.getSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  const convex = new ConvexHttpClient(url);
  const data = await convex.query(api.sessions.getSessionWithUser, {
    sessionToken: token,
  });
  if (!data || data.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * Converts .doc / .docx to PDF via ConvertAPI (https://www.convertapi.com).
 * Set CONVERTAPI_SECRET in the server environment. Without it, returns 503 and the client uploads Word as-is.
 */
export async function POST(req: Request): Promise<Response> {
  const authErr = await assertTeacherSession();
  if (authErr) return authErr;

  const secret = process.env.CONVERTAPI_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      {
        error: "Word to PDF conversion is not configured (missing CONVERTAPI_SECRET).",
        code: "CONVERT_DISABLED",
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Missing or empty file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 25 MB)" },
      { status: 413 },
    );
  }

  const lower = file.name.toLowerCase();
  let convertPath: string;
  if (lower.endsWith(".docx")) {
    convertPath = "convert/docx/to/pdf";
  } else if (lower.endsWith(".doc")) {
    convertPath = "convert/doc/to/pdf";
  } else {
    return NextResponse.json(
      { error: "Only .doc and .docx files can be converted" },
      { status: 400 },
    );
  }

  const upload = new FormData();
  upload.append("File", file, file.name);

  const convertUrl = `https://v2.convertapi.com/${convertPath}?Secret=${encodeURIComponent(secret)}`;
  const upstream = await fetch(convertUrl, { method: "POST", body: upload });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    console.error("ConvertAPI handout error:", upstream.status, text.slice(0, 500));
    return NextResponse.json(
      { error: "Could not convert this file. Try exporting to PDF from Word, or use a smaller file." },
      { status: 502 },
    );
  }

  let json: unknown;
  try {
    json = await upstream.json();
  } catch {
    return NextResponse.json({ error: "Invalid response from converter" }, { status: 502 });
  }

  const files = (json as { Files?: Array<{ FileData?: string }> }).Files;
  const b64 = files?.[0]?.FileData;
  if (!b64 || typeof b64 !== "string") {
    return NextResponse.json({ error: "Conversion produced no PDF" }, { status: 502 });
  }

  let buf: Buffer;
  try {
    buf = Buffer.from(b64, "base64");
  } catch {
    return NextResponse.json({ error: "Invalid PDF data" }, { status: 502 });
  }
  if (buf.length === 0) {
    return NextResponse.json({ error: "Empty PDF" }, { status: 502 });
  }

  const baseName = file.name.replace(/\.(docx?|DOCX?)$/i, "") || "handout";
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(baseName)}.pdf"`,
    },
  });
}
