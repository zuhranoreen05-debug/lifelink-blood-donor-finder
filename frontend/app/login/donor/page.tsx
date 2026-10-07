"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

function DonorLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [phone, setPhone] = useState(params.get("phone") || "");
  const justRegistered = params.get("registered") === "1";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/donors/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      localStorage.removeItem("recipient");
      localStorage.setItem("donor", JSON.stringify(data));
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the server.");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight">Donor login</h1>
      <p className="mt-2 text-gray-600">Enter the phone number you registered with.</p>

      <form onSubmit={handleLogin} className="mt-8 space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {justRegistered && (
          <div className="flex items-start gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>Registration successful. Log in to continue.</span>
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Phone number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="03001234567"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          Log in
        </button>
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <p className="text-center text-xs text-gray-500">
          Not registered?{" "}
          <Link href="/register" className="font-semibold text-brand hover:underline">Register as donor</Link>
          {" · "}
          <Link href="/login" className="hover:underline">Change role</Link>
        </p>
      </form>
    </div>
  );
}

export default function DonorLoginPage() {
  return (
    <Suspense>
      <DonorLoginForm />
    </Suspense>
  );
}