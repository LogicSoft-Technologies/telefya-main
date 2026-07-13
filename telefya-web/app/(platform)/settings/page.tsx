"use client";

import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  Save,
  ShieldCheck,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  type UserProfileUpdatePayload,
} from "@/lib/api/users";
import { getSavedUser, saveUser } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/api/auth";

type ProfileUser = AuthUser & {
  image?: string | null;
  profile_image?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
  role?: string;
  roles?: string;
};

type Notice = {
  type: "success" | "error";
  message: string;
};

function getFullName(user: ProfileUser | null) {
  return (
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
    user?.email ||
    "Telefya user"
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getImageValue(user: ProfileUser | null) {
  return (
    user?.profile_image || user?.avatar_url || user?.avatar || user?.image || ""
  );
}

function getAssetUrl(value?: string | null) {
  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    "http://localhost:5000";

  const cleanPath = value
    .replace(/^\.\/public\//, "/")
    .replace(/^public\//, "/")
    .replace(/\\/g, "/");

  return `${backendUrl}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;
}

function toInputDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);

  return date.toISOString().slice(0, 10);
}

function buildForm(user: ProfileUser | null): UserProfileUpdatePayload {
  return {
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone_number: user?.phone_number || "",
    country_code: user?.country_code || "",
    country: user?.country || "",
    state: user?.state || "",
    city: user?.city || "",
    date_of_birth: toInputDate(user?.date_of_birth),
  };
}

export default function SettingsPage() {
  const [user, setUser] = useState<ProfileUser | null>(() => {
    return getSavedUser() as ProfileUser | null;
  });
  const [form, setForm] = useState<UserProfileUpdatePayload>(() =>
    buildForm(getSavedUser() as ProfileUser | null),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const displayName = useMemo(() => getFullName(user), [user]);
  const initials = getInitials(displayName);
  const imageUrl = previewUrl || getAssetUrl(getImageValue(user));
  const verified = Boolean(user?.is_verified);
  const role = user?.role || user?.roles || "User";

  const dirty = useMemo(() => {
    if (!user) return false;
    return JSON.stringify(form) !== JSON.stringify(buildForm(user));
  }, [form, user]);

  function updateField(name: keyof UserProfileUpdatePayload, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function loadProfile() {
    setLoading(true);
    setNotice(null);

    try {
      const profile = (await getUserProfile()) as ProfileUser;
      setUser(profile);
      setForm(buildForm(profile));
      saveUser(profile, { notify: false });
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Unable to load profile.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);

    try {
      const updatedProfile = (await updateUserProfile({
        first_name: form.first_name?.trim(),
        last_name: form.last_name?.trim(),
        phone_number: form.phone_number?.trim(),
        country_code: form.country_code?.trim(),
        country: form.country?.trim(),
        state: form.state?.trim(),
        city: form.city?.trim(),
        date_of_birth: form.date_of_birth,
      })) as ProfileUser;

      const nextUser = {
        ...(user || {}),
        ...updatedProfile,
      };

      setUser(nextUser);
      setForm(buildForm(nextUser));
      saveUser(nextUser, { notify: true });

      setNotice({
        type: "success",
        message: "Profile updated successfully.",
      });
    } catch (err) {
      setNotice({
        type: "error",
        message:
          err instanceof Error ? err.message : "Unable to update profile.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setUploading(true);
    setNotice(null);

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      await uploadProfileImage(file);

      const profile = (await getUserProfile()) as ProfileUser;
      setPreviewUrl("");
      setUser(profile);
      setForm(buildForm(profile));
      saveUser(profile, { notify: true });

      setNotice({
        type: "success",
        message: "Profile image uploaded successfully.",
      });
    } catch (err) {
      setPreviewUrl("");
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Unable to upload image.",
      });
    } finally {
      URL.revokeObjectURL(localPreview);
      setUploading(false);
    }
  }

  function resetForm() {
    setForm(buildForm(user));
    setNotice(null);
  }

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-telefya-blue">
            Settings
          </p>

          <h1 className="mt-2 text-3xl font-black text-navy-900">
            Profile and account
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-navy-500">
            Manage your Telefya identity, contact details, verification
            status, and workspace profile image.
          </p>
        </div>

        <button
          onClick={loadProfile}
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-black text-navy-700 shadow-soft hover:border-telefya-blue hover:text-telefya-blue disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <RefreshCcw size={17} />
          )}
          Refresh
        </button>
      </div>

      {notice ? (
        <div
          className={[
            "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-bold",
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          ].join(" ")}
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          ) : (
            <X size={18} className="mt-0.5 shrink-0" />
          )}
          {notice.message}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border bg-white shadow-soft">
        {loading ? (
          <div className="flex items-center gap-3 p-6 font-bold text-navy-500">
            <Loader2 size={18} className="animate-spin text-telefya-blue" />
            Loading profile...
          </div>
        ) : (
          <div className="grid gap-0 lg:grid-cols-[340px_1fr]">
            <aside className="border-b border-border bg-navy-50 p-6 lg:border-b-0 lg:border-r">
              <div className="relative h-32 w-32 overflow-hidden rounded-xl bg-white shadow-soft">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-3xl font-black text-telefya-blue">
                    {initials}
                  </div>
                )}

                <label className="absolute bottom-3 right-3 grid h-10 w-10 cursor-pointer place-items-center rounded-lg bg-telefya-blue text-white shadow-soft hover:bg-telefya-violet">
                  {uploading ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Camera size={17} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              <h2 className="mt-6 text-xl font-black text-navy-900">
                {displayName}
              </h2>

              <p className="mt-1 break-all text-sm font-semibold text-navy-500">
                {user?.email || "No email on profile"}
              </p>

              <div className="mt-5 grid gap-3">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-navy-500 shadow-soft">
                  <BadgeCheck
                    size={15}
                    className={
                      verified ? "text-telefya-green" : "text-telefya-gold"
                    }
                  />
                  {verified ? "Verified account" : "Verification pending"}
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-navy-500 shadow-soft">
                  <ShieldCheck size={15} className="text-telefya-blue" />
                  {role}
                </div>
              </div>

              <label className="mt-6 inline-flex h-12 cursor-pointer items-center gap-2 rounded-lg bg-telefya-blue px-4 text-sm font-black text-white shadow-soft hover:bg-telefya-violet">
                {uploading ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Upload size={17} />
                )}
                Upload image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </aside>

            <form onSubmit={handleSave} className="p-6">
              <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <h2 className="text-xl font-black text-navy-900">
                    Account details
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-navy-500">
                    Edit your backend profile record.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={!dirty || saving}
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-black text-navy-700 hover:border-telefya-blue hover:text-telefya-blue disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={17} />
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!dirty || saving}
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-telefya-blue px-4 text-sm font-black text-white shadow-soft hover:bg-telefya-violet disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Save size={17} />
                    )}
                    Save changes
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="First name"
                  icon={UserRound}
                  value={form.first_name || ""}
                  onChange={(value) => updateField("first_name", value)}
                  required
                />

                <Field
                  label="Last name"
                  icon={UserRound}
                  value={form.last_name || ""}
                  onChange={(value) => updateField("last_name", value)}
                  required
                />

                <Field
                  label="Email"
                  icon={Mail}
                  value={user?.email || ""}
                  readOnly
                />

                <Field
                  label="Country code"
                  icon={Phone}
                  value={form.country_code || ""}
                  onChange={(value) => updateField("country_code", value)}
                  placeholder="+234"
                />

                <Field
                  label="Phone"
                  icon={Phone}
                  value={form.phone_number || ""}
                  onChange={(value) => updateField("phone_number", value)}
                />

                <Field
                  label="Country"
                  icon={MapPin}
                  value={form.country || ""}
                  onChange={(value) => updateField("country", value)}
                />

                <Field
                  label="State"
                  icon={MapPin}
                  value={form.state || ""}
                  onChange={(value) => updateField("state", value)}
                />

                <Field
                  label="City"
                  icon={MapPin}
                  value={form.city || ""}
                  onChange={(value) => updateField("city", value)}
                />

                <Field
                  label="Date of birth"
                  icon={UserRound}
                  type="date"
                  value={form.date_of_birth || ""}
                  onChange={(value) => updateField("date_of_birth", value)}
                />

                <Field
                  label="Verification"
                  icon={ShieldCheck}
                  value={verified ? "Verified" : "Not verified"}
                  readOnly
                />
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
  placeholder,
  readOnly,
  required,
}: {
  label: string;
  icon: typeof UserRound;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-navy-900">{label}</span>

      <span
        className={[
          "flex h-12 items-center gap-3 rounded-lg border px-4",
          readOnly
            ? "border-border bg-navy-50"
            : "border-border bg-white shadow-soft focus-within:border-telefya-blue",
        ].join(" ")}
      >
        <Icon size={17} className="shrink-0 text-telefya-blue" />

        <input
          type={type}
          value={value}
          readOnly={readOnly}
          required={required}
          placeholder={placeholder}
          onChange={(event) => onChange?.(event.target.value)}
          className={[
            "w-full bg-transparent text-sm font-semibold outline-none",
            readOnly ? "text-navy-500" : "text-navy-900",
          ].join(" ")}
        />
      </span>
    </label>
  );
}