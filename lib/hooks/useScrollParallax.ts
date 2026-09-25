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
 * Scroll-based parallax. Attach the returned `ref` to a layer that also carries
 * the `.parallax-layer` class (styles/globals.css). The hook writes the offset
 * to that layer's `--parallax-y` custom property each animation frame, so the
 * component renders no inline style and does not re-render on scroll.
 * Use for hero content (content), venue/map background images (background).
 */
export function useScrollParallax(options: UseScrollParallaxOptions = {}) {
  const { speed = 0.5, direction = "content", whenInView = false } = options;
  const reduced = useReducedMotion();
  const elementRef = useRef<HTMLElement | null>(null);
  const inView = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const scrollRoot = document.getElementById("__scroll-root");
    const getScrollY = () => (scrollRoot ? scrollRoot.scrollTop : window.scrollY);
    let rafId: number | null = null;

    const apply = () => {
      rafId = null;
      const el = elementRef.current;
      if (!el) return;
      const scrollY = getScrollY();
      const active = !reduced && (whenInView ? inView.current : true);
      const y = !active
        ? 0
        : direction === "content"
          ? scrollY * (1 - speed) * 0.4
          : -scrollY * (1 - speed) * 0.35;
      el.style.setProperty("--parallax-y", `${y}px`);
    };
    const onScroll = () => {
      if (rafId == null) rafId = requestAnimationFrame(apply);
    };

    let io: IntersectionObserver | undefined;
    if (whenInView && elementRef.current) {
      io = new IntersectionObserver(
        ([e]) => {
          inView.current = e.isIntersecting;
          onScroll();
        },
        { rootMargin: "20% 0px" }
      );
      io.observe(elementRef.current);
    }

    const target = scrollRoot ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      target.removeEventListener("scroll", onScroll);
      io?.disconnect();
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [reduced, speed, direction, whenInView]);

  const ref = useCallback((node: HTMLElement | null) => {
    elementRef.current = node;
  }, []);

  return { ref };
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
    const scrollRoot = document.getElementById("__scroll-root");
    const getScrollY = () => (scrollRoot ? scrollRoot.scrollTop : window.scrollY);
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      rafId.current = requestAnimationFrame(() => {
        setScrollY(getScrollY());
        ticking.current = false;
      });
    };
    const target = scrollRoot ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      target.removeEventListener("scroll", onScroll);
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return { scrollY, reducedMotion: reduced };
}
