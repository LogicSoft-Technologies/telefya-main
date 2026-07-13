"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { resetPassword } from "@/lib/api/auth";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailFromUrl = useMemo(
    () => searchParams.get("email") ?? "",
    [searchParams]
  );

  const tokenFromUrl = useMemo(
    () => searchParams.get("token") ?? "",
    [searchParams]
  );

  const [email, setEmail] = useState(emailFromUrl);
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await resetPassword({
        email,
        token,
        password,
      });

      setMessage(response.message || "Password reset successfully.");

      window.setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_85%_10%,rgba(100,38,255,0.12),transparent_30%),radial-gradient(circle_at_15%_20%,rgba(15,107,255,0.1),transparent_28%),#ffffff]">
      <div className="mx-auto grid min-h-screen max-w-[92rem] place-items-center px-5 py-10 lg:px-8">
        <section className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-enterprise">
          <Link href="/" className="inline-flex">
            <Image
              src="/images/telefya-logo.png"
              alt="Telefya"
              width={150}
              height={46}
              priority
              className="h-10 w-auto"
            />
          </Link>

          <div className="mt-8 grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-telefya-blue">
            <LockKeyhole size={28} />
          </div>

          <h1 className="mt-6 text-3xl font-black text-navy-900">
            Choose a new password
          </h1>

          <p className="mt-3 leading-7 text-navy-500">
            Enter your email, reset token, and new password to recover your
            account.
          </p>

          {message ? (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-7 grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-bold text-navy-900">Email</span>
              <span className="flex h-12 items-center gap-3 rounded-xl border border-border bg-white px-4 shadow-soft focus-within:border-telefya-blue">
                <Mail size={18} className="text-navy-300" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-transparent text-sm font-semibold text-navy-900 outline-none placeholder:text-navy-300"
                />
              </span>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-navy-900">
                Reset token
              </span>
              <input
                required
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="abc123resetToken"
                className="h-12 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-navy-900 shadow-soft outline-none placeholder:text-navy-300 focus:border-telefya-blue"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-navy-900">
                New password
              </span>
              <span className="flex h-12 items-center gap-3 rounded-xl border border-border bg-white px-4 shadow-soft focus-within:border-telefya-blue">
                <LockKeyhole size={18} className="text-navy-300" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="newpassword123"
                  className="w-full bg-transparent text-sm font-semibold text-navy-900 outline-none placeholder:text-navy-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-navy-400 hover:text-navy-900"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-5 font-black text-white shadow-soft hover:bg-telefya-violet disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              Reset password
            </button>
          </form>

          <Link
            href="/login"
            className="mt-7 inline-flex items-center gap-2 text-sm font-black text-telefya-blue"
          >
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
        </section>
      </div>
    </main>
  );
}