"use client";

import { useAuth } from "@/providers/auth-provider";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { DecksProvider } from "@/providers";
import { FoldersProvider } from "@/providers/folders-provider";
import { ChatStateProvider } from "@/providers/chat-state-provider";
import { NavPanel } from "@/layout/nav-panel";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isInitializing } = useAuth();

  const pathname = usePathname();

  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (!isInitializing && !isAuthenticated && !isPublicRoute) {
      window.location.href = "/login";
    }
  }, [isAuthenticated, isInitializing, isPublicRoute]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isPublicRoute) {
    return <main className="min-h-screen flex items-center justify-center">{children}</main>;
  }

  if (isAuthenticated) {
    return (
      <DecksProvider>
        <FoldersProvider>
          <ChatStateProvider>
            <div className="flex h-screen w-screen overflow-hidden bg-background">
              <NavPanel />
              <main className="flex-1 flex flex-col overflow-y-auto">{children}</main>
            </div>
          </ChatStateProvider>
        </FoldersProvider>
      </DecksProvider>
    );
  }

  return null;
};
