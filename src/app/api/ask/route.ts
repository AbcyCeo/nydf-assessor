import { NextResponse } from "next/server";
import OpenAI from "openai";
import { retrieveContext } from "@/lib/ai/grounding";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { question } = await req.json();

  const snippets = await retrieveContext(String(question || ""));
  const groundingBlock = snippets.length
    ? `KNOWN POLICY/NOTES:\n${snippets.map((s,i)=>`[${i+1}] ${s.title}\n${s.text}`).join("\n\n")}`
    : "KNOWN POLICY/NOTES: (none found)";

  const system = [
    "You are the NYDF Assessor AI for Namibia.",
    "Always rely on KNOWN POLICY/NOTES first. If outside scope, say so briefly.",
    "Be concise, practical, and never promise funding or legal outcomes.",
    "If you reference a note, cite it like [1], [2] from the block below."
  ].join("\n");

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: system },
      { role: "user", content: `${groundingBlock}\n\nUSER QUESTION:\n${question}` }
    ],
  });

  return NextResponse.json({ answer: completion.choices[0].message.content, sources: snippets.map((s,i)=>({index:i+1,title:s.title})) });
}
