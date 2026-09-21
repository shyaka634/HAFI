"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Archive, ChevronDown, MailCheck, MapPinned, ShieldCheck, UserMinus, UserPlus, UserRoundCog, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AccessLoading } from "@/components/access-loading";
import { RWANDA_DISTRICTS, RWANDA_PROVINCES } from "@/lib/rwanda";
import { useAppSession } from "@/providers/session-provider";

type Role = "USER" | "AGENT" | "PROVINCE_MANAGER" | "SUPER_ADMIN";
type Member = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  district: string | null;
  province: string | null;
};

export default function TeamPage() {
  const { user, isLoading: checkingAccess } = useAppSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<"agents" | "managers" | null>(null);
  const createFormRef = useRef<HTMLFormElement>(null);

  async function load() {
    const response = await fetch("/api/admin/users");
    if (response.ok) setMembers(await response.json());
  }

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") void load();
  }, [user]);

  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get("section");
    setOpenSection(section === "agents" || section === "managers" ? section : null);
  }, []);

  async function createAccount(form: HTMLFormElement) {
    setSaving(true);
    setNotice("");
    const values = Object.fromEntries(new FormData(form));
    const role = String(values.role ?? "");
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = await response.json();
    setSaving(false);
    setNotice(response.ok ? role === "SUPER_ADMIN" ? "Super administrator account created. They can sign in to access all shared records, manager and agent changes, and activity history." : "Staff account created. Give the staff member their email and temporary password." : result.error);
    if (response.ok) {
      form.reset();
      setVerificationEmail(null);
      await load();
    }
  }

  async function requestVerificationCode(form: HTMLFormElement) {
    setSaving(true);
    setNotice("");
    const values = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/admin/users/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setNotice(result.error ?? "The verification code could not be sent.");
      return;
    }

    const email = typeof values.email === "string" ? values.email.trim().toLowerCase() : "";
    setVerificationEmail(email);
    setNotice(`A six-digit verification code was sent to ${email}. It expires in 10 minutes.`);
  }

  async function submitCreateForm(form: HTMLFormElement) {
    const email = String(new FormData(form).get("email") ?? "").trim().toLowerCase();
    if (verificationEmail !== email) {
      await requestVerificationCode(form);
      return;
    }
    await createAccount(form);
  }

  async function saveAssignment(member: Member, form: HTMLFormElement) {
    const data = new FormData(form);
    const response = await fetch(`/api/admin/users/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: data.get("role"),
        district: data.get("district") || undefined,
        province: data.get("province") || undefined,
      }),
    });
    const result = await response.json();
    setNotice(response.ok ? "Team assignment updated." : result.error);
    if (response.ok) load();
  }

  async function deactivateMember(member: Member) {
    const label = member.name || member.email;
    if (!window.confirm(`Deactivate ${label}'s staff account? They will no longer be able to sign in, but their account, submitted services, and activity history will be kept in Archived staff.`)) return;

    setDeactivatingId(member.id);
    setNotice("");
    try {
      const response = await fetch(`/api/admin/users/${member.id}`, { method: "DELETE" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setNotice(result.error ?? "The staff account could not be deactivated.");
        return;
      }

      setMembers((currentMembers) => currentMembers.filter((currentMember) => currentMember.id !== member.id));
      setNotice("Staff account deactivated and moved to Archived staff.");
      await load();
    } catch {
      setNotice("The staff account could not be deactivated. Check your connection and try again.");
    } finally {
      setDeactivatingId(null);
    }
  }

  if (checkingAccess) return <AccessLoading />;
  if (user?.role !== "SUPER_ADMIN") return <Access />;

  const agents = members.filter((member) => member.role === "AGENT").sort((first, second) => `${first.district ?? ""}-${first.name ?? first.email}`.localeCompare(`${second.district ?? ""}-${second.name ?? second.email}`));
  const managers = members.filter((member) => member.role === "PROVINCE_MANAGER").sort((first, second) => `${first.province ?? ""}-${first.name ?? first.email}`.localeCompare(`${second.province ?? ""}-${second.name ?? second.email}`));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest-50 text-forest-700"><UsersRound className="h-6 w-6" /></span>
        <h1 className="mt-5 text-3xl font-extrabold text-ink">Manage the field team</h1>
        <p className="mt-2 max-w-2xl text-slate-500">Create field-staff and super-administrator accounts. Everyone signs in through the same page.</p>
        </div>
        <Link className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-ink transition hover:border-forest-200 hover:bg-forest-50 hover:text-forest-700" href="/admin/team/archived"><Archive className="h-4 w-4" />Archived staff</Link>
      </div>

      {notice && <p className="mt-6 rounded-xl bg-forest-50 px-4 py-3 text-sm font-bold text-forest-700">{notice}</p>}

      <Card className="mt-8 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-forest-50 text-forest-700"><UserPlus className="h-5 w-5" /></span>
          <div><h2 className="font-extrabold text-ink">Create a team account</h2><p className="mt-1 text-sm text-slate-500">Only a super administrator can create agents, managers, and other super administrators. The recipient must confirm their email with a code before the account is created.</p></div>
        </div>

        <form className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3" onSubmit={(event) => { event.preventDefault(); submitCreateForm(event.currentTarget); }} ref={createFormRef}>
          <Input name="name" placeholder="Full name" required />
          <Input name="email" onChange={() => setVerificationEmail(null)} placeholder="Email address" required type="email" />
          <Input minLength={8} name="password" placeholder="Temporary password (8+ characters)" required type="password" />
          <select className="h-11 rounded-xl border bg-white px-3 text-sm" defaultValue="AGENT" name="role">
            <option value="AGENT">District agent</option>
            <option value="PROVINCE_MANAGER">Province manager</option>
            <option value="SUPER_ADMIN">Super administrator — full access</option>
          </select>
          <select className="h-11 rounded-xl border bg-white px-3 text-sm" defaultValue="" name="district">
            <option value="">District (required for agents)</option>
            {RWANDA_DISTRICTS.map((district) => <option key={district}>{district}</option>)}
          </select>
          <select className="h-11 rounded-xl border bg-white px-3 text-sm" defaultValue="" name="province">
            <option value="">Province (required for managers)</option>
            {Object.keys(RWANDA_PROVINCES).map((province) => <option key={province}>{province}</option>)}
          </select>
          {verificationEmail ? <Input autoComplete="one-time-code" inputMode="numeric" maxLength={6} name="verificationCode" pattern="[0-9]{6}" placeholder="Six-digit email code" required /> : null}
          <div className="md:col-span-2 xl:col-span-3">
            <p className="mb-3 flex items-start gap-2 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />A super administrator does not need a district or province. They receive the same full access to current and historical manager and agent work.</p>
            {verificationEmail ? <div className="flex flex-wrap items-center gap-3"><Button disabled={saving} type="submit"><UserPlus className="h-4 w-4" />{saving ? "Creating account..." : "Create verified account"}</Button><Button disabled={saving} onClick={() => { if (createFormRef.current) requestVerificationCode(createFormRef.current); }} type="button" variant="secondary"><MailCheck className="h-4 w-4" />Resend code</Button><span className="text-xs font-medium text-slate-500">Code sent to {verificationEmail}</span></div> : <Button disabled={saving} type="submit"><MailCheck className="h-4 w-4" />{saving ? "Sending code..." : "Send verification code"}</Button>}
          </div>
        </form>
      </Card>

      <div className="mt-8 grid gap-6 xl:grid-cols-2" id="staff-directory">
        <StaffDirectoryCard defaultOpen={openSection === "agents"} deactivatingId={deactivatingId} icon={MapPinned} members={agents} onDeactivate={deactivateMember} onSave={saveAssignment} territory="district" title="Registered agents" />
        <StaffDirectoryCard defaultOpen={openSection === "managers"} deactivatingId={deactivatingId} icon={UserRoundCog} members={managers} onDeactivate={deactivateMember} onSave={saveAssignment} territory="province" title="Registered managers" />
      </div>
    </div>
  );
}

function StaffDirectoryCard({ defaultOpen, deactivatingId, icon: Icon, members, onDeactivate, onSave, territory, title }: {
  defaultOpen: boolean;
  deactivatingId: string | null;
  icon: typeof MapPinned;
  members: Member[];
  onDeactivate: (member: Member) => Promise<void>;
  onSave: (member: Member, form: HTMLFormElement) => Promise<void>;
  territory: "district" | "province";
  title: string;
}) {
  const groups = new Map<string, Member[]>();
  for (const member of members) {
    const value = territory === "district" ? member.district : member.province;
    const label = value || `No ${territory} assigned`;
    groups.set(label, [...(groups.get(label) ?? []), member]);
  }
  const sortedGroups = Array.from(groups.entries()).sort(([first], [second]) => first.localeCompare(second));

  return (
    <Card className="overflow-hidden">
      <details className="group" open={defaultOpen}>
        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-forest-50 text-forest-700">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-ink">{title}</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{members.length}</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Open the list, sorted by {territory}.</p>
            </div>
          </div>
          <ChevronDown className="mt-2 h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
        </summary>

        {sortedGroups.length ? (
          <div className="max-h-[36rem] space-y-5 overflow-y-auto border-t border-slate-200 px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
            {sortedGroups.map(([group, groupMembers]) => (
              <section key={group}>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-extrabold text-forest-700">{group}</h3>
                  <span className="text-xs font-semibold text-slate-400">
                    {groupMembers.length} {groupMembers.length === 1 ? "staff member" : "staff members"}
                  </span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {groupMembers.map((member) => (
                    <li className="py-4" key={member.id}>
                      <form
                        className="grid items-end gap-3 xl:grid-cols-[minmax(0,1.3fr)_1fr_1fr_1fr_auto_auto]"
                        onSubmit={(event) => {
                          event.preventDefault();
                          onSave(member, event.currentTarget);
                        }}
                      >
                        <div>
                          <p className="font-extrabold text-ink">{member.name || member.email}</p>
                          <p className="text-sm text-slate-500">{member.email}</p>
                        </div>
                        <select className="h-11 rounded-xl border bg-white px-3 text-sm" defaultValue={member.role} name="role">
                          <option value="AGENT">District agent</option>
                          <option value="PROVINCE_MANAGER">Province manager</option>
                        </select>
                        <select className="h-11 rounded-xl border bg-white px-3 text-sm" defaultValue={member.district ?? ""} name="district">
                          <option value="">District (agents)</option>
                          {RWANDA_DISTRICTS.map((district) => <option key={district}>{district}</option>)}
                        </select>
                        <select className="h-11 rounded-xl border bg-white px-3 text-sm" defaultValue={member.province ?? ""} name="province">
                          <option value="">Province (managers)</option>
                          {Object.keys(RWANDA_PROVINCES).map((province) => <option key={province}>{province}</option>)}
                        </select>
                        <Button size="sm" type="submit">Save</Button>
                        <Button disabled={deactivatingId === member.id} onClick={() => onDeactivate(member)} size="sm" type="button" variant="danger">
                          <UserMinus className="h-4 w-4" />
                          {deactivatingId === member.id ? "Deactivating..." : "Deactivate"}
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div className="border-t border-slate-200 px-5 py-6 text-center text-sm text-slate-500 sm:px-6">No active {title.toLowerCase()} yet.</div>
        )}
      </details>
    </Card>
  );
}

function Access() {
  return <div className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="text-2xl font-extrabold text-ink">Access unavailable</h1><p className="mt-3 text-slate-500">Only a super administrator can manage staff roles.</p></div>;
}
