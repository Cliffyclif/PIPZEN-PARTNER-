"use client";

import { Button } from "@/components/ui/button";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-400 mb-4">Something went wrong</h1>
        <p className="text-slate-400 mb-6">An unexpected error occurred. Please try again.</p>
        <Button
          onClick={reset}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
