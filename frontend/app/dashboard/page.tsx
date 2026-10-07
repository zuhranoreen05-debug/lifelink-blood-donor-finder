"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import {
  Loader2, Phone, Hospital, Clock, Droplet, LogOut, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";

const SERVER = "http://localhost:5000";
const API = `${SERVER}/api`;

type Donor = { id: string; name: string; bloodGroup: string; isAvailable: boolean };
type Req = {
  _id: string;
  requesterName: string;
  requesterPhone?: string;
  bloodGroup: string;
  units: number;
  hospital: string;
  urgency: "normal" | "urgent" | "critical";
  createdAt: string;
  acceptedCount: number;
  myStatus: "pending" | "accepted" | "rejected";
};
type Tab = "pending" | "accepted" | "rejected";

const urgencyStyle = {
  normal: "bg-blue-50 text-blue-700",
  urgent: "bg-amber-50 text-amber-700",
  critical: "bg-red-50 text-red-700",
};

const TABS: { key: Tab; label: string }[] = [
  { key: "pending", label: "New requests" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
];

function timeAgo(date: string) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  return `${Math.floor(hrs / 24)} d ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("donor");
    if (!saved) {
      router.replace("/login/donor");
      return;
    }
    setDonor(JSON.parse(saved));
  }, [router]);

  async function loadRequests(id: string) {
    try {
      const res = await fetch(`${API}/requests/for-donor/${id}`);
      const data = await res.json();
      if (res.ok) setRequests(data);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    if (donor) loadRequests(donor.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donor?.id]);

  // Live: reload when any request is created, answered or closed
  useEffect(() => {
    if (!donor) return;
    const socket = io(SERVER);
    socket.on("requests-changed", () => loadRequests(donor.id));
    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donor?.id]);

  function logout() {
    localStorage.removeItem("donor");
    router.push("/");
  }

  async function toggleAvailability() {
    if (!donor) return;
    const next = !donor.isAvailable;
    const res = await fetch(`${API}/donors/${donor.id}/availability`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: next }),
    });
    if (res.ok) {
      const updated = { ...donor, isAvailable: next };
      setDonor(updated);
      localStorage.setItem("donor", JSON.stringify(updated));
    }
  }

  async function respond(id: string, status: "accepted" | "rejected") {
    if (!donor) return;
    setError("");
    setBusyId(id);
    try {
      const res = await fetch(`${API}/requests/${id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorId: donor.id, status }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.message || "Something went wrong.");
      await loadRequests(donor.id);
    } catch {
      setError("Could not reach the server.");
    }
    setBusyId("");
  }

  if (!donor) return null;

  const shown = requests.filter((r) => r.myStatus === tab);
  const count = (t: Tab) => requests.filter((r) => r.myStatus === t).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-lg font-bold text-brand">
            {donor.bloodGroup}
          </div>
          <div>
            <div className="text-lg font-bold">Welcome, {donor.name}</div>
            <div className="text-sm text-gray-500">Blood group {donor.bloodGroup}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={toggleAvailability} className="flex items-center gap-2 text-sm font-medium">
            <span className={`relative h-6 w-11 rounded-full transition ${donor.isAvailable ? "bg-green-500" : "bg-gray-300"}`}>
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  donor.isAvailable ? "left-[22px]" : "left-0.5"
                }`}
              />
            </span>
            {donor.isAvailable ? "Available" : "Unavailable"}
          </button>
          <button onClick={logout} className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand">
            <LogOut size={16} /> Log out
          </button>
        </div>
      </div>

      <h2 className="mt-10 text-xl font-bold">Blood requests near you</h2>
      <p className="mt-1 text-sm text-gray-600">
        Open requests within 50 km that your blood group can help with.
      </p>

      <div className="mt-5 flex gap-2 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              tab === t.key ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label} ({count(t.key)})
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!donor.isAvailable && tab === "pending" && (
        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You are set to Unavailable, so you can only reject requests. Turn availability on to accept.
        </div>
      )}

      <div className="mt-5 space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 size={18} className="animate-spin" /> Loading requests...
          </div>
        )}

        {!loading && shown.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
            {tab === "pending" && "No new requests near you right now."}
            {tab === "accepted" && "You have not accepted any request yet."}
            {tab === "rejected" && "You have not rejected any request."}
          </div>
        )}

        {shown.map((r) => (
          <div key={r._id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
                  {r.bloodGroup}
                </div>
                <div>
                  <div className="font-semibold">{r.requesterName} needs blood</div>
                  <div className="flex flex-wrap items-center gap-x-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Hospital size={12} /> {r.hospital}</span>
                    <span className="flex items-center gap-1"><Droplet size={12} /> {r.units} unit{r.units > 1 ? "s" : ""}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {timeAgo(r.createdAt)}</span>
                  </div>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${urgencyStyle[r.urgency]}`}>
                {r.urgency}
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-gray-500">
                {r.acceptedCount} donor{r.acceptedCount === 1 ? "" : "s"} accepted so far
              </span>

              {r.myStatus === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => respond(r._id, "rejected")}
                    disabled={busyId === r._id}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-red-400 hover:text-red-600 disabled:opacity-50"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                  <button
                    onClick={() => respond(r._id, "accepted")}
                    disabled={busyId === r._id || !donor.isAvailable}
                    className="flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} /> Accept
                  </button>
                </div>
              )}

              {r.myStatus === "accepted" && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1 text-sm font-semibold text-green-700">
                    <CheckCircle2 size={16} /> Accepted
                  </span>
                  {r.requesterPhone && (
                    <a
                      href={`tel:${r.requesterPhone}`}
                      className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      <Phone size={16} /> Call {r.requesterPhone}
                    </a>
                  )}
                </div>
              )}

              {r.myStatus === "rejected" && (
                <span className="flex items-center gap-1 text-sm font-semibold text-red-600">
                  <XCircle size={16} /> Rejected
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}