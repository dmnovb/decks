"use client";

import { useEffect, useRef } from "react";
import type { IrisConfig } from "@/providers/iris-provider";
import { useIrisContext } from "@/providers/iris-provider";

export type { IrisConfig, IrisSheetProps } from "@/providers/iris-provider";

export function useIris(config: IrisConfig | null) {
  const tokenRef = useRef<symbol | null>(null);
  const { registerIris, unregisterIris } = useIrisContext();

  if (!tokenRef.current) {
    tokenRef.current = Symbol("iris-registration");
  }

  useEffect(() => {
    if (!config || !tokenRef.current) return;
    registerIris(tokenRef.current, config);
  }, [config, registerIris]);

  useEffect(() => {
    const token = tokenRef.current;
    return () => {
      if (token) unregisterIris(token);
    };
  }, [unregisterIris]);
}

export function useIrisControls() {
  const { isOpen, openIris, closeIris, config } = useIrisContext();
  return { isOpen, openIris, closeIris, config };
}
