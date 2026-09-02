import { useState, useEffect, useRef, useCallback } from "react";

export function useSmartScroll<T extends HTMLElement>() {
  const containerRef = useRef<T | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollBottomButton, setShowScrollBottomButton] = useState(false);

  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const threshold = 120;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = distanceToBottom <= threshold;

    setIsNearBottom(near);
    setShowScrollBottomButton(distanceToBottom > 300);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = containerRef.current;
    if (!el) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
    setIsNearBottom(true);
    setShowScrollBottomButton(false);
  }, []);

  // Auto-scroll on dependency change only if already near bottom
  const triggerAutoScroll = useCallback(() => {
    if (isNearBottom) {
      scrollToBottom(true);
    }
  }, [isNearBottom, scrollToBottom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, [checkScroll]);

  return {
    containerRef,
    isNearBottom,
    showScrollBottomButton,
    scrollToBottom,
    triggerAutoScroll,
    checkScroll,
  };
}
