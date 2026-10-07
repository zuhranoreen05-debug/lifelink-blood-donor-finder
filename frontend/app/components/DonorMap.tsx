"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type Donor = {
  _id: string;
  name: string;
  bloodGroup: string;
  location: { coordinates: [number, number] }; // [lng, lat]
};

function Recenter({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom);
  }, [lat, lng, zoom, map]);
  return null;
}

export default function DonorMap({
  lat,
  lng,
  radiusKm,
  zoom,
  donors,
  showYou,
}: {
  lat: number;
  lng: number;
  radiusKm: number;
  zoom: number;
  donors: Donor[];
  showYou: boolean;
}) {
  return (
    <MapContainer center={[lat, lng]} zoom={zoom} className="h-full w-full rounded-2xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={lat} lng={lng} zoom={zoom} />

      {showYou && (
        <>
          <Circle
            center={[lat, lng]}
            radius={radiusKm * 1000}
            pathOptions={{ color: "#c8102e", weight: 1, fillOpacity: 0.05 }}
          />
          <CircleMarker
            center={[lat, lng]}
            radius={8}
            pathOptions={{ color: "#fff", weight: 2, fillColor: "#2563eb", fillOpacity: 1 }}
          >
            <Popup>You are here</Popup>
          </CircleMarker>
        </>
      )}

      {donors.map((d) => (
        <CircleMarker
          key={d._id}
          center={[d.location.coordinates[1], d.location.coordinates[0]]}
          radius={11}
          pathOptions={{ color: "#fff", weight: 2, fillColor: "#c8102e", fillOpacity: 1 }}
        >
          <Popup>
            <strong>{d.name}</strong>
            <br />
            Blood group: {d.bloodGroup}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}