"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useBookmarks } from "@/hooks/useBookmarks";
import {
  MapPin, Star, Hotel, UtensilsCrossed, TreePalm,
  Bell, Bookmark, Search, ChevronRight, SlidersHorizontal,
  Navigation, TrendingUp, Award, Locate,
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

const DISTRICT_COORDS: Record<string, [number, number]> = {
  "Thiruvananthapuram": [8.5241, 76.9366],
  "Kollam": [8.8932, 76.6141],
  "Pathanamthitta": [9.2648, 76.7870],
  "Alappuzha": [9.4981, 76.3388],
  "Kottayam": [9.5916, 76.5222],
  "Idukki": [9.9189, 77.1025],
  "Ernakulam": [9.9816, 76.2999],
  "Thrissur": [10.5276, 76.2144],
  "Palakkad": [10.7867, 76.6548],
  "Malappuram": [11.0740, 76.0737],
  "Kozhikode": [11.2588, 75.7804],
  "Wayanad": [11.6854, 76.1320],
  "Kannur": [11.8745, 75.3704],
  "Kasaragod": [12.4996, 74.9869],
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function districtDistanceKm(district: string, userLat: number, userLon: number): number {
  const key = Object.keys(DISTRICT_COORDS).find(
    (k) => district.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(district.toLowerCase())
  );
  if (!key) return 9999;
  const [lat, lon] = DISTRICT_COORDS[key];
  return haversineKm(userLat, userLon, lat, lon);
}

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

function ListingCard({
  listing, bookmarked, onToggleBookmark, badge,
}: {
  listing: Listing;
  bookmarked: boolean;
  onToggleBookmark: (e: React.MouseEvent) => void;
  badge?: React.ReactNode;
}) {
  const meta = CAT_META[listing.type] || CAT_META.Hotel;
  const Icon = meta.icon;
  const firstPhoto = listing.photos?.[0] ?? null;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="relative rounded-3xl overflow-hidden shrink-0 shadow-md block snap-start"
      style={{ width: 220, height: 180, minWidth: 220 }}
    >
      {firstPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={firstPhoto} alt={listing.name} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {badge && <div className="absolute top-3 left-3">{badge}</div>}

      {listing.avgStars && listing.avgStars > 0 && !badge && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          <Star className="w-3 h-3 fill-white" />
          {listing.avgStars}
        </div>
      )}

      {!firstPhoto && (
        <div className="absolute top-3 left-3 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white font-bold text-sm leading-tight truncate">{listing.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3 text-white/70 shrink-0" />
          <span className="text-white/80 text-xs truncate">{listing.district}</span>
        </div>
        {listing.price ? (
          <p className="text-white text-xs mt-1 font-semibold">
            ₹{listing.price.toLocaleString()} <span className="font-normal opacity-80">/ night</span>
          </p>
        ) : null}
      </div>

      <button
        className="absolute bottom-3 right-3 w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
        onClick={onToggleBookmark}
      >
        <Bookmark className="w-3.5 h-3.5 text-white" fill={bookmarked ? "white" : "none"} />
      </button>
    </Link>
  );
}

function SmallListingCard({ listing }: { listing: Listing }) {
  const meta = CAT_META[listing.type] || CAT_META.Hotel;
  const Icon = meta.icon;
  const firstPhoto = listing.photos?.[0] ?? null;
  return (
    <Link href={`/listings/${listing.id}`} className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm">
      <div className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 ${!firstPhoto ? `bg-gradient-to-br ${meta.gradient} flex items-center justify-center` : ""}`}>
        {firstPhoto
          ? <img src={firstPhoto} alt={listing.name} className="w-full h-full object-cover" />  // eslint-disable-line @next/next/no-img-element
          : <Icon className="w-5 h-5 text-white" />}
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

function SectionHeader({ title, icon, linkHref = "/search" }: { title: string; icon?: React.ReactNode; linkHref?: string }) {
  return (
    <div className="flex items-center justify-between px-4 mb-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-extrabold text-slate-800 text-base">{title}</h2>
      </div>
      <Link href={linkHref} className="text-green-500 text-sm font-semibold">See All</Link>
    </div>
  );
}

function HorizontalScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 overflow-x-auto pl-4 pr-4 pb-1 snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
      {children}
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("All");
  const [search, setSearch] = useState("");

  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");

  useEffect(() => {
    getDocs(query(collection(db, "listings")))
      .then((snap) => setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing))))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) { setLocationStatus("denied"); return; }
    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { timeout: 10000 }
    );
  };

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

  const featured = (activeType === "All" ? listings : filtered)
    .slice().sort((a, b) => (b.avgStars || 0) - (a.avgStars || 0));

  const mostRated = listings
    .filter((l) => l.avgStars && l.avgStars > 0)
    .slice().sort((a, b) => (b.avgStars || 0) - (a.avgStars || 0))
    .slice(0, 10);

  const trending = listings
    .filter((l) => (l.reviewCount || 0) > 0)
    .slice().sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
    .slice(0, 10);

  const nearby = userCoords
    ? listings
        .map((l) => ({ ...l, distKm: districtDistanceKm(l.district, userCoords.lat, userCoords.lon) }))
        .sort((a, b) => a.distKm - b.distKm)
        .slice(0, 10)
    : [];

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
            <button className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-slate-600" />
            </button>
            <Link href="/bookmarks" className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-slate-600" />
            </Link>
          </div>
        </div>

        <div className="mb-4">
          <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
            {firstName ? <>Hello, {firstName} <span>👋</span></> : <>Discover Kerala <span>🌴</span></>}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Find the best stays & restaurants</p>
        </div>

        <Link href="/search" className="flex items-center gap-3 bg-slate-100 rounded-2xl px-4 py-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-slate-400 text-sm flex-1">Search hotels, resorts…</span>
          <div className="w-7 h-7 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
          </div>
        </Link>
      </header>

      {/* ── Category Pills ── */}
      <div className="px-4 mt-4 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 border transition-all ${
              activeType === type
                ? "bg-green-500 text-white border-green-500"
                : "bg-white text-green-500 border-green-400"
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
        <div className="px-4 mt-5">
          <p className="text-sm text-slate-400 mb-3">{filtered.length} results</p>
          <div className="space-y-3">
            {filtered.map((l) => <SmallListingCard key={l.id} listing={l} />)}
          </div>
        </div>
      ) : (
        <>
          {/* ── Featured ── */}
          <div className="mt-5">
            <SectionHeader
              title={activeType === "All" ? "Featured Places" : `Top ${activeType}s`}
            />
            {featured.length === 0 ? (
              <div className="mx-4 bg-white rounded-3xl p-8 text-center shadow-sm">
                <p className="text-slate-400 text-sm">No places listed yet.</p>
                {user && (
                  <Link href="/add" className="text-green-500 font-semibold text-sm mt-2 inline-block">+ Add the first one</Link>
                )}
              </div>
            ) : (
              <HorizontalScroll>
                {featured.slice(0, 8).map((l) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    bookmarked={isBookmarked(l.id)}
                    onToggleBookmark={(e) => { e.preventDefault(); toggleBookmark(l); }}
                  />
                ))}
              </HorizontalScroll>
            )}
          </div>

          {/* ── Nearby ── */}
          {activeType === "All" && (
            <div className="mt-6">
              <SectionHeader
                title="Nearby You"
                icon={<Navigation className="w-4 h-4 text-green-500" />}
              />
              {locationStatus === "idle" && (
                <div className="mx-4 bg-white rounded-3xl p-5 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center shrink-0">
                    <Locate className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm">Find places near you</p>
                    <p className="text-slate-400 text-xs mt-0.5">Allow location to see nearby hotels, resorts & restaurants</p>
                  </div>
                  <button
                    onClick={requestLocation}
                    className="bg-green-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shrink-0"
                  >
                    Enable
                  </button>
                </div>
              )}
              {locationStatus === "requesting" && (
                <div className="mx-4 bg-white rounded-3xl p-5 shadow-sm flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin shrink-0" />
                  <p className="text-slate-400 text-sm">Getting your location…</p>
                </div>
              )}
              {locationStatus === "denied" && (
                <div className="mx-4 bg-orange-50 rounded-3xl p-4 shadow-sm">
                  <p className="text-orange-600 text-sm font-semibold">Location access denied.</p>
                  <p className="text-orange-400 text-xs mt-0.5">Please allow location in your browser settings to see nearby places.</p>
                </div>
              )}
              {locationStatus === "granted" && nearby.length > 0 && (
                <HorizontalScroll>
                  {nearby.map((l) => (
                    <ListingCard
                      key={l.id}
                      listing={l}
                      bookmarked={isBookmarked(l.id)}
                      onToggleBookmark={(e) => { e.preventDefault(); toggleBookmark(l); }}
                      badge={
                        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">
                          <Navigation className="w-2.5 h-2.5" />
                          {(l as typeof l & { distKm: number }).distKm < 1
                            ? "< 1 km"
                            : `${Math.round((l as typeof l & { distKm: number }).distKm)} km`}
                        </div>
                      }
                    />
                  ))}
                </HorizontalScroll>
              )}
              {locationStatus === "granted" && nearby.length === 0 && (
                <div className="mx-4 bg-white rounded-3xl p-5 text-center shadow-sm">
                  <p className="text-slate-400 text-sm">No registered places found near you yet.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Most Rated ── */}
          {mostRated.length > 0 && activeType === "All" && (
            <div className="mt-6">
              <SectionHeader
                title="Most Rated"
                icon={<Award className="w-4 h-4 text-amber-500" />}
              />
              <HorizontalScroll>
                {mostRated.map((l) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    bookmarked={isBookmarked(l.id)}
                    onToggleBookmark={(e) => { e.preventDefault(); toggleBookmark(l); }}
                    badge={
                      <div className="flex items-center gap-1 bg-amber-400 text-white text-xs font-bold px-2 py-1 rounded-full">
                        <Star className="w-3 h-3 fill-white" />
                        {l.avgStars}
                      </div>
                    }
                  />
                ))}
              </HorizontalScroll>
            </div>
          )}

          {/* ── Trending ── */}
          {trending.length > 0 && activeType === "All" && (
            <div className="mt-6">
              <SectionHeader
                title="Trending Now"
                icon={<TrendingUp className="w-4 h-4 text-rose-500" />}
              />
              <HorizontalScroll>
                {trending.map((l, i) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    bookmarked={isBookmarked(l.id)}
                    onToggleBookmark={(e) => { e.preventDefault(); toggleBookmark(l); }}
                    badge={
                      <div className="flex items-center gap-1 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        <TrendingUp className="w-3 h-3" />
                        #{i + 1}
                      </div>
                    }
                  />
                ))}
              </HorizontalScroll>
            </div>
          )}

          {/* ── Sign in prompt (guest) ── */}
          {!user && (
            <div className="mx-4 mt-6 bg-gradient-to-br from-green-500 to-emerald-400 rounded-3xl p-5 text-white">
              <p className="font-extrabold text-lg mb-1">Join Kerala Stay & Dine</p>
              <p className="text-white/80 text-sm mb-4">Sign in to add places and save your favourites.</p>
              <div className="flex gap-3">
                <Link href="/login" className="flex-1 bg-white text-green-600 font-bold text-sm text-center py-2.5 rounded-2xl">Sign In</Link>
                <Link href="/register" className="flex-1 bg-white/20 text-white font-bold text-sm text-center py-2.5 rounded-2xl border border-white/30">Register</Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
