import bcrypt from 'bcrypt'
import jwt, { Jwt } from 'jsonwebtoken'
import prisma from "@/lib/prisma";

export const hashPassword = async (pass: string) => bcrypt.hash(pass, 12)
export const verifyPassword = async (pass: string, hashed: string) => bcrypt.compare(pass, hashed)

//@ts-ignore
export const generateToken = (payload: any) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })

export const verifyToken = (token: string) => {
    try {
        //@ts-ignore
        return jwt.verify(token, process.env.JWT_SECRET)
    } catch {
        return null
    }
}

export const getUserByEmail = async (email: string) => {
    return prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            name: true,
            password: true
        }
    })
}

export const getUserById = async (id: string) => {
    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            name: true,
        }
    })
}

export const createUser = async (name: string, password: string, email: string) => {
    const hashedPassword = await hashPassword(password)

    return prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name
        },
        select: {
            id: true,
            email: true,
            name: true
        }
    })
}
