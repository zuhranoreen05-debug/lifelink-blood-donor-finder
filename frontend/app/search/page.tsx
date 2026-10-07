"use client";

import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { MapPin, Search, Loader2, AlertCircle, Users } from "lucide-react";
import type { Donor } from "../components/DonorMap";

const DonorMap = dynamic(() => import("../components/DonorMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
      Loading map...
    </div>
  ),
});

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const RADII = [5, 10, 25, 50];
const ZOOM_FOR_RADIUS: Record<number, number> = { 5: 13, 10: 12, 25: 10, 50: 9 };

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function SearchContent() {
  const params = useSearchParams();
  const [group, setGroup] = useState(params.get("group") || "");
  const [radius, setRadius] = useState(10);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getPosition(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("Your browser does not support location access."));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => reject(new Error("Could not get your location. Please allow location access in your browser.")),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  async function handleSearch() {
    setError("");
    if (!group) {
      setError("Please select a blood group.");
      return;
    }
    setLoading(true);
    try {
      const pos = coords ?? (await getPosition());
      setCoords(pos);

      const url = `http://localhost:5000/api/donors/nearby?lat=${pos.lat}&lng=${pos.lng}&group=${encodeURIComponent(
        group
      )}&radius=${radius}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong.");
      setDonors(data.donors);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the server. Is the backend running?");
    }
    setLoading(false);
  }

  const center = coords ?? { lat: 30.3753, lng: 69.3451 };
  const zoom = coords ? ZOOM_FOR_RADIUS[radius] : 5;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Find blood donors</h1>
      <p className="mt-2 text-gray-600">
        Choose the blood group needed and we will show compatible, available donors near you.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div>
              <label className="mb-2 block text-sm font-semibold">Blood group needed</label>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGroup(g)}
                    className={`rounded-xl border py-2.5 font-bold transition ${
                      group === g
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
              <label className="mb-2 block text-sm font-semibold">Search radius</label>
              <div className="grid grid-cols-4 gap-2">
                {RADII.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={`rounded-xl border py-2 text-sm font-semibold transition ${
                      radius === r
                        ? "border-brand bg-brand-light text-brand"
                        : "border-gray-300 text-gray-700 hover:border-brand"
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              {loading ? "Searching..." : "Search donors"}
            </button>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {searched && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 font-semibold">
                <Users size={18} className="text-brand" />
                {donors.length} donor{donors.length === 1 ? "" : "s"} found
              </div>

              {donors.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No donors found within {radius} km. Try a larger radius.
                </p>
              ) : (
                <ul className="space-y-3">
                  {donors.map((d) => {
                    const km = coords
                      ? distanceKm(coords.lat, coords.lng, d.location.coordinates[1], d.location.coordinates[0])
                      : 0;
                    return (
                      <li
                        key={d._id}
                        className="flex items-center justify-between rounded-xl border border-gray-100 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light font-bold text-brand">
                            {d.bloodGroup}
                          </div>
                          <div>
                            <div className="font-semibold">{d.name}</div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin size={12} /> {km.toFixed(1)} km away
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="h-[420px] overflow-hidden rounded-2xl border border-gray-200 shadow-sm lg:col-span-3 lg:h-[600px]">
          <DonorMap
            lat={center.lat}
            lng={center.lng}
            radiusKm={radius}
            zoom={zoom}
            donors={donors}
            showYou={!!coords}
          />
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}