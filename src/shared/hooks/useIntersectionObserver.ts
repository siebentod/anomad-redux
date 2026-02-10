import { useEffect, useRef } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  root?: Element | null;
}

export function useIntersectionObserver<T extends HTMLElement = HTMLElement>(
  callback: () => void,
  options: UseIntersectionObserverOptions = {}
): React.RefObject<T | null> {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = false,
    root = null
  } = options;

  const elementRef = useRef<T | null>(null);
  const hasTriggeredRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Если уже сработал и triggerOnce=true, не создаем новый observer
    if (hasTriggeredRef.current && triggerOnce) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Если уже сработал и triggerOnce=true, игнорируем
        if (hasTriggeredRef.current && triggerOnce) return;

        if (entries[0].isIntersecting) {
          callback();
          if (triggerOnce) {
            hasTriggeredRef.current = true;
          }
        }
      },
      { threshold, rootMargin, root }
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, threshold, rootMargin, triggerOnce, root]);

  // Сброс флага hasTriggered при изменении callback (если нужно)
  useEffect(() => {
    hasTriggeredRef.current = false;
  }, [callback]);

  return elementRef;
}