"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import {
  MapPin, Star, Hotel, UtensilsCrossed, TreePalm,
  Bell, Bookmark, Search, ChevronRight, Plus, SlidersHorizontal,
} from "lucide-react";

const CATEGORIES = [
  { type: "All", label: "All" },
  { type: "Hotel", label: "Hotels" },
  { type: "Resort", label: "Resorts" },
  { type: "Restaurant", label: "Restaurants" },
];

const CAT_META: Record<string, { gradient: string; icon: React.ElementType }> = {
  Hotel: { gradient: "from-blue-500 to-cyan-400", icon: Hotel },
  Resort: { gradient: "from-emerald-500 to-teal-400", icon: TreePalm },
  Restaurant: { gradient: "from-orange-500 to-amber-400", icon: UtensilsCrossed },
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

function ListingCard({ listing }: { listing: Listing }) {
  const meta = CAT_META[listing.type] || CAT_META.Hotel;
  const Icon = meta.icon;
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="relative rounded-3xl overflow-hidden shrink-0 w-[220px] h-[180px] shadow-md"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient}`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

      {listing.avgStars && listing.avgStars > 0 && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          <Star className="w-3 h-3 fill-white" />
          {listing.avgStars}
        </div>
      )}

      <div className="absolute top-3 left-3 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white font-bold text-sm leading-tight truncate">{listing.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3 text-white/70 shrink-0" />
          <span className="text-white/80 text-xs truncate">{listing.district}</span>
        </div>
      </div>

      <button
        className="absolute bottom-3 right-3 w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
        onClick={(e) => e.preventDefault()}
      >
        <Bookmark className="w-3.5 h-3.5 text-white" />
      </button>
    </Link>
  );
}

function SmallListingCard({ listing }: { listing: Listing }) {
  const meta = CAT_META[listing.type] || CAT_META.Hotel;
  const Icon = meta.icon;
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-800 text-sm truncate">{listing.name}</p>
        <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
          <MapPin className="w-3 h-3 text-green-500 shrink-0" />
          <span className="truncate">{listing.district}</span>
        </div>
      </div>
      {listing.avgStars && listing.avgStars > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-bold text-slate-600">{listing.avgStars}</span>
        </div>
      )}
      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
    </Link>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    getDocs(query(collection(db, "listings")))
      .then((snap) => setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing))))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.displayName?.split(" ")[0] || null;

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

  const topRated = [...listings]
    .filter((l) => l.avgStars && l.avgStars > 0)
    .sort((a, b) => (b.avgStars || 0) - (a.avgStars || 0))
    .slice(0, 8);

  const featured = activeType === "All"
    ? [...listings].sort((a, b) => (b.avgStars || 0) - (a.avgStars || 0))
    : filtered.sort((a, b) => (b.avgStars || 0) - (a.avgStars || 0));

  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* ── Header ── */}
      <header className="bg-white px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
              <TreePalm className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-slate-800 text-sm leading-tight">Kerala Stay & Dine</p>
              <p className="text-slate-400 text-[10px]">God&apos;s Own Country</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <Link href="/add" className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-green-600" />
              </Link>
            )}
            <button className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-slate-600" />
            </button>
            <Link href="/profile" className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-slate-600" />
            </Link>
          </div>
        </div>

        {/* Greeting */}
        <div className="mb-4">
          <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
            {firstName ? (
              <>Hello, {firstName} <span>👋</span></>
            ) : (
              <>Discover Kerala <span>🌴</span></>
            )}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Find the best stays & restaurants</p>
        </div>

        {/* Search bar */}
        <Link
          href="/search"
          className="flex items-center gap-3 bg-slate-100 rounded-2xl px-4 py-3"
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-slate-400 text-sm flex-1">Search hotels, resorts…</span>
          <div className="w-7 h-7 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
          </div>
        </Link>
      </header>

      {/* ── Category Pills ── */}
      <div className="px-4 mt-4 flex gap-2 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 border transition-colors ${
              activeType === type
                ? "bg-green-500 text-white border-green-500"
                : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="px-4 mt-6 space-y-6">
          <div className="h-6 w-32 bg-slate-200 rounded-xl animate-pulse" />
          <div className="flex gap-3 overflow-hidden">
            {[1, 2].map((i) => (
              <div key={i} className="w-[220px] h-[180px] bg-slate-200 rounded-3xl animate-pulse shrink-0" />
            ))}
          </div>
        </div>
      ) : search ? (
        /* Search results */
        <div className="px-4 mt-5">
          <p className="text-sm text-slate-400 mb-3">{filtered.length} results</p>
          <div className="space-y-3">
            {filtered.map((l) => <SmallListingCard key={l.id} listing={l} />)}
          </div>
        </div>
      ) : (
        <>
          {/* ── Featured horizontal scroll ── */}
          <div className="mt-5">
            <div className="flex items-center justify-between px-4 mb-3">
              <h2 className="font-extrabold text-slate-800 text-base">
                {activeType === "All" ? "Featured Places" : `Top ${activeType}s`}
              </h2>
              <button
                onClick={() => {}}
                className="text-green-500 text-sm font-semibold"
              >
                See All
              </button>
            </div>
            {featured.length === 0 ? (
              <div className="mx-4 bg-white rounded-3xl p-8 text-center shadow-sm">
                <p className="text-slate-400 text-sm">No places listed yet.</p>
                {user && (
                  <Link href="/add" className="text-green-500 font-semibold text-sm mt-2 inline-block">
                    + Add the first one
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pl-4 pr-4 pb-1 snap-x snap-mandatory">
                {featured.slice(0, 8).map((l) => (
                  <div key={l.id} className="snap-start">
                    <ListingCard listing={l} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Top Rated ── */}
          {topRated.length > 0 && activeType === "All" && (
            <div className="mt-6 px-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-extrabold text-slate-800 text-base">Top Rated</h2>
                <span className="text-green-500 text-sm font-semibold">See All</span>
              </div>
              <div className="space-y-3">
                {topRated.slice(0, 5).map((l) => (
                  <SmallListingCard key={l.id} listing={l} />
                ))}
              </div>
            </div>
          )}

          {/* ── Sign in prompt (guest) ── */}
          {!user && (
            <div className="mx-4 mt-6 bg-gradient-to-br from-green-500 to-emerald-400 rounded-3xl p-5 text-white">
              <p className="font-extrabold text-lg mb-1">Join Kerala Stay & Dine</p>
              <p className="text-white/80 text-sm mb-4">Sign in to add places and save your favourites.</p>
              <div className="flex gap-3">
                <Link href="/login" className="flex-1 bg-white text-green-600 font-bold text-sm text-center py-2.5 rounded-2xl">
                  Sign In
                </Link>
                <Link href="/register" className="flex-1 bg-white/20 text-white font-bold text-sm text-center py-2.5 rounded-2xl border border-white/30">
                  Register
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
