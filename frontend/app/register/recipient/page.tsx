"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";

export default function RegisterRecipientPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !phone.trim()) {
      setError("Please enter your name and phone number.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/recipients/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      router.push(`/login/recipient?phone=${encodeURIComponent(phone.trim())}&registered=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the server.");
    }
    setLoading(false);
  }

  const inputClass =
    "w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight">Register as a recipient</h1>
      <p className="mt-2 text-gray-600">Tell us who is requesting blood.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Your name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sara Ahmed" className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Phone number</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03211234567" className={inputClass} />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          Register
        </button>
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <p className="text-center text-xs text-gray-500">
          Already registered?{" "}
          <Link href="/login/recipient" className="font-semibold text-brand hover:underline">Log in</Link>
          {" · "}
          <Link href="/" className="hover:underline">Back</Link>
        </p>
      </form>
    </div>
  );
}