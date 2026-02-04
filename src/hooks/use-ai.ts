import { useState } from "react";

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any | null>(null);

  const sendMessage = async (message: string, options = {} as any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          systemPrompt: options.systemPrompt,
          context: options.context,
          history: options.history,
          model: options.model || "gemini-flash-latest",
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 2048,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to get response");
      }

      return data.response;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendMessageStream = async (message: string, onChunk: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/ai/stream?message=${encodeURIComponent(message)}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response!.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              fullText += data.text;
              if (onChunk) {
                onChunk(data.text, fullText);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      return fullText;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendAgentMessage = async (message: string, history: any[] = []) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message,
          history,
          model: "gemini-flash-latest",
          temperature: 0.7,
          maxTokens: 2048,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to get response");
      }

      return {
        response: data.response,
        actionsPerformed: data.actionsPerformed || [],
      };
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  interface StreamCallbacks {
    onText?: (text: string, fullText: string) => void;
    onFunctionStart?: (functions: string[]) => void;
    onFunctionComplete?: (actions: string[]) => void;
    onDone?: (actionsPerformed: string[]) => void;
    onError?: (error: string) => void;
  }

  const sendAgentMessageStream = async (
    message: string,
    history: any[] = [],
    callbacks: StreamCallbacks = {}
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/agent/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message,
          history,
          model: "gemini-flash-latest",
          temperature: 0.7,
          maxTokens: 2048,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let actionsPerformed: string[] = [];
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            continue;
          }
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.text !== undefined) {
                fullText += data.text;
                callbacks.onText?.(data.text, fullText);
              } else if (data.functions !== undefined) {
                callbacks.onFunctionStart?.(data.functions);
              } else if (data.actions !== undefined) {
                actionsPerformed = data.actions;
                callbacks.onFunctionComplete?.(data.actions);
              } else if (data.actionsPerformed !== undefined) {
                actionsPerformed = data.actionsPerformed;
                callbacks.onDone?.(data.actionsPerformed);
              } else if (data.error !== undefined) {
                callbacks.onError?.(data.error);
                throw new Error(data.error);
              }
            } catch (e) {
              // Skip invalid JSON unless it's an actual error we threw
              if (e instanceof Error && e.message !== "Invalid JSON") {
                throw e;
              }
            }
          }
        }
      }

      return {
        response: fullText,
        actionsPerformed,
      };
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendMessage,
    sendMessageStream,
    sendAgentMessage,
    sendAgentMessageStream,
    loading,
    error,
  };
}
