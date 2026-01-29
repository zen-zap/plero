/**
 * Integration tests for AI service
 * These tests make actual API calls - use sparingly!
 * Run with: npm test -- --grep "AI Service Integration"
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { profiler, formatDuration } from "../../services/profiler";

// Skip these tests if no API key is set
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const HUGGINGFACEHUB_API_KEY = process.env.HUGGINGFACEHUB_API_KEY;

const describeIfOpenAI = OPENAI_API_KEY ? describe : describe.skip;
const describeIfHuggingFace = HUGGINGFACEHUB_API_KEY ? describe : describe.skip;

describe("AI Service Integration", () => {
  beforeAll(() => {
    profiler.clear();
  });

  afterAll(() => {
    console.log("\n" + profiler.getSummary());
  });

  describeIfOpenAI("OpenAI Connectivity", () => {
    it("should verify OPENAI_API_KEY is set", () => {
      expect(OPENAI_API_KEY).toBeDefined();
      expect(OPENAI_API_KEY!.length).toBeGreaterThan(10);
    });

    it("should make a minimal API call (ping test)", async () => {
      // This test makes a real API call
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({ apiKey: OPENAI_API_KEY });

      const { result, profile } = await profiler.timeAsync(
        "openai-ping",
        async () => {
          const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "Say 'ok'" }],
            max_tokens: 5,
          });
          return response.choices[0]?.message?.content;
        },
        { test: "ping" },
      );

      console.log(
        `[AI Ping] Response: "${result}" in ${formatDuration(profile.duration)}`,
      );

      expect(result).toBeDefined();
      expect(profile.success).toBe(true);
      expect(profile.duration).toBeLessThan(30000); // Should respond within 30s
    }, 60000); // 60s timeout
  });

  describeIfHuggingFace("HuggingFace Connectivity", () => {
    it("should verify HUGGINGFACEHUB_API_KEY is set", () => {
      expect(HUGGINGFACEHUB_API_KEY).toBeDefined();
      expect(HUGGINGFACEHUB_API_KEY!.length).toBeGreaterThan(10);
    });

    it("should generate embeddings", async () => {
      const { HuggingFaceInferenceEmbeddings } =
        await import("@langchain/community/embeddings/hf");

      const embedder = new HuggingFaceInferenceEmbeddings({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        apiKey: HUGGINGFACEHUB_API_KEY,
      });

      const { result, profile } = await profiler.timeAsync(
        "huggingface-embed",
        async () => {
          return await embedder.embedQuery("Hello, world!");
        },
        { test: "embedding" },
      );

      console.log(
        `[Embedding] Generated ${result.length}-dim vector in ${formatDuration(profile.duration)}`,
      );

      expect(result).toHaveLength(384); // MiniLM-L6-v2 produces 384-dim vectors
      expect(profile.success).toBe(true);
    }, 30000);

    it("should batch embed multiple texts", async () => {
      const { HuggingFaceInferenceEmbeddings } =
        await import("@langchain/community/embeddings/hf");

      const embedder = new HuggingFaceInferenceEmbeddings({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        apiKey: HUGGINGFACEHUB_API_KEY,
      });

      const texts = [
        "First document about TypeScript",
        "Second document about React",
        "Third document about Node.js",
      ];

      const { result, profile } = await profiler.timeAsync(
        "huggingface-batch-embed",
        async () => {
          return await embedder.embedDocuments(texts);
        },
        { count: texts.length },
      );

      console.log(
        `[Batch Embedding] Generated ${result.length} vectors in ${formatDuration(profile.duration)}`,
      );
      console.log(
        `[Batch Embedding] Avg per doc: ${formatDuration(profile.duration / texts.length)}`,
      );

      expect(result).toHaveLength(texts.length);
      result.forEach((vec) => expect(vec).toHaveLength(384));
      expect(profile.success).toBe(true);
    }, 30000);
  });
});

describe("RAG Pipeline Integration", () => {
  describeIfHuggingFace("Full RAG Flow", () => {
    it("should chunk, embed, and search", async () => {
      // Import services
      const { chunkByLines, embed, embedChunks, hashChunks } =
        await import("../../services/rag");

      const sampleCode = `
import React from 'react';

export function Button({ label, onClick }) {
  return (
    <button onClick={onClick}>
      {label}
    </button>
  );
}

export function Input({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}

export function Form({ onSubmit, children }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };
  
  return <form onSubmit={handleSubmit}>{children}</form>;
}
`.trim();

      // Step 1: Chunk
      const { result: chunks, profile: chunkProfile } = profiler.timeSync(
        "rag-chunk",
        () => chunkByLines(sampleCode, 10),
      );

      console.log(
        `[Chunk] Created ${chunks.length} chunks in ${formatDuration(chunkProfile.duration)}`,
      );
      expect(chunks.length).toBeGreaterThan(1);

      const { result: hashes, profile: hashProfile } = profiler.timeSync(
        "rag-hash",
        () => hashChunks(chunks),
      );

      console.log(
        `[Hash] Hashed ${hashes.length} chunks in ${formatDuration(hashProfile.duration)}`,
      );
      expect(hashes).toHaveLength(chunks.length);

      const { result: chunkEmbeddings, profile: embedProfile } =
        await profiler.timeAsync(
          "rag-embed-chunks",
          () => embedChunks(chunks),
          { chunkCount: chunks.length },
        );

      console.log(
        `[Embed Chunks] Embedded ${chunkEmbeddings.length} chunks in ${formatDuration(embedProfile.duration)}`,
      );
      expect(chunkEmbeddings).toHaveLength(chunks.length);

      const query = "How do I handle form submission?";
      const { result: queryEmbedding, profile: queryProfile } =
        await profiler.timeAsync("rag-embed-query", () => embed(query));

      console.log(
        `[Embed Query] Query embedded in ${formatDuration(queryProfile.duration)}`,
      );
      expect(queryEmbedding).toHaveLength(384);

      const { result: similarities, profile: simProfile } = profiler.timeSync(
        "rag-similarity",
        () => {
          return chunkEmbeddings.map((chunkEmb, idx) => {
            const dotProduct = queryEmbedding.reduce(
              (sum, val, i) => sum + val * chunkEmb[i],
              0,
            );
            const normA = Math.sqrt(
              queryEmbedding.reduce((sum, val) => sum + val * val, 0),
            );
            const normB = Math.sqrt(
              chunkEmb.reduce((sum, val) => sum + val * val, 0),
            );
            return { idx, score: dotProduct / (normA * normB) };
          });
        },
      );

      console.log(
        `[Similarity] Computed ${similarities.length} scores in ${formatDuration(simProfile.duration)}`,
      );

      const sorted = similarities.sort((a, b) => b.score - a.score);
      const topChunk = chunks[sorted[0].idx];

      console.log(`[Top Result] Score: ${sorted[0].score.toFixed(4)}`);
      console.log(`[Top Result] Chunk:\n${topChunk.slice(0, 100)}...`);

      // The Form component should be highly ranked since query mentions "form submission"
      expect(topChunk.toLowerCase()).toContain("form");

      console.log("\n--- RAG Pipeline Summary ---");
      console.log(profiler.getSummary());
    }, 60000);
  });
});
