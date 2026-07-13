"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, MailCheck, RotateCcw } from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { resendOtp, verifyEmail } from "@/lib/api/auth";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailFromUrl = useMemo(
    () => searchParams.get("email") ?? "",
    [searchParams],
  );

  const [email, setEmail] = useState(emailFromUrl);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanEmail || !cleanOtp) {
      setError("Enter your email and OTP code.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await verifyEmail({
        email: cleanEmail,
        otp: cleanOtp,
      });

      setVerified(true);
      setOtp("");
      setMessage(response.message || "Email verified successfully. Redirecting to login...");

      window.setTimeout(() => {
        router.replace(`/login?email=${encodeURIComponent(cleanEmail)}`);
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify email.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Enter your email before requesting another OTP.");
      return;
    }

    setError("");
    setMessage("");
    setResending(true);

    try {
      const response = await resendOtp({ email: cleanEmail });
      setMessage(response.message || "OTP resent successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend OTP.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_85%_10%,rgba(100,38,255,0.12),transparent_30%),radial-gradient(circle_at_15%_20%,rgba(15,107,255,0.1),transparent_28%),#ffffff]">
      <div className="mx-auto grid min-h-screen max-w-[92rem] place-items-center px-5 py-10 lg:px-8">
        <section className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-enterprise transition-shadow duration-200">
          <div className="telefya-accent-line h-1.5" />

          <div className="p-6">
            <Link href="/" className="inline-flex transition-opacity duration-200 hover:opacity-80">
              <Image
                src="/images/telefya-logo.png"
                alt="Telefya"
                width={150}
                height={46}
                priority
                className="h-10 w-auto"
              />
            </Link>

            <div
              className={[
                "mt-8 grid h-14 w-14 place-items-center rounded-2xl transition-colors duration-200",
                verified
                  ? "bg-emerald-50 text-telefya-green"
                  : "bg-blue-50 text-telefya-blue",
              ].join(" ")}
            >
              {verified ? <CheckCircle2 size={28} /> : <MailCheck size={28} />}
            </div>

            <h1 className="mt-6 text-3xl font-black text-navy-900">
              {verified ? "Email verified" : "Verify your email"}
            </h1>

            <p className="mt-3 leading-7 text-navy-500">
              {verified
                ? "Your account is active. We are taking you to the login page."
                : "Enter the OTP sent to your email address to activate your Telefya account."}
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

            <form onSubmit={handleVerify} className="mt-7 grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-navy-900">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="user@example.com"
                  disabled={verified}
                  className="h-12 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-navy-900 shadow-soft outline-none transition-all duration-200 placeholder:text-navy-300 focus:border-telefya-blue focus:ring-2 focus:ring-telefya-blue/15 disabled:cursor-not-allowed disabled:bg-navy-50"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-navy-900">OTP code</span>
                <input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="123456"
                  disabled={verified}
                  className="h-12 rounded-xl border border-border bg-white px-4 text-center text-lg font-black tracking-[0.35em] text-navy-900 shadow-soft outline-none transition-all duration-200 placeholder:text-navy-300 focus:border-telefya-blue focus:ring-2 focus:ring-telefya-blue/15 disabled:cursor-not-allowed disabled:bg-navy-50"
                />
              </label>

              <button
                type="submit"
                disabled={loading || verified}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-5 font-black text-white shadow-soft transition-all duration-200 hover:bg-telefya-violet hover:shadow-enterprise disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                {verified ? "Verified" : loading ? "Verifying..." : "Verify email"}
              </button>
            </form>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending || !email || verified}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 font-black text-navy-900 transition-all duration-200 hover:border-telefya-blue hover:text-telefya-blue disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <RotateCcw size={18} />
              )}
              {resending ? "Sending..." : "Resend OTP"}
            </button>

            <p className="mt-7 text-center text-sm font-semibold text-navy-500">
              Already verified?{" "}
              <Link
                href="/login"
                className="font-black text-telefya-blue transition-colors duration-200 hover:text-telefya-violet"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}