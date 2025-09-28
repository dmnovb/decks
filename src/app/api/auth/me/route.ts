import { getUserById } from '@/lib/auth/helpers'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export async function GET() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth-token')?.value

        if (!token) {
            return Response.json({ message: 'Not authenticated' }, { status: 401 })
        }

        //@ts-ignore
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await getUserById(decoded.userId)

        return Response.json({
            id: user!.id,
            email: user!.email,
            name: user!.name
        })
    } catch (error) {
        return Response.json({ message: 'Invalid token' }, { status: 401 })
    }
}