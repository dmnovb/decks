import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth-token')?.value
        if (!token) return Response.json({ message: 'Not authenticated' }, { status: 401 })
        //@ts-ignore
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const userId = decoded.userId as string

        const conversation = await prisma.conversation.findFirst({
            where: { id: params.id, userId },
            select: {
                id: true,
                title: true,
                createdAt: true,
                updatedAt: true,
                messages: {
                    orderBy: { createdAt: 'asc' },
                    select: { id: true, role: true, content: true, createdAt: true }
                }
            }
        })

        if (!conversation) return Response.json({ message: 'Not found' }, { status: 404 })
        return Response.json({ success: true, conversation })
    } catch (error) {
        return Response.json({ success: false, error: (error as Error).message }, { status: 500 })
    }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth-token')?.value
        if (!token) return Response.json({ message: 'Not authenticated' }, { status: 401 })
        //@ts-ignore
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const userId = decoded.userId as string

        // Ensure the conversation belongs to user
        const convo = await prisma.conversation.findFirst({ where: { id: params.id, userId }, select: { id: true } })
        if (!convo) return Response.json({ message: 'Not found' }, { status: 404 })

        const body = await request.json().catch(() => ({}))
        const { role, content } = body || {}
        if (!role || !content) return Response.json({ message: 'role and content are required' }, { status: 400 })

        const message = await prisma.message.create({
            data: { conversationId: params.id, role, content }
        })

        await prisma.conversation.update({ where: { id: params.id }, data: { updatedAt: new Date() } })

        return Response.json({ success: true, message })
    } catch (error) {
        return Response.json({ success: false, error: (error as Error).message }, { status: 500 })
    }
} 