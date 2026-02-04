import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      systemPrompt,
      context,
      history,
      model = "gemini-flash-latest",
      temperature = 0.7,
      maxTokens = 2048,
    } = await request.json();

    if (!message) {
      return Response.json(
        {
          success: false,
          error: "Message is required",
        },
        { status: 400 },
      );
    }

    const aiModel = genAI.getGenerativeModel({
      model,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    });

    // Build the conversation history if provided
    let chat;
    if (history && Array.isArray(history)) {
      // Convert history to Gemini format
      const geminiHistory = history.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      chat = aiModel.startChat({
        history: geminiHistory,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;

      return Response.json({
        success: true,
        response: response.text(),
        timestamp: new Date().toISOString(),
      });
    }

    // Build the full prompt with system prompt and context
    let fullPrompt = "";

    if (systemPrompt) {
      fullPrompt += `System Instructions: ${systemPrompt}\n\n`;
    }

    if (context) {
      fullPrompt += `Context: ${context}\n\n`;
    }

    fullPrompt += `User: ${message}`;

    const result = await aiModel.generateContent(fullPrompt);
    const response = await result.response;

    return Response.json({
      success: true,
      response: response.text(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return Response.json(
      {
        success: false,
        error: (error as Error).message || "Failed to process request",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const message = searchParams.get("message");

  if (!message) {
    return Response.json(
      {
        success: false,
        error: "Message is required",
      },
      { status: 400 },
    );
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
    });
    const result = await model.generateContentStream(message);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
            );
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Streaming Error:", error);
    return Response.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
