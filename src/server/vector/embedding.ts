import { type FeatureExtractionPipeline, env as hfEnv, pipeline } from "@huggingface/transformers";
import { env } from "@/lib/config/env";

/** BGE's retrieval instruction, on queries only. Documents stay unprefixed. */
export const QUERY_PREFIX = "Represent this sentence for searching relevant passages: ";

hfEnv.cacheDir = process.env.HF_CACHE_DIR ?? ".cache/huggingface";

let extractor: FeatureExtractionPipeline | undefined;

async function model() {
  extractor ??= await pipeline("feature-extraction", env().EMBEDDING_MODEL, {
    dtype: env().EMBEDDING_DTYPE,
  });
  return extractor;
}

/** Mean-pooled, L2-normalised vectors in the configured dimension. */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const pipe = await model();
  const output = await pipe(texts, { pooling: "mean", normalize: true });
  const vectors = output.tolist() as number[][];

  for (const vector of vectors) {
    if (vector.length !== env().EMBEDDING_DIM) {
      throw new Error(
        `Embedding dimension ${vector.length} does not match EMBEDDING_DIM ${env().EMBEDDING_DIM}`,
      );
    }
  }

  return vectors;
}

export async function embedDocument(text: string) {
  const [vector] = await embedDocuments([text]);
  if (!vector) throw new Error("The embedding model returned no vector");
  return vector;
}

export async function embedQuery(text: string) {
  return embedDocument(`${QUERY_PREFIX}${text.trim()}`);
}
