import { NextRequest } from 'next/server'
import { createPerplexity } from '@ai-sdk/perplexity'
import { generateText } from 'ai'

const pplx = createPerplexity({
    apiKey: process.env.PERPLEXITY_API_KEY!
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}))
        const {
            prompt,
            system,
            temperature = 0.7,
            maxOutputTokens = 2048,
            model = 'sonar-pro'
        } = body || {}

        if (!prompt || typeof prompt !== 'string') {
            return Response.json({
                success: false,
                error: 'prompt is required'
            }, { status: 400 })
        }

        const { text, finishReason, usage } = await generateText({
            model: pplx(model as any),
            system,
            temperature,
            maxOutputTokens,
            prompt
        })

        return Response.json({
            success: true,
            response: text,
            finishReason,
            usage,
            model
        })
    } catch (error) {
        console.error('Perplexity API Error:', error)
        return Response.json({
            success: false,
            error: (error as Error).message || 'Failed to process request'
        }, { status: 500 })
    }
} 