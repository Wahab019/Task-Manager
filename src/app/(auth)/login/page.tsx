"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Landmark, Loader2 } from "lucide-react";
import { z } from "zod";
import { account } from "@/lib/appwrite";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type FieldErrors = {
  email?: string;
  password?: string;
};

// Renders the Next.js page component for this route.
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Creates an Appwrite email/password session from the login form.
  // It clears stale sessions first so repeated logins do not collide.
  const createSession = async () => {
    if (typeof account.createEmailPasswordSession === "function") {
      await account.createEmailPasswordSession(email, password);
    } else if (typeof (account as any).createEmailSession === "function") {
      await (account as any).createEmailSession(email, password);
    } else {
      throw new Error("Appwrite authentication method not available.");
    }
  };

  // Validates and submits the current form state.
  // The exact side effect depends on the page or dialog that owns the handler.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    // Validate form inputs with Zod
    const validationResult = loginSchema.safeParse({ email, password });

    if (!validationResult.success) {
      const flattened = validationResult.error.flatten().fieldErrors;
      setFieldErrors({
        email: flattened.email?.[0],
        password: flattened.password?.[0],
      });
      return;
    }

    setLoading(true);

    try {
      try {
        await createSession();
      } catch (err: any) {
        if (
          err?.message?.includes("session is active") ||
          err?.code === 409 ||
          err?.type === "user_session_already_exists"
        ) {
          try {
            await account.deleteSession("current");
          } catch (_) {
            // Ignore error if session wasn't active
          }
          await createSession();
        } else {
          throw err;
        }
      }

      router.push("/dashboard");
    } catch (err: any) {
      setGeneralError(
        err?.message || "Failed to log in. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

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

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {generalError && (
          <div className="rounded-[3px] border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {generalError}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-bold tracking-[0.01em] text-[#4b5550]">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            placeholder="Enter your email"
            disabled={loading}
            className={`h-11 w-full rounded-[3px] border px-3 text-sm text-[#3f4944] outline-none placeholder:text-[#9ba29e] focus:ring-2 disabled:opacity-50 ${
              fieldErrors.email
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                : "border-[#dce0dd] focus:border-primary focus:ring-primary/10"
            }`}
          />
          {fieldErrors.email && (
            <p className="text-xs font-medium text-red-500 mt-1">
              {fieldErrors.email}
            </p>
          )}
        </div>

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
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              placeholder="Enter password"
              disabled={loading}
              className={`h-11 w-full rounded-[3px] border pl-3 pr-10 text-sm text-[#3f4944] outline-none focus:ring-2 disabled:opacity-50 ${
                fieldErrors.password
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                  : "border-[#dce0dd] focus:border-primary focus:ring-primary/10"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707772] hover:text-primary transition-colors disabled:opacity-50 cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-xs font-medium text-red-500 mt-1">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[#69716d]">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            disabled={loading}
            className="size-3.5 rounded-xs border-[#dce0dd] accent-primary"
          />
          Remember this workstation
        </label>

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-1.5 rounded-[3px] bg-primary text-xs font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#0a3026] disabled:opacity-70 cursor-pointer"
        >
          {loading ? (
            <>
              Logging In... <Loader2 className="size-4 animate-spin" />
            </>
          ) : (
            <>
              Log In <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
