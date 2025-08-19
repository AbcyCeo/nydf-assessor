import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function extractText(file: File): Promise<string> {
  // Lazy import to avoid build-time side effects
  const bytes = Buffer.from(await file.arrayBuffer());
  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();

  if (type.includes("pdf") || name.endsWith(".pdf")) {
    const pdf = (await import("pdf-parse")).default as any;
    const data = await pdf(bytes);
    return data.text || "";
  }
  if (type.includes("word") || name.endsWith(".docx")) {
    const mammoth = (await import("mammoth")).default as any;
    const { value } = await mammoth.extractRawText({ buffer: bytes });
    return value || "";
  }
  if (type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
    return bytes.toString("utf8");
  }
  throw new Error("Unsupported file type. Please upload PDF, DOCX, or TXT.");
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing 'file' field in multipart form-data." }, { status: 400 });
    }

    const text = await extractText(file);

    const rubric = `
You are the NYDF Assessor AI. Score applicant readiness 0–100 and return STRICT JSON with:
{
  "score": number,
  "verdict": "ready" | "partial" | "not_ready",
  "breakdown": {
    "eligibility": number,
    "registration": number,
    "plan_clarity": number,
    "budget": number,
    "compliance": number,
    "docs": number
  },
  "missing": string[],
  "risks": string[],
  "next_steps": string[]
}
Rules:
- Consider typical NYDF expectations in Namibia.
- Penalize missing identity/eligibility and lack of itemized budget/quotes.
- Sum of breakdown should roughly map to score.
- Be concise and practical.
`.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" as any },
      messages: [
        { role: "system", content: rubric },
        { role: "user", content: text.slice(0, 120000) }
      ],
    });

    const out = completion.choices?.[0]?.message?.content ?? "{}";
    return NextResponse.json(JSON.parse(out));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Upload assess failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
