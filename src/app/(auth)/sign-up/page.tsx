"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Landmark, Loader2 } from "lucide-react";
import { z } from "zod";
import { ID } from "appwrite";
import { account } from "@/lib/appwrite";

/**
 * Zod schema for validating sign-up form inputs.
 * Ensures the name, email, and password adhere to required constraints,
 * including Appwrite's minimum 8-character password requirement and matching confirmation.
 */
const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Full name is required")
      .min(2, "Name must be at least 2 characters"),
    email: z
      .string()
      .trim()
      .min(1, "Email address is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Type definition for tracking form validation errors.
 */
type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

/**
 * SignUpPage Component
 *
 * Renders the registration page for new users.
 * Validates user input via Zod, creates an Appwrite account with a unique ID,
 * establishes a session, and redirects to the dashboard.
 */
export default function SignUpPage() {
  const router = useRouter();

  // Local state for form inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Error handling state
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  /**
   * Helper function to establish a session with Appwrite.
   */
  const createSession = async () => {
    if (typeof account.createEmailPasswordSession === "function") {
      await account.createEmailPasswordSession(email, password);
    } else if (typeof (account as any).createEmailSession === "function") {
      await (account as any).createEmailSession(email, password);
    } else {
      throw new Error("Appwrite authentication method not available.");
    }
  };

  /**
   * Handles user registration submission.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    // Validate inputs with Zod
    const validationResult = signUpSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!validationResult.success) {
      const flattened = validationResult.error.flatten().fieldErrors;
      setFieldErrors({
        name: flattened.name?.[0],
        email: flattened.email?.[0],
        password: flattened.password?.[0],
        confirmPassword: flattened.confirmPassword?.[0],
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Create the Appwrite user account
      await account.create(ID.unique(), email, password, name);

      // 2. Establish active session, clearing any dangling session if needed
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

      // 3. Redirect to the dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setGeneralError(
        err?.message || "Failed to create account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-7">
      <header className="space-y-3 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
          <Landmark className="size-7" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-[25px] leading-none font-semibold text-primary">
            Task Manager
          </h1>
          <p className="mt-2 text-xs text-[#737b76]">
            Create an account to start managing your tasks
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {generalError && (
          <div className="rounded-[3px] border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {generalError}
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold tracking-[0.01em] text-[#4b5550]">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) {
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            placeholder="Enter your full name"
            disabled={loading}
            className={`h-11 w-full rounded-[3px] border px-3 text-sm text-[#3f4944] outline-none placeholder:text-[#9ba29e] focus:ring-2 disabled:opacity-50 ${
              fieldErrors.name
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                : "border-[#dce0dd] focus:border-primary focus:ring-primary/10"
            }`}
          />
          {fieldErrors.name && (
            <p className="text-xs font-medium text-red-500 mt-1">
              {fieldErrors.name}
            </p>
          )}
        </div>

        {/* Email Address */}
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

        {/* Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-xs font-bold tracking-[0.01em] text-[#4b5550]"
          >
            Password
          </label>
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
              placeholder="Create a password (min 8 chars)"
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

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-bold tracking-[0.01em] text-[#4b5550]"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    confirmPassword: undefined,
                  }));
                }
              }}
              placeholder="Re-enter your password"
              disabled={loading}
              className={`h-11 w-full rounded-[3px] border pl-3 pr-10 text-sm text-[#3f4944] outline-none focus:ring-2 disabled:opacity-50 ${
                fieldErrors.confirmPassword
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                  : "border-[#dce0dd] focus:border-primary focus:ring-primary/10"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707772] hover:text-primary transition-colors disabled:opacity-50 cursor-pointer"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-xs font-medium text-red-500 mt-1">
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-1.5 rounded-[3px] bg-primary text-xs font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#0a3026] disabled:opacity-70 cursor-pointer"
        >
          {loading ? (
            <>
              Creating Account... <Loader2 className="size-4 animate-spin" />
            </>
          ) : (
            <>
              Sign Up <ArrowRight className="size-4" />
            </>
          )}
        </button>

        <div className="pt-2 text-center">
          <p className="text-xs text-[#737b76]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-primary underline underline-offset-2 hover:text-[#0a3026] transition-colors"
            >
              Log in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
