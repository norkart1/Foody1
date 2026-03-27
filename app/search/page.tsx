"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { Search, MapPin, Star, Hotel, UtensilsCrossed, TreePalm, X } from "lucide-react";

const CATEGORIES = [
  { type: "All", label: "All" },
  { type: "Hotel", label: "Hotels" },
  { type: "Resort", label: "Resorts" },
  { type: "Restaurant", label: "Restaurants" },
];

const CAT_META: Record<string, { gradient: string; icon: React.ElementType }> = {
  Hotel: { gradient: "from-blue-500 to-cyan-500", icon: Hotel },
  Resort: { gradient: "from-emerald-500 to-teal-500", icon: TreePalm },
  Restaurant: { gradient: "from-orange-500 to-amber-500", icon: UtensilsCrossed },
};

interface Listing {
  id: string;
  name: string;
  type: string;
  district: string;
  description: string;
  avgStars?: number;
  reviewCount?: number;
}

export default function SearchPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("All");

  useEffect(() => {
    getDocs(query(collection(db, "listings")))
      .then((snap) => setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing))))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = listings.filter((l) => {
    const matchType = activeType === "All" || l.type === activeType;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      l.name.toLowerCase().includes(q) ||
      l.district.toLowerCase().includes(q) ||
      (l.description?.toLowerCase() || "").includes(q);
    return matchType && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm sticky top-0 z-10">
        <h1 className="text-xl font-extrabold text-slate-800 mb-3">Search</h1>
        <div className="flex items-center gap-2 bg-slate-100 rounded-2xl px-4 py-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hotels, resorts, restaurants…"
            className="flex-1 bg-transparent text-slate-800 text-sm placeholder-slate-400 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors shrink-0 ${
                activeType === type
                  ? "bg-green-500 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">No results found</p>
            <p className="text-slate-400 text-sm mt-1">Try different keywords</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 mb-2">{filtered.length} results</p>
            {filtered.map((l) => {
              const meta = CAT_META[l.type] || CAT_META.Hotel;
              const Icon = meta.icon;
              return (
                <Link
                  key={l.id}
                  href={`/listings/${l.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{l.name}</p>
                    <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                      <MapPin className="w-3 h-3 text-green-500 shrink-0" />
                      <span className="truncate">{l.district}</span>
                    </div>
                    {l.avgStars && l.avgStars > 0 ? (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-amber-500">{l.avgStars}</span>
                        <span className="text-xs text-slate-400">({l.reviewCount})</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No reviews yet</span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-full shrink-0">{l.type}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
