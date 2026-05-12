"use client";
import Link from "next/link";

export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="px-5 pt-16 text-center">
      <div className="text-5xl">🏃</div>
      <h1 className="mt-4 text-3xl font-black tracking-tight">Something tripped</h1>
      <p className="text-white/60 mt-2">
        We hit a snag loading this page. Try again, or head back to the map.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <button onClick={() => reset()} className="btn">Retry</button>
        <Link href="/" className="btn btn-ghost">Back to home</Link>
      </div>
    </div>
  );
}
