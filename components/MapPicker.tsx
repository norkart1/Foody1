"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default marker icons in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const KERALA_CENTER: [number, number] = [10.8505, 76.2711];

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(parseFloat(e.latlng.lat.toFixed(6)), parseFloat(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 1 });
  }, [lat, lng, map]);
  return null;
}

interface Props {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ lat, lng, onChange }: Props) {
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [latInput, setLatInput] = useState(lat != null ? String(lat) : "");
  const [lngInput, setLngInput] = useState(lng != null ? String(lng) : "");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const handlePick = (newLat: number, newLng: number) => {
    onChange(newLat, newLng);
    setLatInput(String(newLat));
    setLngInput(String(newLng));
  };

  const handleManualInput = () => {
    const parsedLat = parseFloat(latInput);
    const parsedLng = parseFloat(lngInput);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      onChange(parsedLat, parsedLng);
      setFlyTarget({ lat: parsedLat, lng: parsedLng });
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = parseFloat(pos.coords.latitude.toFixed(6));
        const newLng = parseFloat(pos.coords.longitude.toFixed(6));
        handlePick(newLat, newLng);
        setFlyTarget({ lat: newLat, lng: newLng });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000 }
    );
  };

  const searchAddress = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError("");
    try {
      const q = encodeURIComponent(`${searchQuery}, Kerala, India`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (data.length > 0) {
        const newLat = parseFloat(parseFloat(data[0].lat).toFixed(6));
        const newLng = parseFloat(parseFloat(data[0].lon).toFixed(6));
        handlePick(newLat, newLng);
        setFlyTarget({ lat: newLat, lng: newLng });
      } else {
        setSearchError("Location not found. Try a different name.");
      }
    } catch {
      setSearchError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchAddress()}
          placeholder="Search place name (e.g. Munnar, Kovalam…)"
          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <button
          type="button"
          onClick={searchAddress}
          disabled={searching}
          className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
        >
          {searching ? "…" : "Search"}
        </button>
      </div>
      {searchError && <p className="text-red-500 text-xs">{searchError}</p>}

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-slate-200" style={{ height: 280 }}>
        <MapContainer
          center={lat != null && lng != null ? [lat, lng] : KERALA_CENTER}
          zoom={lat != null ? 14 : 7}
          style={{ width: "100%", height: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={handlePick} />
          {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}
          {lat != null && lng != null && <Marker position={[lat, lng]} />}
        </MapContainer>
      </div>
      <p className="text-xs text-slate-400 text-center">👆 Tap anywhere on the map to drop a pin</p>

      {/* GPS + manual coordinates */}
      <div className="flex gap-2 items-start">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
        >
          {locating ? "Locating…" : "📍 Use my location"}
        </button>
        <div className="flex gap-2 flex-1">
          <input
            type="number"
            step="any"
            value={latInput}
            onChange={(e) => setLatInput(e.target.value)}
            onBlur={handleManualInput}
            placeholder="Latitude"
            className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <input
            type="number"
            step="any"
            value={lngInput}
            onChange={(e) => setLngInput(e.target.value)}
            onBlur={handleManualInput}
            placeholder="Longitude"
            className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      </div>
      {lat != null && lng != null && (
        <div className="bg-green-50 text-green-700 text-xs font-semibold px-3 py-2 rounded-xl">
          ✓ Location set: {lat}, {lng}
        </div>
      )}
    </div>
  );
}
