import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";

const LINKS = [
  {
    label: "Issue Report",
    href: "https://github.com/potlock/potlaunch/issues/new",
    target: "_blank",
  },
  {
    label: "Docs",
    href: "https://docs.potlaunch.com",
    target: "_blank",
  },
  {
    label: "Chat",
    href: "https://potlock.org/community",
    target: "_blank",
  },
  {
    label: "Tutorial",
    href: "https://app.potlock.org",
    target: "_blank",
  },
  {
    label: "Tweet feedback",
    href: "https://twitter.com/intent/post?text=%40potlock_%20POTLAUNCH%20%23feedback%20",
    target: "_blank",
  },
];

export const HelpButton: React.FC = () => {
  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="w-12 h-12 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center hover:bg-gray-100 transition focus:outline-none"
            aria-label="Help"
          >
            <img src="/icons/circle-question-mark.svg" alt="Help" className="w-7 h-7" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="min-w-[180px] p-0 bg-white">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.target}
              rel="noopener noreferrer"
              tabIndex={-1}
            >
              <DropdownMenuItem className="cursor-pointer px-4 py-2 text-sm hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white">
                {link.label}
              </DropdownMenuItem>
            </a>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
