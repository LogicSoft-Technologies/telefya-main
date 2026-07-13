"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { loginUser } from "@/lib/api/auth";
import { getUserProfile } from "@/lib/api/users";
import { saveUser } from "@/lib/auth/session";
import { MeetingPreview } from "@/components/auth/MeetingPreview";
import { saveAccessToken, saveRefreshToken } from "@/lib/auth/tokens";


export default function Login() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setError("");
  setLoading(true);

  try {
    const response = await loginUser({
      email: email.trim().toLowerCase(),
      password,
    });

    if (!response.accessToken) {
      throw new Error("Login succeeded, but no access token was returned.");
    }

    saveAccessToken(response.accessToken);

    if (response.refreshToken) {
      saveRefreshToken(response.refreshToken);
    }

    let savedAnyUser = false;

    if (response.user) {
      saveUser(response.user);
      savedAnyUser = true;
    }

    try {
      const profile = await getUserProfile(response.accessToken);

      if (profile?.email || profile?.first_name || profile?.user_id || profile?.id) {
        saveUser(profile);
        savedAnyUser = true;
      }
    } catch (profileError) {
      console.error("Profile refresh after login failed:", profileError);
    }

    if (!savedAnyUser) {
      saveUser({
        email: email.trim().toLowerCase(),
        first_name: "",
        last_name: "",
      });
    }

    window.dispatchEvent(new Event("telefya-auth-change"));
    router.replace("/lobby");
  } catch (err) {
    setError(err instanceof Error ? err.message : "Unable to sign in.");
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="min-h-screen bg-white lg:flex">
      <aside className="hidden shrink-0 flex-col justify-between overflow-hidden bg-navy-900 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[460px] xl:w-[520px]">
        <div className="telefya-accent-line h-1" />

        <div className="flex flex-1 flex-col justify-between px-8 py-10 xl:px-10">
          <Link
            href="/"
            className="inline-flex w-fit rounded-xl bg-white px-4 py-3 shadow-soft transition-all duration-200 hover:shadow-enterprise"
          >
            <Image
              src="/images/telefya-logo.png"
              alt="Telefya"
              width={152}
              height={46}
              priority
              className="h-9 w-auto"
            />
          </Link>

          <div className="my-10 grid gap-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/70">
                <ShieldCheck size={15} className="text-telefya-green" />
                Secure workspace
              </div>

              <h1 className="mt-5 max-w-md text-4xl font-black leading-tight text-white">
                Welcome back to your Telefya meeting workspace.
              </h1>

              <p className="mt-4 max-w-md text-base leading-8 text-white/62">
                Sign in to manage rooms, live events, attendees, speakers, and
                organization controls from one polished dashboard.
              </p>
            </div>

            <MeetingPreview />
          </div>

          <p className="text-sm font-semibold leading-6 text-white/45">
            Enterprise meetings, live events, and secure collaboration for modern
            teams.
          </p>
        </div>
      </aside>

      <section className="telefya-aurora flex min-h-screen w-full flex-1 items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md rounded-xl border border-border bg-white/95 p-6 shadow-enterprise backdrop-blur">
          <div className="mb-9 lg:hidden">
            <Image
              src="/images/telefya-logo.png"
              alt="Telefya"
              width={146}
              height={44}
              priority
              className="h-9 w-auto"
            />
          </div>

          <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-blue">
            Sign in
          </span>

          <h2 className="mt-5 text-3xl font-black text-navy-900">
            Access your account
          </h2>

          <p className="mt-2 leading-7 text-navy-500">
            Continue to your Telefya workspace.
          </p>

          {error ? (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            >
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-black text-navy-900">Email</span>
              <span className="flex h-12 items-center gap-3 rounded-xl border border-border bg-white px-4 shadow-soft transition-all duration-200 focus-within:border-telefya-blue focus-within:ring-2 focus-within:ring-telefya-blue/15">
                <Mail size={18} className="shrink-0 text-navy-300" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-transparent text-sm font-semibold text-navy-900 outline-none placeholder:text-navy-300"
                />
              </span>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-navy-900">Password</span>
              <span className="flex h-12 items-center gap-3 rounded-xl border border-border bg-white px-4 shadow-soft transition-all duration-200 focus-within:border-telefya-blue focus-within:ring-2 focus-within:ring-telefya-blue/15">
                <LockKeyhole size={18} className="shrink-0 text-navy-300" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-transparent text-sm font-semibold text-navy-900 outline-none placeholder:text-navy-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="shrink-0 text-navy-400 transition-colors duration-200 hover:text-navy-900"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            <div className="flex items-center justify-between text-sm font-bold">
              <label className="flex items-center gap-2 text-navy-500">
                <input type="checkbox" className="h-4 w-4 accent-telefya-blue" />
                Remember me
              </label>

              <Link
                href="/forgot-password"
                className="text-telefya-blue transition-colors duration-200 hover:text-telefya-violet"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-5 font-black text-white shadow-soft transition-all duration-200 hover:bg-telefya-violet hover:shadow-enterprise disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-semibold text-navy-500">
            New to Telefya?{" "}
            <Link
              href="/register"
              className="font-black text-telefya-blue transition-colors duration-200 hover:text-telefya-violet"
            >
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}