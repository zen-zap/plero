// in src/services/ai.ts
import "dotenv/config";
import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (OPENAI_API_KEY == undefined) {
  throw new Error("Failed to retrieve OPENAI_API_KEY");
}

const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export type GhostCompletionOptions = {
  prefix: string;
  suffix: string;
  language?: string;
  model?: string;
  maxTokens?: number;
};

// We cannot have out ghost completion in a langgraph
// that would slow and this needs to be fast to be usable

/**
 * Generates a ghost code completion based on the cursor position.
 * We usually pass a few lines before the cursor as prefix and a few
 * lines after the cursor as suffix.
 * We probably need to call this function from the editor?
 */
export async function ghostCompletion({
  prefix,
  suffix,
  language = "typescript",
  model = "gpt-5.1-codex-mini",
  maxTokens = 128,
}: GhostCompletionOptions): Promise<string> {
	console.log("[AI] ghostCompletion start", {
		language,
		model,
		maxTokens,
		prefixLen: prefix?.length,
		suffixLen: suffix?.length,
	});

	if(prefix.trim().length < 3) {
		return "";
	}

	console.log("[AI] OPENAI_API_KEY present?", !!OPENAI_API_KEY);

	if (!OPENAI_API_KEY) {
	console.error("[AI] OPENAI_API_KEY is not set");
	throw new Error("OPENAI_API_KEY is not set");
	}

	let safePrefix = prefix.replace(/[\/\.\(\[\{]$/, "");
	safePrefix = safePrefix.replace(/([+\-*/=])$/, "$1 ");
	let safeSuffix = suffix;
	if(safeSuffix.trim() === "}") {
		safeSuffix = "";
	}

	const chosenModel = shouldUseStructuralModel(prefix, language)
	? "gpt-4.1-mini"
	: "gpt-5.1-codex-mini";

	const rules = shouldUseStructuralModel(prefix, language) ?
	`- You may generate a full valid construct.
	`:
	`- Prefer short continuations.
- It is allowed to continue partial expressions.
	;`

	try {
	console.log("[AI] invoking LLM... (truncating prompts in logs)");
	const response = await client.responses.create({
		model: chosenModel,
		text: {
			format: { type: "text" }
		},
		max_output_tokens: maxTokens,
		input: [
			{
			role: "user",
			content: [
				{
				type: "input_text",
				text: `You are a precise code completion engine.
Rules:
- Fill in the missing code between PREFIX and SUFFIX.
- Output ONLY the code.
- Do NOT include PREFIX or SUFFIX.
- Do NOT use markdown.
- Prefer methods consistent with surrounding functions.
- Prefer generating complete functions at top level.
${rules}
- If nothing fits, output an empty string.
- Respect indentation.

Language: ${language}

[PREFIX]
${safePrefix}
[SUFFIX]
${safeSuffix}

[COMPLETION]
`
				}
			]
			}
		]
	});


	console.log("[AI] llm.invoke response keys:", Object.keys(response || {}));
	// Log a truncated view of the response to aid debugging without spamming logs
	try {
		const truncated = JSON.stringify(
		{
			id: (response as any)?.id,
			model: (response as any)?.model,
			output_text: (response as any)?.output_text,
			output_preview: Array.isArray((response as any)?.output)
				? (response as any).output.slice(0, 3)
				: (response as any)?.output,
		},
		null,
		2,
		).slice(0, 2000);
		console.log("[AI] llm.invoke response (truncated):", truncated);
		} catch (e) {
		console.log("[AI] llm.invoke response (could not stringify):", e);
	}

	let completion = (response as any).output_text || "";
		console.log("[AI] raw completion length:", completion.length);
		console.log(
		"[AI] raw completion (first 2000 chars):",
		completion.slice(0, 2000),
	);

	// a little cleanup just in case
	if (completion.startsWith("```")) {
		completion = completion
		.replace(/^```[a-z]*\n?/, "")
		.replace(/\n?```$/, "");
		console.log("[AI] stripped code fences, new length:", completion.length);
	}

		console.log("[AI] final completion length:", completion.length);
		return completion;
	} catch (err) {
		console.error("[AI] ghostCompletion error:", err);
		throw err;
	}
}

// miniature router for rust
function shouldUseStructuralModel(prefix: string, language: string) {
	const p = prefix.trim();

	if (language === "rust") {
		return (
			p === "fn" ||
			p.startsWith("fn") ||
			p.startsWith("struct") ||
			p.startsWith("impl") ||
			p.endsWith("{")
		);
	}

	if (language === "typescript") {
		return (
			p === "f" ||
			p === "fu" ||
			p === "fun" ||
			p.startsWith("function") ||
			p.startsWith("export function") ||
			p.endsWith("\n\n") ||
			p.endsWith("\n")
		);
	}

	return false;
}
