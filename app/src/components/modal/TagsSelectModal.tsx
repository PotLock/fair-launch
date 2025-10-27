"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const TAG_OPTIONS = [
  "meme",
  "ai",
  "defi",
  "games",
  "infra",
  "de-sci",
  "social",
  "depin",
  "charity",
  "others",
] as const;

export type TagOption = typeof TAG_OPTIONS[number];

// Tag icons mapping
export const TAG_ICONS: Record<string, string> = {
  meme: "😄",
  ai: "🤖",
  defi: "💰",
  games: "🎮",
  infra: "🏗️",
  "de-sci": "🔬",
  social: "💬",
  depin: "📡",
  charity: "❤️",
  others: "📦",
};

interface TagsSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: string[]; // selected tags controlled
  defaultValue?: string[]; // initial selected tags uncontrolled
  onConfirm: (selected: string[]) => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

export function TagsSelectModal({
  open,
  onOpenChange,
  value,
  defaultValue,
  onConfirm,
  title = "Select Tags",
  description = "You can select multiple tags for your token",
  confirmText = "Apply",
  cancelText = "Cancel",
}: TagsSelectModalProps) {
  const initial = useMemo(() => new Set((value ?? defaultValue ?? []).map((t) => t.toLowerCase())), [value, defaultValue]);
  const [selected, setSelected] = useState<Set<string>>(initial);

  // keep in sync when controlled value changes
  useEffect(() => {
    setSelected(new Set((value ?? defaultValue ?? []).map((t) => t.toLowerCase())));
  }, [value, defaultValue]);

  const toggleTag = (tag: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const clearAll = () => setSelected(new Set());

  const handleConfirm = () => {
    onConfirm(Array.from(selected));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900">{title}</DialogTitle>
          <DialogDescription className="text-base text-gray-600 mt-2">{description}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 py-4">
          {TAG_OPTIONS.map((tag) => {
            const isSelected = selected.has(tag);
            const icon = TAG_ICONS[tag] || "📦";
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  "group relative px-3 py-2 rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-sm cursor-pointer",
                  isSelected
                    ? "bg-red-50 border-red-500"
                    : "bg-white border-gray-200 hover:border-gray-300"
                )}
              >
                <span className="text-base">{icon}</span>
                <span className={cn(
                  "text-xs font-medium capitalize transition-colors",
                  isSelected ? "text-red-600" : "text-gray-700"
                )}>{tag}</span>
                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            type="button"
            onClick={clearAll}
            disabled={selected.size === 0}
            className={cn(
              "w-full sm:w-auto px-6 py-2.5 text-sm font-medium rounded-lg border border-gray-300 transition-colors cursor-pointer",
              selected.size === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50"
            )}
          >
            Clear All
          </button>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm cursor-pointer"
            >
              {confirmText}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
