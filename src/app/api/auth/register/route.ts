import { createUser, getUserByEmail } from "@/lib/auth/helpers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { name, password, email } = await request.json()

        if (!email || !password) {
            return Response.json(
                { message: 'Invalid input!' },
                { status: 400 }
            )
        }

        const existingUser = await getUserByEmail(email)

        if (existingUser) {
            return Response.json(
                { message: 'User already exists' },
                { status: 400 }
            )
        }
        const user = await createUser(name, password, email)

        return Response.json({ user }, { status: 201 })

    } catch (error) {
        console.error('Registration error:', error)
        return Response.json({ message: 'Server error' }, { status: 500 })
    }
}