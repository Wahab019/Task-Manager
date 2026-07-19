import Link from "next/link";
import { ArrowRight, CircleHelp, Globe2, Landmark } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
          <Landmark className="size-7" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-[25px] leading-none font-semibold text-primary">
            Task Manager
          </h1>
        </div>
      </header>

      <div className="space-y-5">
        <label className="block space-y-1.5">
          <span className="text-xs font-bold tracking-[0.01em] text-[#4b5550]">
            Email Address
          </span>
          <input
            type="email"
            defaultValue="executive@heritage.com"
            className="h-11 w-full rounded-[3px] border border-[#dce0dd] px-3 text-sm text-[#3f4944] outline-none placeholder:text-[#9ba29e] focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </label>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-xs font-bold tracking-[0.01em] text-[#4b5550]"
            >
              Password
            </label>
            <Link
              href="/reset-password"
              className="text-[10px] font-bold text-primary underline underline-offset-2"
            >
              Forgot Password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            defaultValue="password"
            className="h-11 w-full rounded-[3px] border border-[#dce0dd] px-3 text-sm text-[#3f4944] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[#69716d]">
          <input
            type="checkbox"
            className="size-3.5 rounded-xs border-[#dce0dd] accent-primary"
          />
          Remember this workstation
        </label>

        <Link
          href="/dashboard"
          className="flex h-12 w-full items-center justify-center gap-1.5 rounded-[3px] bg-primary text-xs font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#0a3026]"
        >
          Log In <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
