import fs from "fs";
import path from "path";
import OpenAI from "openai";

type Doc = { id: string; title: string; text: string };
type Store = {
  docs: Doc[];
  embeddings: Float32Array[]; // same order as docs
  dim: number;
};

let store: Store | null = null;

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function embed(texts: string[]): Promise<Float32Array[]> {
  const res = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return res.data.map(d => Float32Array.from(d.embedding));
}

function cosine(a: Float32Array, b: Float32Array) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    dot += x*y; na += x*x; nb += y*y;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12);
}

function readKnowledge(): Doc[] {
  const dir = path.resolve(process.cwd(), "knowledge");
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".md"));
  return files.map((f, idx) => {
    const text = fs.readFileSync(path.join(dir, f), "utf8");
    const title = (text.split("\n")[0] || f).replace(/^#\s*/, "");
    return { id: `doc_${idx}_${f}`, title, text };
  });
}

/** Lazy init store (cold start safe) */
async function ensureStore() {
  if (store) return store;
  const docs = readKnowledge();
  const embeddings = docs.length ? await embed(docs.map(d => d.text)) : [];
  store = { docs, embeddings, dim: embeddings[0]?.length ?? 1536 };
  return store;
}

/** Retrieve top-k relevant doc snippets for query */
export async function retrieveContext(query: string, k = 3) {
  const s = await ensureStore();
  if (!s.docs.length) return [];
  const [qvec] = await embed([query]);
  const scored = s.docs.map((d, i) => ({
    doc: d,
    score: cosine(qvec, s.embeddings[i]),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).map(({ doc, score }) => ({
    title: doc.title,
    score,
    text: doc.text.slice(0, 3000), // keep tokens in check
  }));
}
