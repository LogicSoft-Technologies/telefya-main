"use client";

import {
  AlertCircle,
  BadgeDollarSign,
  Building2,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Palette,
  RefreshCcw,
  Save,
  ShieldCheck,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getMeetings, type ScheduledMeeting } from "@/lib/api/meetings";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  getBillingOverview,
  getBranding,
  listAdminUsers,
  saveBranding,
  type AdminUser,
  type BillingOverview,
  type WorkspaceBranding,
} from "@/lib/api/workspace";
import { getReportSummary, type ReportSummary } from "@/lib/api/reports";

const emptyBranding: WorkspaceBranding = {
  workspace_name: "Telefya Workspace",
  primary_color: "#0f6bff",
  accent_color: "#20c997",
  logo_url: "",
};

const emptyBilling: BillingOverview = {
  plan_name: "Free",
  billing_status: "inactive",
  seats: 1,
  renews_at: null,
};

const emptySummary: ReportSummary = {
  total_meetings: 0,
  total_attendees: 0,
  total_minutes: 0,
  recordings: 0,
};

function displayUserName(user?: AdminUser | null) {
  return (
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.email ||
    "Workspace user"
  );
}

function formatDate(value?: string | null) {
  if (!value) return "Not scheduled";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function AdminPage() {
  const { profile, loading, error, reload } = useCurrentUser();

  const [meetings, setMeetings] = useState<ScheduledMeeting[]>([]);
  const [members, setMembers] = useState<AdminUser[]>([]);
  const [branding, setBranding] = useState<WorkspaceBranding>(emptyBranding);
  const [brandingDraft, setBrandingDraft] =
    useState<WorkspaceBranding>(emptyBranding);
  const [billing, setBilling] = useState<BillingOverview>(emptyBilling);
  const [summary, setSummary] = useState<ReportSummary>(emptySummary);

  const [pageLoading, setPageLoading] = useState(true);
  const [savingBranding, setSavingBranding] = useState(false);
  const [pageError, setPageError] = useState("");
  const [message, setMessage] = useState("");

  const displayName = useMemo(() => {
    return (
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      profile?.email ||
      "Admin"
    );
  }, [profile]);

  async function loadAdminData() {
    setPageLoading(true);
    setPageError("");
    setMessage("");

    try {
      const [
        meetingsResponse,
        membersResponse,
        brandingResponse,
        billingResponse,
        summaryResponse,
      ] = await Promise.all([
        getMeetings(),
        listAdminUsers(),
        getBranding(),
        getBillingOverview(),
        getReportSummary(),
      ]);

      setMeetings(meetingsResponse);
      setMembers(membersResponse.data || []);

      const nextBranding = brandingResponse.data || emptyBranding;
      setBranding(nextBranding);
      setBrandingDraft({
        ...emptyBranding,
        ...nextBranding,
      });

      setBilling(billingResponse.data || emptyBilling);
      setSummary(summaryResponse.data || emptySummary);
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "Unable to load admin workspace."
      );
    } finally {
      setPageLoading(false);
    }
  }

  async function handleSaveBranding() {
    setSavingBranding(true);
    setPageError("");
    setMessage("");

    try {
      const response = await saveBranding(brandingDraft);
      const saved = response.data || brandingDraft;

      setBranding(saved);
      setBrandingDraft({
        ...emptyBranding,
        ...saved,
      });
      setMessage("Workspace branding saved.");
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "Unable to save branding."
      );
    } finally {
      setSavingBranding(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  const verified = Boolean(profile?.is_verified);

  const adminTools = [
    {
      title: "Workspace",
      icon: Building2,
      desc: `${branding.workspace_name || "Telefya Workspace"} is connected to backend branding.`,
      status: "Live",
    },
    {
      title: "Members",
      icon: Users,
      desc: `${members.length} workspace member${members.length === 1 ? "" : "s"} loaded from the user directory.`,
      status: "Live",
    },
    {
      title: "Billing",
      icon: BadgeDollarSign,
      desc: `${billing.plan_name} plan is ${billing.billing_status}.`,
      status: "Live",
    },
    {
      title: "Reports",
      icon: Video,
      desc: `${summary.recordings || 0} recording${summary.recordings === 1 ? "" : "s"} and ${summary.total_attendees || 0} attendance records tracked.`,
      status: "Live",
    },
    {
      title: "Branding",
      icon: Palette,
      desc: "Workspace colors and identity are saved through the backend.",
      status: "Live",
    },
  ];

  const metricCards = [
    {
      label: "Scheduled meetings",
      value: pageLoading ? "..." : String(meetings.length),
      icon: CalendarDays,
    },
    {
      label: "Members",
      value: pageLoading ? "..." : String(members.length),
      icon: Users,
    },
    {
      label: "Recordings",
      value: pageLoading ? "..." : String(summary.recordings || 0),
      icon: Video,
    },
    {
      label: "Billing",
      value: billing.billing_status,
      icon: BadgeDollarSign,
    },
  ];

  return (
    <div className="grid gap-6">
      <section className="telefya-aurora overflow-hidden rounded-xl border border-border bg-white shadow-enterprise">
        <div className="telefya-accent-line h-1" />

        <div className="grid gap-6 p-6 xl:grid-cols-[1fr_360px] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-navy-500 shadow-soft">
              <ShieldCheck size={15} className="text-telefya-violet" />
              Admin portal
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-navy-900 lg:text-4xl">
              Live workspace overview for{" "}
              <span className="telefya-text-gradient">{displayName}</span>
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-8 text-navy-500">
              Manage members, branding, billing status, meetings, recordings,
              and reporting from backend-backed workspace data.
            </p>
          </div>

          <div className="rounded-xl border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-navy-300">
              Backend connection
            </p>

            <div className="mt-4 grid gap-3">
              <StatusRow label="Profile" value={profile ? "Synced" : "Loading"} />
              <StatusRow
                label="Members"
                value={pageLoading ? "Loading" : `${members.length} found`}
              />
              <StatusRow
                label="Branding"
                value={branding.workspace_name || "Synced"}
              />
            </div>
          </div>
        </div>
      </section>

      {(error || pageError) ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error || pageError}</span>
          <button
            onClick={() => {
              reload();
              loadAdminData();
            }}
            className="ml-auto inline-flex items-center gap-2 underline"
          >
            <RefreshCcw size={15} />
            Retry
          </button>
        </div>
      ) : null}

      {message ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          {message}
        </div>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {adminTools.map((item) => (
          <article key={item.title} className="telefya-surface rounded-xl p-5">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-telefya-blue">
              <item.icon size={23} />
            </div>

            <h2 className="mt-5 text-lg font-black text-navy-900">
              {item.title}
            </h2>

            <p className="mt-3 min-h-16 text-sm leading-6 text-navy-500">
              {item.desc}
            </p>

            <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-telefya-green">
              {item.status}
            </span>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="overflow-hidden rounded-xl border border-border bg-white shadow-soft">
          <div className="border-b border-border px-5 py-5">
            <h2 className="text-xl font-black text-navy-900">Profile record</h2>
            <p className="mt-1 text-sm font-semibold text-navy-500">
              Pulled from your authenticated backend profile.
            </p>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="flex items-center gap-3 rounded-xl bg-navy-50 p-4 font-bold text-navy-500">
                <Loader2 size={17} className="animate-spin text-telefya-blue" />
                Loading profile...
              </div>
            ) : profile ? (
              <div className="grid gap-3 text-sm">
                <Info label="Name" value={displayName} />
                <Info label="Email" value={profile.email} />
                <Info label="Phone" value={profile.phone_number} />
                <Info
                  label="Location"
                  value={[profile.city, profile.state, profile.country]
                    .filter(Boolean)
                    .join(", ")}
                />
                <Info label="Verified" value={verified ? "Yes" : "No"} />
              </div>
            ) : (
              <button
                onClick={reload}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-black text-navy-700 hover:border-telefya-blue hover:text-telefya-blue"
              >
                <RefreshCcw size={16} />
                Retry profile
              </button>
            )}
          </div>
        </section>

        <section
          id="reports"
          className="overflow-hidden rounded-xl border border-border bg-white shadow-soft"
        >
          <div className="border-b border-border px-5 py-5">
            <h2 className="text-xl font-black text-navy-900">
              Operational summary
            </h2>
            <p className="mt-1 text-sm font-semibold text-navy-500">
              Metrics are loaded from meetings, users, billing, and reports.
            </p>
          </div>

          <div className="p-5">
            {pageLoading ? (
              <div className="flex items-center gap-3 rounded-xl bg-navy-50 p-4 font-bold text-navy-500">
                <Loader2 size={17} className="animate-spin text-telefya-blue" />
                Loading workspace data...
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-4">
                {metricCards.map((item) => (
                  <MetricCard
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    icon={item.icon}
                  />
                ))}
              </div>
            )}

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <section className="rounded-xl bg-navy-50 p-5">
                <h3 className="font-black text-navy-900">Billing overview</h3>
                <div className="mt-4 grid gap-3">
                  <StatusRow label="Plan" value={billing.plan_name} />
                  <StatusRow label="Status" value={billing.billing_status} />
                  <StatusRow label="Seats" value={String(billing.seats || 1)} />
                  <StatusRow label="Renews" value={formatDate(billing.renews_at)} />
                </div>
              </section>

              <section className="rounded-xl bg-navy-50 p-5">
                <h3 className="font-black text-navy-900">Report overview</h3>
                <div className="mt-4 grid gap-3">
                  <StatusRow
                    label="Attendance"
                    value={String(summary.total_attendees || 0)}
                  />
                  <StatusRow
                    label="Minutes"
                    value={String(summary.total_minutes || 0)}
                  />
                  <StatusRow
                    label="Recordings"
                    value={String(summary.recordings || 0)}
                  />
                </div>
              </section>
            </div>
          </div>
        </section>
      </section>

      <section
        id="branding"
        className="rounded-xl border border-border bg-white p-5 shadow-soft"
      >
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <h2 className="text-xl font-black text-navy-900">
              Branding and workspace identity
            </h2>
            <p className="mt-1 text-sm font-semibold text-navy-500">
              Update the workspace identity stored in the backend.
            </p>
          </div>

          <button
            onClick={handleSaveBranding}
            disabled={savingBranding}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-4 text-sm font-black text-white shadow-soft hover:bg-telefya-violet disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingBranding ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save branding
          </button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-4">
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-navy-300">
              Workspace name
            </span>
            <input
              value={brandingDraft.workspace_name}
              onChange={(event) =>
                setBrandingDraft((current) => ({
                  ...current,
                  workspace_name: event.target.value,
                }))
              }
              className="h-11 rounded-xl border border-border bg-navy-50 px-3 text-sm font-bold text-navy-800 outline-none focus:border-telefya-blue focus:bg-white"
            />
          </label>

          <ColorInput
            label="Primary color"
            value={brandingDraft.primary_color}
            onChange={(value) =>
              setBrandingDraft((current) => ({
                ...current,
                primary_color: value,
              }))
            }
          />

          <ColorInput
            label="Accent color"
            value={brandingDraft.accent_color}
            onChange={(value) =>
              setBrandingDraft((current) => ({
                ...current,
                accent_color: value,
              }))
            }
          />

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-navy-300">
              Logo URL
            </span>
            <input
              value={brandingDraft.logo_url || ""}
              onChange={(event) =>
                setBrandingDraft((current) => ({
                  ...current,
                  logo_url: event.target.value,
                }))
              }
              placeholder="https://..."
              className="h-11 rounded-xl border border-border bg-navy-50 px-3 text-sm font-bold text-navy-800 outline-none focus:border-telefya-blue focus:bg-white"
            />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-white shadow-soft">
        <div className="flex flex-col justify-between gap-3 border-b border-border px-5 py-5 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-black text-navy-900">
              Member directory
            </h2>
            <p className="mt-1 text-sm font-semibold text-navy-500">
              Loaded from the backend users table.
            </p>
          </div>

          <button
            onClick={loadAdminData}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-black text-navy-700 hover:border-telefya-blue hover:text-telefya-blue"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>

        <div className="p-5">
          {pageLoading ? (
            <div className="flex items-center gap-3 rounded-xl bg-navy-50 p-4 font-bold text-navy-500">
              <Loader2 size={17} className="animate-spin text-telefya-blue" />
              Loading members...
            </div>
          ) : members.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-navy-50 p-8 text-center">
              <Users size={34} className="mx-auto text-telefya-violet" />
              <p className="mt-4 font-black text-navy-900">
                No members found
              </p>
              <p className="mt-2 text-sm font-semibold text-navy-500">
                Registered workspace users will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="bg-navy-50 text-xs font-black uppercase tracking-[0.12em] text-navy-400">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Verified</th>
                    <th className="px-4 py-3">Joined</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {members.map((member) => (
                    <tr key={member.user_id} className="hover:bg-navy-50/70">
                      <td className="px-4 py-4">
                        <p className="font-black text-navy-900">
                          {displayUserName(member)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-navy-400">
                          {member.email}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-sm font-bold text-navy-700">
                        {member.role || "User"}
                      </td>

                      <td className="px-4 py-4 text-sm font-semibold text-navy-600">
                        {[member.city, member.state, member.country]
                          .filter(Boolean)
                          .join(", ") || "Not available"}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={[
                            "inline-flex rounded-full px-3 py-1 text-xs font-black",
                            member.is_verified
                              ? "bg-emerald-50 text-telefya-green"
                              : "bg-amber-50 text-telefya-gold",
                          ].join(" ")}
                        >
                          {member.is_verified ? "Verified" : "Pending"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-sm font-semibold text-navy-600">
                        {formatDate(member.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3">
      <span className="text-sm font-bold text-navy-500">{label}</span>
      <span className="inline-flex items-center gap-1.5 text-sm font-black text-navy-900">
        <CheckCircle2 size={15} className="text-telefya-green" />
        {value}
      </span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl bg-navy-50 p-5">
      <Icon size={24} className="text-telefya-blue" />
      <strong className="mt-4 block text-3xl font-black capitalize text-navy-900">
        {value}
      </strong>
      <span className="text-sm font-bold text-navy-500">{label}</span>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl bg-navy-50 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-navy-300">
        {label}
      </p>
      <p className="mt-1 break-all font-bold text-navy-900">
        {value || "Not available"}
      </p>
    </div>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-navy-300">
        {label}
      </span>
      <div className="flex h-11 overflow-hidden rounded-xl border border-border bg-navy-50 focus-within:border-telefya-blue focus-within:bg-white">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-full w-12 border-0 bg-transparent p-1"
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm font-bold text-navy-800 outline-none"
        />
      </div>
    </label>
  );
}