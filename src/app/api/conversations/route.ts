import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth-token')?.value
        if (!token) return Response.json({ message: 'Not authenticated' }, { status: 401 })
        //@ts-ignore
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const userId = decoded.userId as string

        const conversations = await prisma.conversation.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                title: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { messages: true } }
            }
        })

        return Response.json({ success: true, conversations })
    } catch (error) {
        return Response.json({ success: false, error: (error as Error).message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth-token')?.value
        if (!token) return Response.json({ message: 'Not authenticated' }, { status: 401 })
        //@ts-ignore
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const userId = decoded.userId as string

        const body = await request.json().catch(() => ({}))
        const { title, messages } = body || {}

        const conversation = await prisma.conversation.create({
            data: {
                userId,
                title,
                messages: Array.isArray(messages) && messages.length > 0 ? {
                    create: messages.map((m: any) => ({
                        role: String(m.role || 'user'),
                        content: String(m.content || '')
                    }))
                } : undefined
            },
            select: { id: true, title: true, createdAt: true, updatedAt: true }
        })

        return Response.json({ success: true, conversation })
    } catch (error) {
        return Response.json({ success: false, error: (error as Error).message }, { status: 500 })
    }
} 