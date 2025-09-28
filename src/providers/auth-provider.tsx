'use client'

import { User } from "@/generated/prisma";
import { useRouter } from "next/navigation";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

interface Auth {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    register: (name: string, password: string, email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<Auth>({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login: async () => ({ success: false }),
    logout: async () => { },
    register: async () => ({ success: false })
})

export const AuthProvider = ({ children }: PropsWithChildren) => {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const router = useRouter()

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        try {
            console.log('Checking authentication...')
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            })

            if (response.ok) {
                const userData = await response.json()
                setUser(userData)
            } else {
                setUser(null)
            }
        } catch (error) {
            console.error('Auth check failed:', error)
            setUser(null)
        } finally {
            setIsLoading(false)
            console.log('Auth loading complete')
        }
    }

    const login = async (email: string, password: string) => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            })

            if (res.ok) {
                const userData = await res.json()
                setUser(userData)
                router.push('/')
                toast.success('Logged in.')

                return { success: true }
            } else {
                const error = await res.json()
                return { success: false, error: error.message }
            }
        } catch (error) {
            toast.error((error as Error).message)
            return { success: false, error: (error as Error).message }
        } finally {
            setIsLoading(false)
        }
    }

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            })
            setUser(null)
            router.push('/login')
        } catch (error) {
            console.error('Logout failed:', error)
        }
    }

    const register = async (name: string, password: string, email: string) => {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            })

            if (res.ok) {
                const userData = await res.json()
                setUser(userData)
                router.push('/')
                return { success: true }
            } else {
                const error = await res.json()
                return { success: false, error: error.message }
            }
        } catch (error) {
            return { success: false, error: 'Registration failed' }
        }
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, register, isLoading, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)