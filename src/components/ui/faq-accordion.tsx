"use client";

import React, { useId, useState } from "react";
import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

export interface FaqAccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  items: FaqItem[];
}

export function FaqAccordion({ items, className, ...props }: FaqAccordionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className={cn("w-full", className)} {...props}>
      <ul className="flex w-full flex-col">
        {items.map((item, index) => {
          const isActive = activeIndex === index;
          const panelId = `${baseId}-panel-${index}`;
          return (
            <li key={index} className="border-b border-border last:border-b-0">
              <button
                className={cn(
                  "relative flex min-h-[64px] w-full items-center py-5 pl-14 pr-12 text-left text-base transition-colors md:text-lg",
                  "border-l-[6px] outline-none focus-visible:bg-muted",
                  isActive
                    ? "border-l-brand bg-muted font-semibold text-primary"
                    : "border-l-border text-foreground/80 hover:border-l-primary/40 hover:bg-muted/60 hover:text-primary",
                )}
                onClick={() => setActiveIndex(isActive ? null : index)}
                aria-expanded={isActive}
                aria-controls={panelId}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-5 top-1/2 -translate-y-1/2 text-2xl leading-none transition-all",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {isActive ? "−" : "+"}
                </span>
                {item.question}
                <span
                  aria-hidden
                  className={cn(
                    "absolute right-6 block size-2 border-r-[2.5px] border-t-[2.5px] transition-transform duration-200",
                    isActive ? "-rotate-45 border-primary" : "rotate-[135deg] border-muted-foreground",
                  )}
                />
              </button>
              <div
                id={panelId}
                role="region"
                className={cn(
                  "grid border-l-[6px] transition-all duration-300 ease-in-out",
                  isActive ? "grid-rows-[1fr] border-l-brand bg-muted" : "grid-rows-[0fr] border-l-border",
                )}
              >
                <div className="overflow-hidden">
                  <div className="pb-6 pl-14 pr-8 pt-0 text-[0.95rem] leading-relaxed text-muted-foreground md:text-base">
                    {item.answer}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Adapted from Vengeance UI — https://www.vengenceui.com */
export default FaqAccordion;
