"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  MapPin, Star, Hotel, UtensilsCrossed, TreePalm,
  Plus, LogOut, Search, ChevronRight, Waves, Wind, Filter, X
} from "lucide-react";

const DISTRICTS = [
  "All Districts", "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha",
  "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad",
  "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod",
];

const CATEGORIES = [
  {
    type: "Hotel",
    label: "Hotels",
    plural: "Top Hotels",
    icon: Hotel,
    gradient: "from-blue-500 to-cyan-500",
    lightBg: "bg-blue-50",
    textColor: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
    border: "border-blue-100",
    emptyMsg: "No hotels listed yet.",
  },
  {
    type: "Resort",
    label: "Resorts",
    plural: "Top Resorts",
    icon: TreePalm,
    gradient: "from-emerald-500 to-teal-500",
    lightBg: "bg-emerald-50",
    textColor: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-100",
    emptyMsg: "No resorts listed yet.",
  },
  {
    type: "Restaurant",
    label: "Restaurants",
    plural: "Top Restaurants",
    icon: UtensilsCrossed,
    gradient: "from-orange-500 to-amber-500",
    lightBg: "bg-orange-50",
    textColor: "text-orange-500",
    badge: "bg-orange-100 text-orange-700",
    border: "border-orange-100",
    emptyMsg: "No restaurants listed yet.",
  },
];

interface Listing {
  id: string;
  name: string;
  type: string;
  district: string;
  description: string;
  address: string;
  phone?: string;
  avgStars?: number;
  reviewCount?: number;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
      ))}
    </div>
  );
}

function ListingCard({ listing, cat }: { listing: Listing; cat: typeof CATEGORIES[0] }) {
  const Icon = cat.icon;
  return (
    <Link
      href={`/listings/${listing.id}`}
      data-testid={`card-listing-${listing.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col w-[80vw] max-w-[260px] sm:w-[240px] shrink-0 snap-start border border-slate-100"
    >
      <div className={`h-28 bg-gradient-to-br ${cat.gradient} flex items-center justify-center`}>
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <div>
          <h3 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-green-700 transition-colors">
            {listing.name}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-slate-400 text-xs">
            <MapPin className="w-3 h-3 text-green-500 shrink-0" />
            <span className="truncate">{listing.district}</span>
          </div>
        </div>
        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{listing.description}</p>
        <div className="mt-auto pt-2.5 border-t border-slate-100 flex items-center justify-between">
          {listing.avgStars && listing.avgStars > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Stars rating={listing.avgStars} />
              <span className="text-xs font-bold text-amber-500">{listing.avgStars}</span>
              <span className="text-xs text-slate-400">({listing.reviewCount})</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">No reviews yet</span>
          )}
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-green-500 transition-colors shrink-0" />
        </div>
      </div>
    </Link>
  );
}

function CategoryPill({ cat, active, onClick }: { cat: typeof CATEGORIES[0]; active: boolean; onClick: () => void }) {
  const Icon = cat.icon;
  return (
    <button
      onClick={onClick}
      data-testid={`filter-${cat.type.toLowerCase()}`}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0
        ${active
          ? `bg-gradient-to-r ${cat.gradient} text-white shadow-md`
          : "bg-white text-slate-600 border border-slate-200 hover:border-green-300 hover:text-green-700"
        }`}
    >
      <Icon className="w-4 h-4" />
      {cat.label}
    </button>
  );
}

export default function HomePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("All Districts");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const snap = await getDocs(query(collection(db, "listings")));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing));
        setListings(data);
      } catch {
        setListings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.refresh();
  };

  const isFiltering = search.trim() !== "" || district !== "All Districts" || activeCategory !== null;

  const applyFilters = (list: Listing[]) =>
    list.filter((l) => {
      const matchSearch =
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.district.toLowerCase().includes(search.toLowerCase()) ||
        (l.description?.toLowerCase() || "").includes(search.toLowerCase());
      const matchDistrict = district === "All Districts" || l.district === district;
      const matchCategory = activeCategory === null || l.type === activeCategory;
      return matchSearch && matchDistrict && matchCategory;
    });

  const sortByRating = (list: Listing[]) =>
    [...list].sort((a, b) => (b.avgStars || 0) - (a.avgStars || 0));

  const filteredAll = sortByRating(applyFilters(listings));

  const totalHotels = listings.filter((l) => l.type === "Hotel").length;
  const totalResorts = listings.filter((l) => l.type === "Resort").length;
  const totalRestaurants = listings.filter((l) => l.type === "Restaurant").length;

  const hasActiveFilters = search.trim() !== "" || district !== "All Districts" || activeCategory !== null;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-green-800 shadow-lg">
        <div className="w-full max-w-6xl mx-auto px-4 py-0 flex items-stretch justify-between gap-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 py-3 group">
            <div className="relative w-9 h-9 shrink-0">
              <div className="absolute inset-0 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <TreePalm className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-white text-sm sm:text-base leading-tight tracking-tight">
                Kerala Stay & Dine
              </p>
              <p className="text-green-300 text-[10px] sm:text-xs leading-none font-medium tracking-wide uppercase">
                God&apos;s Own Country
              </p>
            </div>
          </Link>

          {/* Nav / Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {user ? (
              <>
                <Link
                  href="/add"
                  data-testid="link-add-listing"
                  className="flex items-center gap-1.5 bg-white text-green-700 text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-xl shadow-sm hover:bg-green-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Place</span>
                </Link>
                <button
                  data-testid="button-logout"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-green-200 hover:text-white hover:bg-white/10 transition-colors text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs sm:text-sm text-green-200 hover:text-white font-semibold px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="text-xs sm:text-sm bg-white text-green-700 font-bold px-3 sm:px-5 py-2 rounded-xl shadow-sm hover:bg-green-50 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="h-0.5 bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400 opacity-60" />
      </header>

      {/* ── Hero ── */}
      <section className="w-full bg-gradient-to-br from-green-800 via-green-600 to-emerald-500">
        <div className="w-full max-w-6xl mx-auto px-4 py-8 sm:py-12">

          {/* Stats badges */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {[
              { icon: Hotel, label: `${totalHotels} Hotels`, cls: "bg-blue-500/20 text-blue-100" },
              { icon: TreePalm, label: `${totalResorts} Resorts`, cls: "bg-emerald-400/20 text-emerald-100" },
              { icon: UtensilsCrossed, label: `${totalRestaurants} Restaurants`, cls: "bg-orange-400/20 text-orange-100" },
            ].map(({ icon: Ic, label, cls }) => (
              <span key={label} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${cls}`}>
                <Ic className="w-3.5 h-3.5" /> {label}
              </span>
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-2 leading-tight">
            Discover <span className="text-emerald-300">Kerala</span>
          </h1>
          <p className="text-green-100 text-sm sm:text-base mb-6 max-w-lg">
            Hotels, Resorts & Restaurants across all 14 districts of God&apos;s Own Country
          </p>

          {/* Search box */}
          <div className="bg-white rounded-2xl shadow-xl p-2 flex flex-col sm:flex-row gap-2 w-full max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                data-testid="input-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or place..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-slate-50"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="relative">
              <select
                data-testid="select-district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="appearance-none w-full sm:w-auto pl-4 pr-8 py-2.5 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-slate-50 cursor-pointer"
              >
                {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Category Pills ── */}
      <div className="w-full bg-white border-b border-slate-100 sticky top-[64px] z-10">
        <div className="w-full max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            data-testid="filter-all"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap shrink-0
              ${activeCategory === null && !hasActiveFilters
                ? "bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-md"
                : activeCategory === null
                  ? "bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
          >
            <Waves className="w-4 h-4" /> All Places
          </button>
          {CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat.type}
              cat={cat}
              active={activeCategory === cat.type}
              onClick={() => setActiveCategory(activeCategory === cat.type ? null : cat.type)}
            />
          ))}
          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(""); setDistrict("All Districts"); setActiveCategory(null); }}
              className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-semibold text-red-500 border border-red-200 bg-red-50 whitespace-nowrap shrink-0 ml-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {loading ? (
          <div className="space-y-10">
            {[1, 2, 3].map((s) => (
              <div key={s}>
                <div className="h-7 w-36 bg-slate-200 rounded-xl animate-pulse mb-4" />
                <div className="flex gap-4 overflow-hidden">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-[80vw] max-w-[260px] sm:w-[240px] shrink-0 h-52 bg-white rounded-2xl animate-pulse border border-slate-100" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : isFiltering ? (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-700 text-base sm:text-lg">
                <span className="text-green-600">{filteredAll.length}</span> result{filteredAll.length !== 1 ? "s" : ""} found
              </h2>
            </div>
            {filteredAll.length === 0 ? (
              <div className="text-center py-16 sm:py-20">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-600 font-semibold text-base">No places match your search.</p>
                <p className="text-slate-400 text-sm mt-1">Try different keywords or filters</p>
                <button
                  onClick={() => { setSearch(""); setDistrict("All Districts"); setActiveCategory(null); }}
                  className="text-sm text-white bg-gradient-to-r from-green-600 to-emerald-500 px-5 py-2.5 rounded-xl mt-4 shadow-sm"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAll.map((l) => {
                  const cat = CATEGORIES.find((c) => c.type === l.type) || CATEGORIES[0];
                  return (
                    <Link
                      key={l.id}
                      href={`/listings/${l.id}`}
                      data-testid={`card-listing-${l.id}`}
                      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col"
                    >
                      <div className={`h-24 bg-gradient-to-br ${cat.gradient} flex items-center justify-center`}>
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          <cat.icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="p-3.5 flex flex-col gap-1.5 flex-1">
                        <h3 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-green-700 transition-colors">{l.name}</h3>
                        <div className="flex items-center gap-1 text-slate-400 text-xs">
                          <MapPin className="w-3 h-3 text-green-500 shrink-0" />
                          <span className="truncate">{l.district}</span>
                        </div>
                        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{l.description}</p>
                        <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between">
                          {l.avgStars && l.avgStars > 0 ? (
                            <div className="flex items-center gap-1">
                              <Stars rating={l.avgStars} />
                              <span className="text-xs font-bold text-amber-500">{l.avgStars}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No reviews</span>
                          )}
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-green-500 transition-colors" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-10 sm:space-y-12">
            {CATEGORIES.map((cat) => {
              const { type, plural, icon: Icon, gradient, lightBg, textColor, border, emptyMsg } = cat;
              const items = sortByRating(listings.filter((l) => l.type === type));
              return (
                <section key={type}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm shrink-0`}>
                        <Icon className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
                      </div>
                      <div>
                        <h2 className="font-extrabold text-slate-800 text-base sm:text-lg leading-tight">{plural}</h2>
                        <p className="text-xs text-slate-400">{items.length} listed · by rating</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {user && (
                        <Link
                          href="/add"
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${border} ${textColor} ${lightBg} hidden sm:flex`}
                        >
                          + Add
                        </Link>
                      )}
                      <button
                        onClick={() => setActiveCategory(type)}
                        className="text-xs font-semibold text-slate-500 hover:text-green-600 flex items-center gap-0.5 transition-colors"
                      >
                        See all <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {items.length === 0 ? (
                    <div className={`rounded-2xl border-2 border-dashed ${border} py-10 text-center`}>
                      <div className={`w-11 h-11 ${lightBg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                        <Icon className={`w-5 h-5 ${textColor} opacity-60`} />
                      </div>
                      <p className="text-slate-500 text-sm font-medium">{emptyMsg}</p>
                      {user ? (
                        <Link href="/add" className="text-xs text-green-600 hover:underline mt-1.5 inline-block font-semibold">
                          Be the first to add one →
                        </Link>
                      ) : (
                        <Link href="/register" className="text-xs text-green-600 hover:underline mt-1.5 inline-block font-semibold">
                          Sign in to add one →
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
                      {items.map((l) => (
                        <ListingCard key={l.id} listing={l} cat={cat} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="mt-10 w-full bg-gradient-to-br from-green-800 to-emerald-700 text-white">
        <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <TreePalm className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-extrabold text-sm">Kerala Stay & Dine</p>
                <p className="text-green-300 text-xs">Discover the best of God&apos;s Own Country</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-green-200">
              <span>{listings.length} places listed</span>
              <span>·</span>
              <span>14 districts</span>
              <span>·</span>
              <Wind className="w-3.5 h-3.5 text-green-300" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
