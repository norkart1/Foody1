"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";

interface ListingBasic {
  name: string;
  address: string;
  district: string;
}

export default function ListingMapPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<ListingBasic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, "listings", id))
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setListing({ name: d.name, address: d.address, district: d.district });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const query = listing
    ? encodeURIComponent(`${listing.address}, ${listing.district}, Kerala, India`)
    : "";

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-10 pb-4 bg-white shrink-0 shadow-sm z-10">
        <button
          onClick={() => router.back()}
          className="p-1 shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>
        <h1 className="text-lg font-extrabold text-gray-900">
          {loading ? "Loading…" : listing ? `${listing.name} Location` : "Hotel Location"}
        </h1>
      </header>

      {/* Full-screen map */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : listing ? (
          <iframe
            key={query}
            title={`Map for ${listing.name}`}
            className="w-full h-full border-0"
            src={`https://maps.google.com/maps?q=${query}&output=embed&z=16&iwloc=B`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <p className="text-gray-400 text-sm">Location not available</p>
          </div>
        )}
      </div>
    </div>
  );
}
