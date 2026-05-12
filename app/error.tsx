"use client";
import Link from "next/link";

export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="px-5 pt-16 text-center">
      <div className="eyebrow">Error</div>
      <h1 className="mt-2 h-display text-[26px]">Something went wrong</h1>
      <p className="mt-2 text-[14px]" style={{ color: "var(--ink-3)" }}>
        We hit a snag loading this page. Try again, or head back home.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <button onClick={() => reset()} className="btn">Retry</button>
        <Link href="/" className="btn btn-ghost">Back to home</Link>
      </div>
    </div>
  );
}
