import { generateToken, getUserByEmail, verifyPassword } from "@/lib/auth/helpers";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        const user = await getUserByEmail(email)

        if (!user || !await verifyPassword(password, user.password)) {
            return Response.json({ message: 'Invalid credentials' }, { status: 401 })
        }

        const token = generateToken({
            userId: user.id,
            email: user.email
        })

            ; (await cookies()).set('auth-token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60
            })

        return Response.json({
            id: user.id,
            email: user.email,
            name: user.name
        })

    } catch (error) {
        console.error('Login error:', error)
        return Response.json({ message: 'Server error' }, { status: 500 })
    }
}