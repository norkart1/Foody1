"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useBookmarks } from "@/hooks/useBookmarks";
import { db } from "@/lib/firebase";
import {
  doc, getDoc, collection, addDoc, getDocs,
  query, where, updateDoc,
} from "firebase/firestore";
import {
  ArrowLeft, MapPin, Star, Bookmark, Phone,
  Hotel, UtensilsCrossed, TreePalm, Wifi, Car,
  Waves, Dumbbell, ConciergeBell, Clock, Utensils,
  ChevronLeft, ChevronRight, X, BedDouble, Bath,
  SquareStack, ChevronDown, ChevronUp,
} from "lucide-react";

const FACILITY_ICONS: Record<string, React.ElementType> = {
  "Swimming Pool": Waves,
  "Wifi": Wifi,
  "Restaurant": Utensils,
  "Parking": Car,
  "Meeting Room": ConciergeBell,
  "Elevator": SquareStack,
  "Fitness Center": Dumbbell,
  "24-hours Open": Clock,
};

interface Listing {
  id: string;
  name: string;
  type: string;
  district: string;
  description: string;
  address: string;
  phone?: string;
  photos?: string[];
  avgStars: number;
  reviewCount: number;
  addedByName?: string;
  price?: number;
  facilities?: string[];
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  totalRooms?: number;
  roomTypes?: string[];
  lat?: number;
  lng?: number;
  mapsLink?: string;
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  stars: number;
  comment: string;
  createdAt: string;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              s <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-gray-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const colors = [
    "bg-blue-500", "bg-purple-500", "bg-pink-500",
    "bg-orange-500", "bg-teal-500", "bg-indigo-500",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center shrink-0`}>
      <span className="text-white text-sm font-bold">{initials}</span>
    </div>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingListing, setLoadingListing] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const [lightboxIndex, setLightboxIndex] = useState(-1);

  useEffect(() => {
    getDoc(doc(db, "listings", id))
      .then((snap) => { if (snap.exists()) setListing({ id: snap.id, ...snap.data() } as Listing); })
      .finally(() => setLoadingListing(false));
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const snap = await getDocs(query(collection(db, "reviews"), where("listingId", "==", id)));
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Review))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setReviews(data);
        if (user) setAlreadyReviewed(data.some((r) => r.userId === user.uid));
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [id, user]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError("");
    if (stars === 0) { setReviewError("Please select a star rating."); return; }
    if (!comment.trim()) { setReviewError("Please write a comment."); return; }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "reviews"), {
        listingId: id,
        userId: user!.uid,
        userName: user!.displayName || user!.email,
        stars,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      });
      const newCount = (listing?.reviewCount || 0) + 1;
      const newAvg = ((listing?.avgStars || 0) * (listing?.reviewCount || 0) + stars) / newCount;
      await updateDoc(doc(db, "listings", id), {
        avgStars: Math.round(newAvg * 10) / 10,
        reviewCount: newCount,
      });
      const newReview: Review = {
        id: Date.now().toString(),
        userId: user!.uid,
        userName: user!.displayName || user!.email || "Anonymous",
        stars, comment: comment.trim(),
        createdAt: new Date().toISOString(),
      };
      setReviews((prev) => [newReview, ...prev]);
      setListing((prev) => prev ? { ...prev, avgStars: Math.round(newAvg * 10) / 10, reviewCount: newCount } : prev);
      setAlreadyReviewed(true);
      setStars(0);
      setComment("");
    } catch {
      setReviewError("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingListing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600 font-medium">Listing not found.</p>
        <Link href="/" className="text-green-500 text-sm font-semibold">Go back home</Link>
      </div>
    );
  }

  const photos = listing.photos || [];
  const galleryPhotos = photos.slice(1, 4);
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  const typeIcon = listing.type === "Restaurant" ? <Utensils className="w-4 h-4" />
    : listing.type === "Resort" ? <TreePalm className="w-4 h-4" />
    : <Hotel className="w-4 h-4" />;

  const details = [
    { icon: typeIcon, label: listing.type },
    ...(listing.bedrooms ? [{ icon: <BedDouble className="w-4 h-4" />, label: `${listing.bedrooms} Bedrooms` }] : []),
    ...(listing.bathrooms ? [{ icon: <Bath className="w-4 h-4" />, label: `${listing.bathrooms} Bathrooms` }] : []),
    ...(listing.area ? [{ icon: <SquareStack className="w-4 h-4" />, label: `${listing.area} sqft` }] : []),
  ];

  const facilities = listing.facilities || [];

  return (
    <div className="min-h-screen bg-white pb-28">

      {/* ── Lightbox ── */}
      {lightboxIndex >= 0 && photos.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(-1)}
        >
          <button
            className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
            onClick={() => setLightboxIndex(-1)}
          >
            <X className="w-5 h-5 text-white" />
          </button>
          {photos.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full p-2"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length); }}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full p-2"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % photos.length); }}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[lightboxIndex]}
            alt={`${listing.name} photo ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 text-white/60 text-sm">{lightboxIndex + 1} / {photos.length}</p>
        </div>
      )}

      {/* ── Hero Image ── */}
      <div className="relative w-full h-64 bg-gray-200">
        {photos.length > 0 ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={photos[0]}
            alt={listing.name}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setLightboxIndex(0)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center">
            <Hotel className="w-16 h-16 text-white/60" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-10 left-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow"
        >
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>

        {/* Bookmark button */}
        <button
          onClick={() => toggleBookmark(listing)}
          className="absolute top-10 right-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow"
        >
          <Bookmark
            className="w-5 h-5 text-gray-700"
            fill={isBookmarked(listing.id) ? "#22c55e" : "none"}
            stroke={isBookmarked(listing.id) ? "#22c55e" : "currentColor"}
          />
        </button>
      </div>

      {/* ── Name & Address ── */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{listing.name}</h1>
        <div className="flex items-center gap-1.5 mt-2">
          <MapPin className="w-4 h-4 text-green-500 shrink-0" />
          <p className="text-gray-500 text-sm">{listing.address}{listing.address ? ", " : ""}{listing.district}, Kerala</p>
        </div>
        {listing.phone && (
          <a
            href={`tel:${listing.phone}`}
            className="inline-flex items-center gap-2 mt-3 bg-green-50 border border-green-100 px-4 py-2.5 rounded-xl"
          >
            <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shrink-0">
              <Phone className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 leading-none mb-0.5">Phone number</p>
              <p className="text-sm font-bold text-gray-900">{listing.phone}</p>
            </div>
          </a>
        )}
      </div>

      {/* ── Gallery Photos ── */}
      {photos.length > 1 && (
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-gray-900">Gallery Photos</h2>
            {photos.length > 4 && (
              <button
                onClick={() => setLightboxIndex(0)}
                className="text-green-500 text-sm font-semibold"
              >
                See All
              </button>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {galleryPhotos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i + 1)}
                className="shrink-0 w-24 h-20 rounded-xl overflow-hidden border border-gray-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
            {photos.length > 4 && (
              <button
                onClick={() => setLightboxIndex(0)}
                className="shrink-0 w-24 h-20 rounded-xl bg-gray-100 flex flex-col items-center justify-center text-xs text-gray-500 font-semibold"
              >
                +{photos.length - 4}
                <span className="text-[10px]">more</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Details ── */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-extrabold text-gray-900 mb-3">Details</h2>
        <div className="flex gap-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {details.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 min-w-[60px]">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                {d.icon}
              </div>
              <span className="text-xs text-gray-500 text-center leading-tight">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Description ── */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-extrabold text-gray-900 mb-2">Description</h2>
        <p className={`text-gray-500 text-sm leading-relaxed ${!descExpanded ? "line-clamp-4" : ""}`}>
          {listing.description}
        </p>
        {listing.description && listing.description.length > 200 && (
          <button
            onClick={() => setDescExpanded(!descExpanded)}
            className="flex items-center gap-1 text-green-500 text-sm font-semibold mt-2"
          >
            {descExpanded ? "Show less" : "Read more"}
            {descExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* ── Facilities ── */}
      {facilities.length > 0 && (
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-extrabold text-gray-900 mb-3">Facilities</h2>
          <div className="grid grid-cols-4 gap-4">
            {facilities.map((fac) => {
              const Icon = FACILITY_ICONS[fac] || ConciergeBell;
              return (
                <div key={fac} className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] text-gray-500 text-center leading-tight">{fac}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Location ── */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-extrabold text-gray-900">Location</h2>
          <Link
            href={`/listings/${listing.id}/map`}
            className="text-green-500 text-sm font-semibold"
          >
            View Map
          </Link>
        </div>
        {/* Map preview — tapping opens Google Maps or internal map page */}
        <a
          href={
            listing.mapsLink
              ? listing.mapsLink
              : listing.lat && listing.lng
              ? `https://maps.google.com/maps?q=${listing.lat},${listing.lng}`
              : `https://maps.google.com/maps?q=${encodeURIComponent(`${listing.address}, ${listing.district}, Kerala, India`)}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="relative h-44 rounded-2xl overflow-hidden border border-gray-100">
            <iframe
              title={`Map preview for ${listing.name}`}
              className="w-full h-full border-0 pointer-events-none"
              src={
                listing.lat && listing.lng
                  ? `https://maps.google.com/maps?q=${listing.lat},${listing.lng}&output=embed&z=16`
                  : `https://maps.google.com/maps?q=${encodeURIComponent(`${listing.address}, ${listing.district}, Kerala, India`)}&output=embed&z=15`
              }
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {/* Transparent overlay — catches tap, opens Google Maps */}
            <div className="absolute inset-0 bg-transparent cursor-pointer" />
            {/* Badge */}
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-green-500" />
              Open in Maps
            </div>
          </div>
        </a>
        {/* Direct Google Maps button */}
        <a
          href={
            listing.mapsLink
              ? listing.mapsLink
              : listing.lat && listing.lng
              ? `https://maps.google.com/maps?q=${listing.lat},${listing.lng}`
              : `https://maps.google.com/maps?q=${encodeURIComponent(`${listing.address}, ${listing.district}, Kerala, India`)}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-700 text-sm font-semibold active:bg-green-100 transition-colors"
        >
          <MapPin className="w-4 h-4" />
          Open in Google Maps
        </a>
      </div>

      {/* ── Reviews ── */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-gray-900">Review</h2>
            {listing.avgStars > 0 && (
              <span className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-amber-600">
                  {listing.avgStars.toFixed(1)} ({listing.reviewCount} reviews)
                </span>
              </span>
            )}
          </div>
          {reviews.length > 3 && (
            <button onClick={() => setShowAllReviews(!showAllReviews)} className="text-green-500 text-sm font-semibold">
              {showAllReviews ? "Show Less" : "See All"}
            </button>
          )}
        </div>

        {/* Write review form */}
        {user ? (
          alreadyReviewed ? (
            <div className="bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-3 rounded-xl mb-5">
              You have already reviewed this place. Thank you!
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="bg-gray-50 rounded-2xl p-4 mb-5">
              <p className="text-sm font-bold text-gray-800 mb-3">Write a Review</p>
              <div className="mb-3">
                <label className="text-xs text-gray-400 mb-1 block">Your Rating</label>
                <StarPicker value={stars} onChange={setStars} />
              </div>
              <div className="mb-3">
                <label className="text-xs text-gray-400 mb-1 block">Your Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Share your experience…"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                />
              </div>
              {reviewError && (
                <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg mb-3">{reviewError}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="bg-green-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit Review"}
              </button>
            </form>
          )
        ) : (
          <div className="bg-gray-50 rounded-2xl px-4 py-5 mb-5 text-center">
            <p className="text-gray-400 text-sm mb-3">Sign in to leave a review</p>
            <Link href="/login" className="bg-green-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm">
              Sign In
            </Link>
          </div>
        )}

        {/* Review cards */}
        {loadingReviews ? (
          <div className="space-y-4">
            {[1, 2].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-4">
            {visibleReviews.map((review) => (
              <div key={review.id} className="flex gap-3">
                <Avatar name={review.userName} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-900 text-sm">{review.userName}</p>
                    <span className="flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3 fill-white" />
                      {review.stars}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-gray-600 text-sm mt-1 leading-relaxed">{review.comment}</p>
                </div>
              </div>
            ))}
            {reviews.length > 3 && (
              <button
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="w-full flex items-center justify-center gap-1.5 py-3 border border-gray-200 rounded-2xl text-gray-500 text-sm font-semibold"
              >
                {showAllReviews ? "Show less" : `More (${reviews.length - 3})`}
                {showAllReviews ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Fixed Bottom Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-5 py-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          {listing.price ? (
            <>
              <span className="text-2xl font-extrabold text-gray-900">₹{listing.price.toLocaleString()}</span>
              <span className="text-gray-400 text-sm"> / night</span>
            </>
          ) : (
            <span className="text-gray-400 text-sm font-semibold">Contact for price</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {listing.phone && (
            <a
              href={`tel:${listing.phone}`}
              className="w-12 h-12 bg-green-50 border border-green-200 rounded-full flex items-center justify-center"
              title={listing.phone}
            >
              <Phone className="w-5 h-5 text-green-600" />
            </a>
          )}
          <Link
            href={user ? `/bookings?listing=${id}` : "/login"}
            className="bg-green-500 text-white font-bold px-8 py-3.5 rounded-full text-sm"
          >
            Book Now!
          </Link>
        </div>
      </div>
    </div>
  );
}
