import { useState } from 'react';

export function useAI() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any | null>(null);

    const sendMessage = async (message: string, options = {} as any) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    systemPrompt: options.systemPrompt,
                    context: options.context,
                    history: options.history,
                    model: options.model || 'gemini-2.5-flash',
                    temperature: options.temperature || 0.7,
                    maxTokens: options.maxTokens || 2048
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to get response');
            }

            return data.response;

        } catch (err) {
            setError((error as Error).message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const sendMessageStream = async (message: string, onChunk: any) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/ai/stream?message=${encodeURIComponent(message)}`, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response!.body!.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
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

    return {
        sendMessage,
        sendMessageStream,
        loading,
        error
    };
}