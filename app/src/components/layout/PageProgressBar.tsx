'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Custom event for triggering progress
const PROGRESS_START_EVENT = 'progressbar:start';

// Export function to manually trigger progress bar
export function triggerProgressBar() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PROGRESS_START_EVENT));
  }
}

export function PageProgressBar() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimersRef = useRef<NodeJS.Timeout[]>([]);
  const previousPathRef = useRef(pathname + searchParams.toString());

  const clearProgressTimers = () => {
    progressTimersRef.current.forEach(timer => clearTimeout(timer));
    progressTimersRef.current = [];
  };

  const startProgressAnimation = () => {
    clearProgressTimers();
    setIsVisible(true);
    setProgress(0);

    // Animate progress
    progressTimersRef.current.push(setTimeout(() => setProgress(30), 50));
    progressTimersRef.current.push(setTimeout(() => setProgress(60), 200));
    progressTimersRef.current.push(setTimeout(() => setProgress(80), 400));
  };

  // Handle route change completion
  useEffect(() => {
    const currentPath = pathname + searchParams.toString();

    if (previousPathRef.current !== currentPath) {
      // Route changed, complete the progress
      clearProgressTimers();
      setProgress(100);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 300);

      previousPathRef.current = currentPath;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname, searchParams]);

  // Listen for navigation events
  useEffect(() => {
    // Handle custom progress event
    const handleProgressStart = () => {
      startProgressAnimation();
    };

    // Handle link clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link) {
        const href = link.getAttribute('href');
        const isExternal = link.target === '_blank' || link.rel?.includes('external');
        const isAnchor = href?.startsWith('#');
        const isDownload = link.hasAttribute('download');

        if (href && !isExternal && !isAnchor && !isDownload) {
          const isSameOrigin = href.startsWith('/') || href.startsWith(window.location.origin);

          if (isSameOrigin) {
            const currentPath = window.location.pathname + window.location.search;
            let newPath = href;

            if (href.startsWith(window.location.origin)) {
              const url = new URL(href);
              newPath = url.pathname + url.search;
            }

            if (currentPath !== newPath) {
              startProgressAnimation();
            }
          }
        }
      }
    };

    // Handle browser back/forward
    const handlePopState = () => {
      startProgressAnimation();
    };

    window.addEventListener(PROGRESS_START_EVENT, handleProgressStart);
    document.addEventListener('click', handleClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener(PROGRESS_START_EVENT, handleProgressStart);
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('popstate', handlePopState);
      clearProgressTimers();
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[3px] bg-gradient-to-r from-[#FF6B6B] via-[#FF8E53] to-[#FFF5F5]"
      style={{
        width: `${progress}%`,
        opacity: progress > 0 ? 1 : 0,
        transition: progress === 100
          ? 'width 200ms ease-out, opacity 200ms ease-out 200ms'
          : 'width 300ms ease-in-out',
        boxShadow: '0 0 10px rgba(255, 107, 107, 0.5), 0 0 5px rgba(255, 142, 83, 0.3)',
      }}
    />
  );
}
