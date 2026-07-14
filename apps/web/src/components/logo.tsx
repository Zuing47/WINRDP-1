import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground",
        className
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
        <path
          d="M4 18 10 10l4 4 6-8"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2 outline-none">
      <LogoMark />
      {!compact && (
        <span className="text-[15px] font-semibold tracking-tight">
          Price<span className="text-primary">AI</span>
        </span>
      )}
    </Link>
  );
}
