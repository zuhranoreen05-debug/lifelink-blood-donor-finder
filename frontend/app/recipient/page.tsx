"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { Loader2, Hospital, Droplet, Clock, Users, Plus, CheckCircle2, ExternalLink } from "lucide-react";

const SERVER = "http://localhost:5000";

type Recipient = { id: string; name: string; phone: string };
type Req = {
  _id: string;
  bloodGroup: string;
  units: number;
  hospital: string;
  urgency: string;
  status: "open" | "fulfilled" | "expired";
  createdAt: string;
  acceptedNames: string[];
  rejectedCount: number;
};

const statusStyle = {
  open: "bg-green-50 text-green-700",
  fulfilled: "bg-blue-50 text-blue-700",
  expired: "bg-gray-100 text-gray-500",
};

export default function RecipientDashboard() {
  const router = useRouter();
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("recipient");
    if (!saved) {
      router.replace("/login/recipient");
      return;
    }
    setRecipient(JSON.parse(saved));
  }, [router]);

  async function load(id: string) {
    try {
      const res = await fetch(`${SERVER}/api/recipients/${id}/requests`);
      const data = await res.json();
      if (res.ok) setRequests(data);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    if (recipient) load(recipient.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipient?.id]);

  // Live: reload when a donor responds
  useEffect(() => {
    if (!recipient) return;
    const socket = io(SERVER);
    socket.on("requests-changed", () => load(recipient.id));
    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipient?.id]);

  async function fulfill(requestId: string) {
    if (!recipient) return;
    const res = await fetch(`${SERVER}/api/recipients/${recipient.id}/requests/${requestId}/fulfill`, {
      method: "PATCH",
    });
    if (res.ok) load(recipient.id);
  }

  if (!recipient) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-bold">Welcome, {recipient.name}</div>
          <div className="text-sm text-gray-500">Recipient account</div>
        </div>
        <Link
          href="/request"
          className="flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          <Plus size={16} /> New blood request
        </Link>
      </div>

      <h2 className="mt-10 text-xl font-bold">My requests</h2>

      <div className="mt-5 space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 size={18} className="animate-spin" /> Loading...
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
            You have not created any requests yet.
          </div>
        )}

        {requests.map((r) => (
          <div key={r._id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
                  {r.bloodGroup}
                </div>
                <div>
                  <div className="font-semibold capitalize">{r.urgency} request</div>
                  <div className="flex flex-wrap items-center gap-x-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Hospital size={12} /> {r.hospital}</span>
                    <span className="flex items-center gap-1"><Droplet size={12} /> {r.units} unit{r.units > 1 ? "s" : ""}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle[r.status]}`}>
                {r.status}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-medium">
              <Users size={16} className="text-brand" />
              {r.acceptedNames.length} accepted
              {r.acceptedNames.length > 0 && (
                <span className="font-normal text-gray-500">({r.acceptedNames.join(", ")})</span>
              )}
              <span className="text-gray-400">·</span>
              {r.rejectedCount} rejected
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/request/${r._id}`}
                className="flex items-center gap-1.5 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold transition hover:border-brand hover:text-brand"
              >
                <ExternalLink size={14} /> Live status
              </Link>
              {r.status === "open" && (
                <button
                  onClick={() => fulfill(r._id)}
                  className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  <CheckCircle2 size={14} /> Mark as fulfilled
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}