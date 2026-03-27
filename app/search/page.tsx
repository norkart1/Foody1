"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { useBookmarks } from "@/hooks/useBookmarks";
import { Search, SlidersHorizontal, Star, Hotel, UtensilsCrossed, TreePalm, LayoutList, LayoutGrid, Bookmark } from "lucide-react";

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
  photos?: string[];
  price?: number;
}

export default function SearchPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("All");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const { isBookmarked, toggleBookmark } = useBookmarks();

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
    <div className="min-h-screen bg-white pb-24">
      {/* Search bar */}
      <div className="px-4 pt-12 pb-3 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3 bg-gray-100 rounded-2xl px-4 py-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hotels, resorts, restaurants…"
            className="flex-1 bg-transparent text-gray-800 text-sm placeholder-gray-400 focus:outline-none"
          />
          <button className="shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {CATEGORIES.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border shrink-0 ${
                activeType === type
                  ? "bg-green-500 text-white border-green-500"
                  : "bg-white text-green-500 border-green-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-3">
        {/* Filtered count + view toggle */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-900">
            Filtered ({loading ? "…" : filtered.length.toLocaleString()})
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1 rounded ${viewMode === "list" ? "text-green-500" : "text-gray-400"}`}
            >
              <LayoutList className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded ${viewMode === "grid" ? "text-green-500" : "text-gray-400"}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-20 h-20 bg-gray-200 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">No results found</p>
            <p className="text-gray-400 text-sm mt-1">Try different keywords</p>
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-1">
            {filtered.map((l) => {
              const meta = CAT_META[l.type] || CAT_META.Hotel;
              const Icon = meta.icon;
              const firstPhoto = l.photos && l.photos.length > 0 ? l.photos[0] : null;
              return (
                <Link
                  key={l.id}
                  href={`/listings/${l.id}`}
                  className="flex items-center gap-3 bg-white py-3 border-b border-gray-100"
                >
                  {/* Thumbnail */}
                  <div
                    className={`w-20 h-20 rounded-2xl overflow-hidden shrink-0 ${
                      !firstPhoto ? `bg-gradient-to-br ${meta.gradient} flex items-center justify-center` : ""
                    }`}
                  >
                    {firstPhoto ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={firstPhoto} alt={l.name} className="w-full h-full object-cover" />
                    ) : (
                      <Icon className="w-8 h-8 text-white" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-base leading-tight truncate">{l.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5 truncate">{l.district}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      <span className="text-xs font-bold text-amber-500">
                        {l.avgStars && l.avgStars > 0 ? l.avgStars.toFixed(1) : "—"}
                      </span>
                      {l.reviewCount ? (
                        <span className="text-xs text-gray-400">({l.reviewCount.toLocaleString()} reviews)</span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No reviews</span>
                      )}
                    </div>
                  </div>

                  {/* Price + Bookmark */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-right">
                      {l.price ? (
                        <>
                          <span className="text-green-500 text-xl font-bold leading-none">
                            ₹{l.price.toLocaleString()}
                          </span>
                          <p className="text-gray-400 text-xs">/night</p>
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs">Contact</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); toggleBookmark(l); }}
                      className={`p-1.5 rounded-lg border ${
                        isBookmarked(l.id)
                          ? "border-green-500 text-green-500"
                          : "border-gray-200 text-gray-400"
                      }`}
                    >
                      <Bookmark
                        className="w-4 h-4"
                        fill={isBookmarked(l.id) ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Grid view */
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((l) => {
              const meta = CAT_META[l.type] || CAT_META.Hotel;
              const Icon = meta.icon;
              const firstPhoto = l.photos && l.photos.length > 0 ? l.photos[0] : null;
              return (
                <Link
                  key={l.id}
                  href={`/listings/${l.id}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
                >
                  <div
                    className={`w-full h-28 overflow-hidden ${
                      !firstPhoto ? `bg-gradient-to-br ${meta.gradient} flex items-center justify-center` : ""
                    }`}
                  >
                    {firstPhoto ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={firstPhoto} alt={l.name} className="w-full h-full object-cover" />
                    ) : (
                      <Icon className="w-10 h-10 text-white" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-gray-900 text-sm truncate">{l.name}</p>
                    <p className="text-gray-400 text-xs truncate">{l.district}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-amber-500">
                          {l.avgStars && l.avgStars > 0 ? l.avgStars.toFixed(1) : "—"}
                        </span>
                      </div>
                      {l.price && (
                        <span className="text-green-500 text-sm font-bold">₹{l.price.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
