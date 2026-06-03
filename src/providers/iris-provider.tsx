"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { Plus, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface IrisSheetProps {
  close: () => void;
}

export interface IrisConfig {
  title: string;
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
  content: (props: IrisSheetProps) => ReactNode;
}

interface IrisRegistration {
  token: symbol;
  config: IrisConfig;
}

interface IrisContextValue {
  config: IrisConfig | null;
  isOpen: boolean;
  registerIris: (token: symbol, config: IrisConfig) => void;
  unregisterIris: (token: symbol) => void;
  openIris: () => void;
  closeIris: () => void;
}

const IrisContext = createContext<IrisContextValue | null>(null);

export function IrisProvider({ children }: { children: ReactNode }) {
  const [registration, setRegistration] = useState<IrisRegistration | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const registerIris = useCallback((token: symbol, config: IrisConfig) => {
    setRegistration({ token, config });
  }, []);

  const unregisterIris = useCallback((token: symbol) => {
    setRegistration((current) => {
      if (current?.token !== token) return current;
      setIsOpen(false);
      return null;
    });
  }, []);

  const openIris = useCallback(() => {
    setIsOpen(() => {
      if (!registration || registration.config.disabled) return false;
      return true;
    });
  }, [registration]);

  const closeIris = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo<IrisContextValue>(
    () => ({
      config: registration?.config ?? null,
      isOpen,
      registerIris,
      unregisterIris,
      openIris,
      closeIris,
    }),
    [closeIris, isOpen, openIris, registerIris, registration, unregisterIris],
  );

  return (
    <IrisContext.Provider value={value}>
      <LayoutGroup id="iris-root">
        {children}
        {isMounted &&
          createPortal(
            <IrisPortal
              config={registration?.config ?? null}
              isOpen={isOpen}
              closeIris={closeIris}
              prefersReducedMotion={prefersReducedMotion}
            />,
            document.body,
          )}
      </LayoutGroup>
    </IrisContext.Provider>
  );
}

export function useIrisContext() {
  const context = useContext(IrisContext);
  if (!context) {
    throw new Error("useIrisContext must be used within IrisProvider");
  }
  return context;
}

function IrisPortal({
  config,
  isOpen,
  closeIris,
  prefersReducedMotion,
}: {
  config: IrisConfig | null;
  isOpen: boolean;
  closeIris: () => void;
  prefersReducedMotion: boolean | null;
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeIris();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeIris, isOpen]);

  if (!config) return null;

  const Icon = config.icon ?? Plus;
  const layoutTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { type: "spring" as const, duration: 0.28, bounce: 0.08 };
  const fadeTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { duration: 0.16, ease: [0.23, 1, 0.32, 1] as const };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.button
            key="iris-overlay"
            type="button"
            aria-label="Close Iris"
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeTransition}
            onClick={closeIris}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="iris-sheet-shell"
            className="fixed inset-x-3 z-[70] pointer-events-none md:hidden"
            style={{ bottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
          >
            <motion.section
              layoutId="iris"
              role="dialog"
              aria-modal="true"
              aria-label={config.label}
              className={cn(
                "pointer-events-auto mx-auto flex w-full max-w-[430px] flex-col overflow-hidden",
                "rounded-[28px] bg-foreground text-background",
                "shadow-[0_26px_80px_oklch(0%_0_0_/_0.38),0_8px_24px_oklch(0%_0_0_/_0.22)]",
                "max-h-[min(72dvh,560px)]",
              )}
              transition={{ layout: layoutTransition }}
            >
              <motion.div
                className="flex items-center justify-between gap-3 px-4 pb-3 pt-4"
                initial={{ opacity: 0, filter: "blur(3px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(3px)" }}
                transition={{ ...fadeTransition, delay: prefersReducedMotion ? 0 : 0.05 }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background/10 text-background">
                    <Icon size={16} strokeWidth={2.25} />
                  </span>
                  <h2 className="truncate text-sm font-semibold leading-none text-background">
                    {config.title}
                  </h2>
                </div>

                <button
                  type="button"
                  aria-label="Close Iris"
                  onClick={closeIris}
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    "bg-background/10 text-background/70 transition-[background-color,color,transform] duration-150",
                    "hover:bg-background/15 hover:text-background active:scale-[0.96]",
                  )}
                >
                  <X size={15} />
                </button>
              </motion.div>

              <motion.div
                className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-4"
                initial={{ opacity: 0, transform: "translateY(6px)", filter: "blur(2px)" }}
                animate={{ opacity: 1, transform: "translateY(0)", filter: "blur(0px)" }}
                exit={{ opacity: 0, transform: "translateY(4px)", filter: "blur(2px)" }}
                transition={{ ...fadeTransition, delay: prefersReducedMotion ? 0 : 0.07 }}
              >
                {config.content({ close: closeIris })}
              </motion.div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
