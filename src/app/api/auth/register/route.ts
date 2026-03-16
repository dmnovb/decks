import { createUser, generateToken, getUserByEmail } from "@/lib/auth/helpers";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { name, password, email } = await request.json()

        if (!email || !password) {
            return Response.json(
                { message: 'Email and password are required' },
                { status: 400 }
            )
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return Response.json({ message: 'Invalid email format' }, { status: 400 })
        }

        if (password.length < 8) {
            return Response.json({ message: 'Password must be at least 8 characters' }, { status: 400 })
        }

        const existingUser = await getUserByEmail(email)

        if (existingUser) {
            return Response.json(
                { message: 'User already exists' },
                { status: 400 }
            )
        }
        const user = await createUser(name, password, email)

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
        }, { status: 201 })

    } catch (error) {
        console.error('Registration error:', error)
        return Response.json({ message: 'Server error' }, { status: 500 })
    }
}