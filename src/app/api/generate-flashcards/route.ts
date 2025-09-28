import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest } from 'next/server';

//@ts-ignore
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const { prompt } = await request.json()

        const model = genAI.getGenerativeModel({ model: '' })

    } catch (error) {

    }
}