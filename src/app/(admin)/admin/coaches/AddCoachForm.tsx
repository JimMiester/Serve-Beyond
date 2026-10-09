"use client";

import { useState } from "react";
import Dropdown from "@/components/ui/Dropdown";
import { createCoach } from "./actions";

const FIELD =
  "mt-1.5 w-full rounded-xl border border-white/15 px-4 py-3 text-[15px] outline-none focus-visible:border-emerald";
const LABEL = "block text-[13px] font-medium text-white/70";

type Account = { id: string; full_name: string | null };

export default function AddCoachForm({ accounts }: { accounts: Account[] }) {
  const [name, setName] = useState("");

  return (
    <form action={createCoach} className="mt-4 space-y-4 border-t border-white/8 pt-4">
      {accounts.length > 0 && (
        <label className="block">
          <span className={LABEL}>Fill from an approved coach account</span>
          <Dropdown
            name="profile_id"
            placeholder="— Not linked —"
            className="mt-1.5"
            options={accounts.map((a) => ({ value: a.id, label: a.full_name ?? "Unnamed account" }))}
            onValueChange={(v) => {
              const selected = accounts.find((a) => a.id === v);
              if (selected?.full_name) setName(selected.full_name);
            }}
          />
          <span className="mt-1 block text-[12px] text-white/45">Fills in the name below and links this bio to that login.</span>
        </label>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={LABEL}>Name</span>
          <input name="name" value={name} onChange={(e) => setName(e.target.value)} required className={FIELD} />
        </label>
        <label className="block">
          <span className={LABEL}>Role / title</span>
          <input name="role" required className={FIELD} />
        </label>
        <label className="block">
          <span className={LABEL}>Certification</span>
          <input name="cert" className={FIELD} />
        </label>
        <label className="block">
          <span className={LABEL}>Years of experience</span>
          <input name="years" type="number" min="0" className={FIELD} />
        </label>
        <label className="block sm:col-span-2">
          <span className={LABEL}>Focus / bio</span>
          <textarea name="focus" rows={2} className={FIELD} />
        </label>
        <label className="block sm:col-span-2">
          <span className={LABEL}>Photo</span>
          <input
            name="photo"
            type="file"
            accept="image/*"
            className="mt-1.5 block w-full cursor-pointer text-[14px] text-white/70 file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-[color:var(--accent)] file:px-4 file:py-2 file:text-[13px] file:font-semibold file:text-white file:transition-opacity hover:file:opacity-90"
          />
        </label>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input type="checkbox" name="active" defaultChecked className="size-4 rounded border-white/30" />
          <span className="text-[14px] text-white/70">Active (shown on the public site)</span>
        </label>
      </div>

      <button
        type="submit"
        className="rounded-full px-5 py-2.5 text-[14px] font-semibold text-white"
        style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-deep))" }}
      >
        Add coach
      </button>
    </form>
  );
}
