"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ExploreTokenCard from "../ExploreTokenCard";
import { Token } from "@/types/api";

type ExploreTokensCarouselProps = {
  tokens: Token[];
};

export default function ExploreTokensCarousel({ tokens }: ExploreTokensCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const touchStartXRef = useRef<number | null>(null);


  const visibleTokens = useMemo(() => tokens.slice(0, 12), [tokens]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const updateScrollState = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollPrev(scrollLeft > 0);
      setCanScrollNext(scrollLeft + clientWidth < scrollWidth - 1);
    };

    updateScrollState();
    container.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  const handleScroll = (direction: "prev" | "next") => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const scrollAmount = container.clientWidth;
    container.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  if (visibleTokens.length === 0) {
    return null;
  }

  return (
    <>
      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto md:overflow-x-hidden scroll-smooth snap-x snap-mandatory p-2 touch-pan-x"
        onTouchStart={(event) => {
          touchStartXRef.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchStartXRef.current === null) {
            return;
          }
          const endX = event.changedTouches[0]?.clientX ?? touchStartXRef.current;
          const deltaX = touchStartXRef.current - endX;
          touchStartXRef.current = null;

          const swipeThreshold = 40;
          if (Math.abs(deltaX) >= swipeThreshold) {
            handleScroll(deltaX > 0 ? "next" : "prev");
          }
        }}
      >
        {visibleTokens.map((token) => (
          <div
            key={token.id}
            data-token-card
            className="flex-shrink-0 w-full md:w-1/3 snap-center"
          >
            <ExploreTokenCard
              id={token.id.toString()}
              mint={token.mintAddress}
              totalSupply={token.totalSupply}
              banner={token.metadata.bannerUri}
              avatar={token.metadata.tokenUri}
              name={token.name}
              symbol={token.symbol}
              description={token.description}
              decimals={token.decimals}
              actionButton={{
                text: `Buy $${token.symbol}`,
                variant: "presale",
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-row justify-between items-center mt-6 gap-4">
        <a
          href="/token"
          className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
        >
          <span className="text-sm">Explore All</span>
        </a>

        <div className="flex justify-center">
          <div className="border border-black max-w-[200px] flex rounded-full">
            <button
              type="button"
              onClick={() => handleScroll("prev")}
              disabled={!canScrollPrev}
              className="h-8 md:h-10 w-8 md:w-12 p-2 border-r border-black rounded-l-full flex items-center justify-center transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 cursor-pointer"
              aria-label="Previous tokens"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleScroll("next")}
              disabled={!canScrollNext}
              className="h-8 md:h-10 w-8 md:w-12 p-2 flex items-center justify-center rounded-r-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 cursor-pointer"
              aria-label="Next tokens"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

