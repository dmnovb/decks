import { NextRequest } from 'next/server'
import { createPerplexity } from '@ai-sdk/perplexity'
import { smoothStream, streamText } from 'ai'

const pplx = createPerplexity({
    apiKey: process.env.PERPLEXITY_API_KEY!
})

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({}))
    const {
        prompt,
        system,
        temperature = 0.7,
        maxOutputTokens = 2048,
        model = 'sonar-pro'
    } = body || {}

    if (!prompt || typeof prompt !== 'string') {
        return Response.json({ success: false, error: 'prompt is required' }, { status: 400 })
    }

    const result = await streamText({
        model: pplx(model as any),
        system,
        temperature,
        maxOutputTokens,
        prompt,
    })

    return result.toTextStreamResponse()
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const prompt = searchParams.get('prompt') || searchParams.get('message') || ''
    const system = searchParams.get('system') || undefined
    const temperature = searchParams.get('temperature') ? Number(searchParams.get('temperature')) : 0.7
    const maxOutputTokens = searchParams.get('maxOutputTokens') ? Number(searchParams.get('maxOutputTokens')) : 2048
    const model = searchParams.get('model') || 'sonar-pro'

    if (!prompt) {
        return Response.json({ success: false, error: 'prompt is required' }, { status: 400 })
    }

    const result = await streamText({
        model: pplx(model as any),
        system,
        temperature,
        maxOutputTokens,
        prompt
    })

    return result.toTextStreamResponse()
}