import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-dev-secret';

export const signJwt = (payload: string | object | Buffer) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyJwt = (token: string) => {
    try {
        return jwt.verify(token, JWT_SECRET) as { userId: string }
    } catch {
        return null
    }
}

