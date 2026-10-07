"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from "lucide-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function RegisterDonorPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [lastDonation, setLastDonation] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function getLocation() {
    setLocError("");
    if (!navigator.geolocation) {
      setLocError("Your browser does not support location access.");
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocLoading(false);
      },
      () => {
        setLocError("Could not get your location. Please allow location access in your browser.");
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !phone.trim() || !bloodGroup) {
      setError("Please fill in your name, phone number and blood group.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (!coords) {
      setError("Please share your location first.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/donors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          bloodGroup,
          lastDonationDate: lastDonation || null,
          lat: coords.lat,
          lng: coords.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong.");
      router.push(`/login/donor?phone=${encodeURIComponent(phone.trim())}&registered=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the server. Is the backend running?");
    }
    setLoading(false);
  }

  const inputClass =
    "w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Register as a donor</h1>
          <p className="mt-3 text-gray-600">
            Register once and see blood requests near you whenever someone needs your blood group.
          </p>
          <ul className="mt-6 space-y-4 text-sm text-gray-700">
            {[
              "Your phone number is shown only to a recipient whose request you accept.",
              "You can accept or reject any request.",
              "You can turn availability off at any time.",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-brand" size={18} />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:col-span-3"
        >
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ali Khan" className={inputClass} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">Phone number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03001234567" className={inputClass} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Blood group</label>
            <div className="grid grid-cols-4 gap-2">
              {BLOOD_GROUPS.map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setBloodGroup(g)}
                  className={`rounded-xl border py-2.5 font-bold transition ${
                    bloodGroup === g
                      ? "border-brand bg-brand text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-brand hover:text-brand"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">
              Last donation date <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              type="date"
              max={new Date().toISOString().split("T")[0]}
              value={lastDonation}
              onChange={(e) => setLastDonation(e.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-500">
              Donors who gave blood in the last 3 months are not shown in searches.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">Location</label>
            {coords ? (
              <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                <CheckCircle2 size={18} />
                Location captured ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
              </div>
            ) : (
              <button
                type="button"
                onClick={getLocation}
                disabled={locLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand py-3 font-semibold text-brand transition hover:bg-brand-light disabled:opacity-60"
              >
                {locLoading ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
                {locLoading ? "Finding your location..." : "Use my current location"}
              </button>
            )}
            {locError && <p className="mt-2 text-sm text-red-600">{locError}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Registering..." : "Register as donor"}
          </button>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-center text-xs text-gray-500">
            Already registered?{" "}
            <Link href="/login/donor" className="font-semibold text-brand hover:underline">Log in</Link>
            {" · "}
            <Link href="/" className="hover:underline">Back</Link>
          </p>
        </form>
      </div>
    </div>
  );
}