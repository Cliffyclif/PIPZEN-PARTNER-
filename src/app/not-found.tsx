import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-amber-400 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-white mb-2">Page Not Found</h2>
        <p className="text-slate-400 mb-6">The page you are looking for does not exist.</p>
        <Link href="/">
          <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
