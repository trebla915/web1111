"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Options for scroll-driven parallax. Respects prefers-reduced-motion.
 * - content: layer moves with scroll but slower (e.g. hero content lags)
 * - background: layer moves opposite/slower (e.g. bg image depth)
 */
export type ParallaxDirection = "content" | "background";

export interface UseScrollParallaxOptions {
  /** 0–1. content: how much content lags (0.5 = half speed). background: how much bg moves (0.6 = 0.6x). */
  speed?: number;
  direction?: ParallaxDirection;
  /** Optional: only apply when element is in view (uses Intersection Observer). */
  whenInView?: boolean;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

/**
 * Returns a style object for scroll-based parallax. Mobile-friendly, throttled with rAF.
 * Use for hero content (content), venue/map background images (background).
 */
export function useScrollParallax(options: UseScrollParallaxOptions = {}) {
  const { speed = 0.5, direction = "content", whenInView = false } = options;
  const reduced = useReducedMotion();
  const [scrollY, setScrollY] = useState(0);
  const rafId = useRef<number | null>(null);
  const ticking = useRef(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      rafId.current = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  useEffect(() => {
    if (!whenInView || typeof window === "undefined") return;
    const el = elementRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { rootMargin: "20% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [whenInView]);

  const applyParallax = !reduced && (whenInView ? inView : true);

  const y =
    applyParallax && direction === "content"
      ? scrollY * (1 - speed) * 0.4
      : applyParallax && direction === "background"
        ? -scrollY * (1 - speed) * 0.35
        : 0;

  const style =
    y !== 0
      ? { transform: `translate3d(0, ${y}px, 0)`, willChange: "transform" as const }
      : undefined;

  const setRef = useCallback((node: HTMLElement | null) => {
    elementRef.current = node;
  }, []);

  return { style, ref: whenInView ? setRef : undefined };
}

/**
 * Parallax offset for a layer based on scroll. Use when you need the raw offset (e.g. for a child).
 */
export function useScrollY() {
  const reduced = useReducedMotion();
  const [scrollY, setScrollY] = useState(0);
  const rafId = useRef<number | null>(null);
  const ticking = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      rafId.current = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return { scrollY, reducedMotion: reduced };
}
