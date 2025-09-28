'use client'

import { useAuth } from '@/providers/auth-provider'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/layout/sidebar/app-sidebar";
import { DecksProvider } from "@/providers";
import { Toaster } from "@/components/ui/sonner";

interface AuthGuardProps {
    children: React.ReactNode
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
    const { isAuthenticated, isLoading } = useAuth()

    const pathname = usePathname()

    const publicRoutes = ['/login', '/register']
    const isPublicRoute = publicRoutes.includes(pathname)

    useEffect(() => {
        if (!isLoading && !isAuthenticated && !isPublicRoute) {
            window.location.href = '/login'
        }
    }, [isAuthenticated, isLoading, isPublicRoute])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    if (isPublicRoute) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Toaster richColors />
                {children}
            </main>
        )
    }

    if (isAuthenticated) {
        return (
            <DecksProvider>
                <SidebarProvider>
                    <AppSidebar />
                    <main className="p-4 flex flex-col w-full">
                        <Toaster richColors />
                        {children}
                    </main>
                </SidebarProvider>
            </DecksProvider>
        )
    }

    return null
} 