"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, CheckCircle2, AlertCircle, Loader2, Hospital, Siren } from "lucide-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const URGENCY = [
  { value: "normal", label: "Normal", hint: "Within a few days" },
  { value: "urgent", label: "Urgent", hint: "Within 24 hours" },
  { value: "critical", label: "Critical", hint: "Right now" },
];

type Recipient = { id: string; name: string; phone: string };

export default function RequestPage() {
  const router = useRouter();
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [bloodGroup, setBloodGroup] = useState("");
  const [units, setUnits] = useState(1);
  const [hospital, setHospital] = useState("");
  const [urgency, setUrgency] = useState("urgent");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("recipient");
    if (saved) setRecipient(JSON.parse(saved));
    setAuthReady(true);
  }, []);

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

    if (!bloodGroup || !hospital.trim()) {
      setError("Please choose a blood group and enter the hospital.");
      return;
    }
    if (!coords) {
      setError("Please share the location of the hospital or patient.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: recipient?.id,
          bloodGroup,
          units,
          hospital: hospital.trim(),
          urgency,
          lat: coords.lat,
          lng: coords.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong.");
      router.push(`/request/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the server. Is the backend running?");
    }
    setLoading(false);
  }

  const inputClass =
    "w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

  if (!authReady) return null;

  if (!recipient) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Log in to request blood</h1>
        <p className="mt-3 text-gray-600">
          Please log in as a recipient so you can track your requests and see which donors respond.
        </p>
        <Link
          href="/login/recipient"
          className="mt-6 inline-block rounded-xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
        >
          Log in as recipient
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Request blood</h1>
          <p className="mt-3 text-gray-600">
            Requesting as <strong>{recipient.name}</strong> ({recipient.phone}). Compatible donors near the
            hospital will see your request.
          </p>
          <ul className="mt-6 space-y-4 text-sm text-gray-700">
            <li className="flex gap-3">
              <Siren className="mt-0.5 shrink-0 text-brand" size={18} />
              Mark critical only when blood is needed immediately.
            </li>
            <li className="flex gap-3">
              <Hospital className="mt-0.5 shrink-0 text-brand" size={18} />
              Share the location from the hospital if you can.
            </li>
          </ul>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:col-span-3"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold">Blood group needed</label>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Units needed</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setUnits(Math.max(1, units - 1))} className="h-10 w-10 rounded-xl border border-gray-300 text-lg font-bold hover:border-brand">−</button>
                <span className="w-8 text-center text-lg font-bold">{units}</span>
                <button type="button" onClick={() => setUnits(Math.min(10, units + 1))} className="h-10 w-10 rounded-xl border border-gray-300 text-lg font-bold hover:border-brand">+</button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Hospital</label>
              <input value={hospital} onChange={(e) => setHospital(e.target.value)} placeholder="e.g. DHQ Hospital, Gujranwala" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Urgency</label>
            <div className="grid grid-cols-3 gap-2">
              {URGENCY.map((u) => (
                <button
                  type="button"
                  key={u.value}
                  onClick={() => setUrgency(u.value)}
                  className={`rounded-xl border px-2 py-2.5 text-center transition ${
                    urgency === u.value
                      ? "border-brand bg-brand-light text-brand"
                      : "border-gray-300 text-gray-700 hover:border-brand"
                  }`}
                >
                  <div className="text-sm font-bold">{u.label}</div>
                  <div className="text-xs opacity-75">{u.hint}</div>
                </button>
              ))}
            </div>
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
            {loading ? "Creating request..." : "Create blood request"}
          </button>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}