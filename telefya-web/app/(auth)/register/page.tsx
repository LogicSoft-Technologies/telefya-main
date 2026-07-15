"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarDays,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  ShieldCheck,
  User,
} from "lucide-react";
import { useState } from "react";
import { registerUser } from "@/lib/api/auth";
import {
  CountrySelect,
  PhoneCountrySelect,
} from "@/components/auth/CountrySelect";
import { MeetingPreview } from "@/components/auth/MeetingPreview";

const initialForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  password: "",
  country: "",
  state: "",
  city: "",
  date_of_birth: "",
  country_code: "+234",
};

export default function Register() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function validateForm() {
    if (form.password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (!form.country) {
      return "Please select your country.";
    }

    if (!form.country_code || !form.phone_number) {
      return "Please enter your phone number.";
    }

    return "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);

    try {
      await registerUser({
        ...form,
        email: form.email.trim().toLowerCase(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone_number: form.phone_number.trim(),
        state: form.state.trim(),
        city: form.city.trim(),
      });

      router.push(
        `/verify-email?email=${encodeURIComponent(
          form.email.trim().toLowerCase(),
        )}`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create account.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-white lg:flex">
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
                Secure onboarding
              </div>

              <h1 className="mt-5 max-w-md text-4xl font-black leading-tight text-white">
                Create your secure Telefya workspace.
              </h1>

              <p className="mt-4 max-w-md text-base leading-8 text-white/62">
                Register your profile, verify your email, and start managing
                meetings, speakers, attendees, and live sessions.
              </p>
            </div>

            <MeetingPreview />
          </div>

          <p className="text-sm font-semibold leading-6 text-white/45">
            Enterprise meetings, live events, and organization controls in one
            workspace.
          </p>
        </div>
      </aside>

      <section className="telefya-aurora flex min-h-dvh w-full flex-1 justify-center overflow-y-auto px-4 py-6 sm:px-8 sm:py-10 lg:px-14">
        <div className="w-full max-w-2xl">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link href="/" className="inline-flex">
              <Image
                src="/images/telefya-logo.png"
                alt="Telefya"
                width={146}
                height={44}
                priority
                className="h-8 w-auto sm:h-9"
              />
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-black text-navy-700 shadow-soft transition hover:border-telefya-blue hover:text-telefya-blue"
            >
              Sign in
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-white/95 p-5 shadow-enterprise backdrop-blur sm:p-6">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-telefya-blue sm:px-4 sm:text-xs">
              Start for free
            </span>

            <h2 className="mt-5 text-[clamp(1.85rem,8vw,2rem)] font-black leading-tight text-navy-900 sm:text-3xl">
              Create your account
            </h2>

            <p className="mt-2 leading-7 text-navy-500">
              Enter your details exactly as required for your Telefya profile.
            </p>

            {error ? (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700 sm:mt-6"
              >
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:mt-8 sm:gap-5">
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                <Field
                  label="First name"
                  icon={<User size={18} />}
                  value={form.first_name}
                  onChange={(value) => updateField("first_name", value)}
                  placeholder="John"
                  autoComplete="given-name"
                />

                <Field
                  label="Last name"
                  icon={<User size={18} />}
                  value={form.last_name}
                  onChange={(value) => updateField("last_name", value)}
                  placeholder="Doe"
                  autoComplete="family-name"
                />
              </div>

              <Field
                label="Email"
                type="email"
                icon={<Mail size={18} />}
                value={form.email}
                onChange={(value) => updateField("email", value)}
                placeholder="user@example.com"
                autoComplete="email"
              />

              <label className="grid gap-2">
                <span className="text-sm font-black text-navy-900">
                  Phone number
                </span>

                <div className="grid gap-2 sm:grid-cols-[170px_minmax(0,1fr)]">
                  <PhoneCountrySelect
                    value={form.country_code}
                    onChange={(dial) => updateField("country_code", dial)}
                  />

                  <span className="flex h-12 min-w-0 items-center rounded-xl border border-border bg-white px-4 shadow-soft transition-all duration-200 focus-within:border-telefya-blue focus-within:ring-2 focus-within:ring-telefya-blue/15">
                    <input
                      type="tel"
                      required
                      autoComplete="tel-national"
                      value={form.phone_number}
                      onChange={(event) =>
                        updateField("phone_number", event.target.value)
                      }
                      placeholder="801 234 5678"
                      className="min-w-0 w-full bg-transparent text-sm font-semibold text-navy-900 outline-none placeholder:text-navy-300"
                    />
                  </span>
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-navy-900">Country</span>
                <CountrySelect
                  value={form.country}
                  onChange={(name) => updateField("country", name)}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                <Field
                  label="State"
                  icon={<MapPin size={18} />}
                  value={form.state}
                  onChange={(value) => updateField("state", value)}
                  placeholder="Lagos"
                  autoComplete="address-level1"
                />

                <Field
                  label="City"
                  icon={<Building2 size={18} />}
                  value={form.city}
                  onChange={(value) => updateField("city", value)}
                  placeholder="Ikeja"
                  autoComplete="address-level2"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                <Field
                  label="Date of birth"
                  type="date"
                  icon={<CalendarDays size={18} />}
                  value={form.date_of_birth}
                  onChange={(value) => updateField("date_of_birth", value)}
                  autoComplete="bday"
                />

                <label className="grid gap-2">
                  <span className="text-sm font-black text-navy-900">
                    Password
                  </span>

                  <span className="flex h-12 min-w-0 items-center gap-3 rounded-xl border border-border bg-white px-4 shadow-soft transition-all duration-200 focus-within:border-telefya-blue focus-within:ring-2 focus-within:ring-telefya-blue/15">
                    <LockKeyhole
                      size={18}
                      className="shrink-0 text-navy-300"
                    />

                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(event) =>
                        updateField("password", event.target.value)
                      }
                      placeholder="Minimum 8 characters"
                      className="min-w-0 w-full bg-transparent text-sm font-semibold text-navy-900 outline-none placeholder:text-navy-300"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="shrink-0 text-navy-400 transition-colors duration-200 hover:text-navy-900"
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-5 font-black text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:bg-telefya-violet hover:shadow-enterprise disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm font-semibold text-navy-500 sm:mt-8">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-black text-telefya-blue transition-colors duration-200 hover:text-telefya-violet"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  icon: React.ReactNode;
  autoComplete?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-navy-900">{label}</span>

      <span className="flex h-12 min-w-0 items-center gap-3 rounded-xl border border-border bg-white px-4 shadow-soft transition-all duration-200 focus-within:border-telefya-blue focus-within:ring-2 focus-within:ring-telefya-blue/15">
        <span className="shrink-0 text-navy-300">{icon}</span>

        <input
          type={type}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 w-full bg-transparent text-sm font-semibold text-navy-900 outline-none placeholder:text-navy-300"
        />
      </span>
    </label>
  );
}