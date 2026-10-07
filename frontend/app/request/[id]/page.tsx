"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { io } from "socket.io-client";
import {
  Loader2, Hospital, Droplet, Clock, CheckCircle2, XCircle, Hourglass, Phone, Radio, Users,
} from "lucide-react";

const SERVER = "http://localhost:5000";

type Person = { _id: string; name: string; bloodGroup: string; phone?: string };
type Status = {
  bloodGroup: string;
  units: number;
  hospital: string;
  urgency: string;
  status: string;
  createdAt: string;
  notifiedCount: number;
  accepted: Person[];
  rejected: Person[];
  pending: Person[];
};

export default function RequestStatusPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);

  async function load() {
    const saved = localStorage.getItem("recipient");
    if (!saved) {
      setError("Please log in as a recipient to see this request.");
      return;
    }
    const recipient = JSON.parse(saved);
    try {
      const res = await fetch(`${SERVER}/api/requests/${id}/status?recipientId=${recipient.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the request.");
    }
  }

  useEffect(() => {
    load();
    const socket = io(SERVER);
    socket.on("connect", () => setLive(true));
    socket.on("disconnect", () => setLive(false));
    socket.on("requests-changed", () => load());
    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-gray-600">
        {error}
        <div className="mt-4">
          <Link href="/login/recipient" className="font-semibold text-brand hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center py-20 text-gray-500">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">Request status</h1>
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            live ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          <Radio size={12} /> {live ? "Live" : "Connecting..."}
        </span>
      </div>

      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand text-xl font-bold text-white">
          {data.bloodGroup}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
          <span className="flex items-center gap-1"><Hospital size={14} /> {data.hospital}</span>
          <span className="flex items-center gap-1"><Droplet size={14} /> {data.units} unit{data.units > 1 ? "s" : ""}</span>
          <span className="flex items-center gap-1"><Clock size={14} /> {new Date(data.createdAt).toLocaleString()}</span>
          <span className="font-semibold capitalize text-brand">{data.urgency}</span>
          <span className="font-semibold capitalize">Status: {data.status}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3 text-center">
        {[
          ["Sent to", data.notifiedCount, "text-gray-800"],
          ["Accepted", data.accepted.length, "text-green-600"],
          ["Pending", data.pending.length, "text-amber-600"],
          ["Rejected", data.rejected.length, "text-red-600"],
        ].map(([label, n, color]) => (
          <div key={label as string} className="rounded-xl border border-gray-200 bg-white p-3">
            <div className={`text-2xl font-bold ${color}`}>{n}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Accepted */}
      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 font-semibold text-green-700">
          <CheckCircle2 size={18} /> Accepted ({data.accepted.length})
        </div>
        {data.accepted.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">
            No donor has accepted yet. This page updates automatically, so keep it open.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.accepted.map((d) => (
              <li key={d._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-green-50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-bold text-green-700">
                    {d.bloodGroup}
                  </div>
                  <div>
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-xs text-gray-600">{d.phone}</div>
                  </div>
                </div>
                {d.phone && (
                  <a
                    href={`tel:${d.phone}`}
                    className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    <Phone size={16} /> Call
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Pending */}
      <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 font-semibold text-amber-700">
          <Hourglass size={18} /> Waiting for response ({data.pending.length})
        </div>
        {data.pending.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">No donors are pending.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.pending.map((d) => (
              <li key={d._id} className="flex items-center gap-3 text-sm">
                <Users size={16} className="text-gray-400" />
                <span className="font-medium">{d.name}</span>
                <span className="text-gray-500">({d.bloodGroup})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Rejected */}
      <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 font-semibold text-red-700">
          <XCircle size={18} /> Rejected ({data.rejected.length})
        </div>
        {data.rejected.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">No donor has rejected this request.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.rejected.map((d) => (
              <li key={d._id} className="flex items-center gap-3 text-sm">
                <XCircle size={16} className="text-red-400" />
                <span className="font-medium">{d.name}</span>
                <span className="text-gray-500">({d.bloodGroup})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 text-center">
        <Link href="/recipient" className="text-sm font-semibold text-brand hover:underline">
          Back to My Requests
        </Link>
      </div>
    </div>
  );
}