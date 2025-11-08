"use client"

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface HeroClientProps {
  children: React.ReactNode;
}

export default function HeroClient({ children }: HeroClientProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.from('.home-stats .stat-card', {
        y: 24,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: '.home-stats',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return <div ref={rootRef}>{children}</div>;
}
