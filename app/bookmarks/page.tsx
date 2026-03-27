"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useBookmarks } from "@/hooks/useBookmarks";
import {
  ArrowLeft, LayoutList, LayoutGrid, Star, Bookmark,
  Hotel, UtensilsCrossed, TreePalm, LogIn,
} from "lucide-react";

const CAT_META: Record<string, { gradient: string; icon: React.ElementType }> = {
  Hotel: { gradient: "from-blue-500 to-cyan-400", icon: Hotel },
  Resort: { gradient: "from-emerald-500 to-teal-400", icon: TreePalm },
  Restaurant: { gradient: "from-orange-500 to-amber-400", icon: UtensilsCrossed },
};

export default function BookmarksPage() {
  const { user, loading: authLoading } = useAuth();
  const { bookmarks, loading, removeBookmark } = useBookmarks();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const router = useRouter();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white px-4 pt-12 pb-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <h1 className="text-lg font-extrabold text-gray-900 flex-1">My Bookmark</h1>
        </header>
        <div className="px-4 pt-4 grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
              <div className="h-36 bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
        <header className="bg-white px-4 pt-12 pb-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <h1 className="text-lg font-extrabold text-gray-900">My Bookmark</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
            <Bookmark className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-lg font-extrabold text-gray-800 mb-2">Sign in to view bookmarks</h2>
          <p className="text-gray-400 text-sm mb-6">Save your favourite places and access them anytime.</p>
          <Link
            href="/login"
            className="flex items-center gap-2 bg-green-500 text-white font-semibold px-6 py-3 rounded-full text-sm"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 shrink-0">
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>
        <h1 className="text-lg font-extrabold text-gray-900 flex-1">My Bookmark</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg ${viewMode === "list" ? "text-green-500" : "text-gray-400"}`}
          >
            <LayoutList className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg ${viewMode === "grid" ? "text-green-500" : "text-gray-400"}`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Empty state */}
      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 text-center pt-24">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
            <Bookmark className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-lg font-extrabold text-gray-800 mb-2">No bookmarks yet</h2>
          <p className="text-gray-400 text-sm mb-6">Tap the bookmark icon on any listing to save it here.</p>
          <Link href="/" className="bg-green-500 text-white font-semibold px-6 py-3 rounded-full text-sm">
            Explore Places
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        /* ── Grid view ── */
        <div className="px-4 pt-4 grid grid-cols-2 gap-4">
          {bookmarks.map((listing) => {
            const meta = CAT_META[listing.type] || CAT_META.Hotel;
            const Icon = meta.icon;
            const firstPhoto = listing.photos && listing.photos.length > 0 ? listing.photos[0] : null;

            return (
              <div key={listing.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <Link href={`/listings/${listing.id}`}>
                  <div
                    className={`w-full h-36 overflow-hidden ${
                      !firstPhoto ? `bg-gradient-to-br ${meta.gradient} flex items-center justify-center` : ""
                    }`}
                  >
                    {firstPhoto ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={firstPhoto} alt={listing.name} className="w-full h-full object-cover" />
                    ) : (
                      <Icon className="w-10 h-10 text-white" />
                    )}
                  </div>
                </Link>
                <div className="p-3">
                  <Link href={`/listings/${listing.id}`}>
                    <p className="font-extrabold text-gray-900 text-sm leading-snug">{listing.name}</p>
                  </Link>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-amber-500">
                      {listing.avgStars && listing.avgStars > 0 ? listing.avgStars.toFixed(1) : "—"}
                    </span>
                    <span className="text-xs text-gray-400 truncate">{listing.district}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {listing.price ? (
                      <p className="text-green-500 font-extrabold text-base leading-none">
                        ₹{listing.price.toLocaleString()}
                        <span className="text-gray-400 font-normal text-xs"> /night</span>
                      </p>
                    ) : (
                      <span className="text-gray-400 text-xs">Contact</span>
                    )}
                    <button
                      onClick={() => removeBookmark(listing.id)}
                      className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center shrink-0"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-white fill-white" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── List view ── */
        <div className="px-4 pt-4 space-y-3">
          {bookmarks.map((listing) => {
            const meta = CAT_META[listing.type] || CAT_META.Hotel;
            const Icon = meta.icon;
            const firstPhoto = listing.photos && listing.photos.length > 0 ? listing.photos[0] : null;

            return (
              <div key={listing.id} className="bg-white rounded-2xl overflow-hidden shadow-sm flex items-center gap-3 p-3">
                <Link href={`/listings/${listing.id}`} className="shrink-0">
                  <div
                    className={`w-20 h-20 rounded-xl overflow-hidden ${
                      !firstPhoto ? `bg-gradient-to-br ${meta.gradient} flex items-center justify-center` : ""
                    }`}
                  >
                    {firstPhoto ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={firstPhoto} alt={listing.name} className="w-full h-full object-cover" />
                    ) : (
                      <Icon className="w-8 h-8 text-white" />
                    )}
                  </div>
                </Link>
                <Link href={`/listings/${listing.id}`} className="flex-1 min-w-0">
                  <p className="font-extrabold text-gray-900 text-sm leading-snug truncate">{listing.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-amber-500">
                      {listing.avgStars && listing.avgStars > 0 ? listing.avgStars.toFixed(1) : "—"}
                    </span>
                    <span className="text-xs text-gray-400 truncate">{listing.district}</span>
                  </div>
                  {listing.price && (
                    <p className="text-green-500 font-extrabold text-sm mt-1">
                      ₹{listing.price.toLocaleString()}
                      <span className="text-gray-400 font-normal text-xs"> /night</span>
                    </p>
                  )}
                </Link>
                <button
                  onClick={() => removeBookmark(listing.id)}
                  className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shrink-0"
                >
                  <Bookmark className="w-4 h-4 text-white fill-white" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
