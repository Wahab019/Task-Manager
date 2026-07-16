"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@taskmanager.dev");
  const [password, setPassword] = useState("password123");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    localStorage.setItem("task-manager-auth", "true");
    router.push("/dashboard");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-300">
          Welcome back
        </p>
        <h1 className="text-3xl font-semibold text-white">Sign in to Task Manager</h1>
        <p className="text-sm text-slate-300">
          Use the demo account below to jump into your dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-2 text-sm text-slate-300">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400"
            placeholder="name@example.com"
            required
          />
        </label>

        <label className="block space-y-2 text-sm text-slate-300">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400"
            placeholder="••••••••"
            required
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-xl bg-sky-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-sky-400"
        >
          Log in
        </button>
      </form>

      <div className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
        Demo login: <span className="font-semibold text-white">demo@taskmanager.dev</span>
      </div>
    </div>
  );
}
