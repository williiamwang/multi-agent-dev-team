export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface OllamaOptions {
  model?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
}

const DEFAULT_MODEL = "mistral";
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434";

/**
 * Call Ollama API
 */
export async function callOllama(
  messages: LLMMessage[],
  options: OllamaOptions = {}
): Promise<LLMResponse> {
  const model = options.model || DEFAULT_MODEL;
  const temperature = options.temperature ?? 0.7;

  try {
    // Build prompt from messages
    let prompt = "";
    for (const msg of messages) {
      if (msg.role === "system") {
        prompt += `System: ${msg.content}\n\n`;
      } else if (msg.role === "user") {
        prompt += `User: ${msg.content}\n\n`;
      } else if (msg.role === "assistant") {
        prompt += `Assistant: ${msg.content}\n\n`;
      }
    }

    prompt += "Assistant: ";

    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        temperature,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      response: string;
      eval_count?: number;
      prompt_eval_count?: number;
    };

    return {
      content: data.response.trim(),
      tokens: {
        prompt: data.prompt_eval_count || 0,
        completion: data.eval_count || 0,
        total: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
    };
  } catch (error) {
    console.error("[Ollama] Error:", error);
    throw error;
  }
}

/**
 * Stream Ollama response
 */
export async function* streamOllama(
  messages: LLMMessage[],
  options: OllamaOptions = {}
): AsyncGenerator<string> {
  const model = options.model || DEFAULT_MODEL;
  const temperature = options.temperature ?? 0.7;

  try {
    // Build prompt from messages
    let prompt = "";
    for (const msg of messages) {
      if (msg.role === "system") {
        prompt += `System: ${msg.content}\n\n`;
      } else if (msg.role === "user") {
        prompt += `User: ${msg.content}\n\n`;
      } else if (msg.role === "assistant") {
        prompt += `Assistant: ${msg.content}\n\n`;
      }
    }

    prompt += "Assistant: ";

    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        temperature,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      buffer = lines[lines.length - 1] || "";

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const data = JSON.parse(line) as { response?: string };
          if (data.response) {
            yield data.response;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  } catch (error) {
    console.error("[Ollama Stream] Error:", error);
    throw error;
  }
}

/**
 * List available models
 */
export async function listOllamaModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/tags`);

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      models?: Array<{ name: string }>;
    };

    return (data.models || []).map((m) => m.name);
  } catch (error) {
    console.error("[Ollama] Error listing models:", error);
    return [];
  }
}

/**
 * Pull a model from Ollama registry
 */
export async function pullOllamaModel(modelName: string): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/pull`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("[Ollama] Error pulling model:", error);
    return false;
  }
}
