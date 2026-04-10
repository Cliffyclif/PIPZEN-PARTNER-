import Image from "next/image";

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="PipZen" width={40} height={40} className="rounded-xl" />
            <div>
              <span className="text-xl font-bold text-white">PipZen</span>
              <span className="text-xs text-slate-400 font-medium ml-1">Admin</span>
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
