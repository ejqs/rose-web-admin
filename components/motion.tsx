"use client";

import { useEffect, useState, type ReactNode } from "react";
import ClickSpark from "@/components/ClickSpark";
import FadeContent from "@/components/FadeContent";
import Magnet from "@/components/Magnet";

function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

export function SparkShell({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className="min-h-svh">{children}</div>;
  return (
    <div className="min-h-svh">
      <ClickSpark sparkColor="#171717" sparkCount={6} sparkRadius={12} extraScale={0.8}>
        {children}
      </ClickSpark>
    </div>
  );
}

export function MagnetButton({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <Magnet padding={24} magnetStrength={3} wrapperClassName="inline-block">
      {children}
    </Magnet>
  );
}

export function FadeIn({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <FadeContent duration={400} threshold={0.05}>
      {children}
    </FadeContent>
  );
}
