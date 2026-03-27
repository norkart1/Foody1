"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  doc, getDoc, collection, addDoc, getDocs,
  query, where, updateDoc
} from "firebase/firestore";
import {
  ArrowLeft, MapPin, Phone, Star,
  Hotel, UtensilsCrossed, TreePalm, LogOut, MessageSquare, Map, Images, ChevronLeft, ChevronRight
} from "lucide-react";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Hotel: <Hotel className="w-4 h-4" />,
  Resort: <TreePalm className="w-4 h-4" />,
  Restaurant: <UtensilsCrossed className="w-4 h-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  Hotel: "bg-blue-100 text-blue-700",
  Resort: "bg-green-100 text-green-700",
  Restaurant: "bg-orange-100 text-orange-700",
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
          data-testid={`star-${s}`}
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              s <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-slate-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
        />
      ))}
    </div>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const router = useRouter();

  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingListing, setLoadingListing] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const docSnap = await getDoc(doc(db, "listings", id));
        if (docSnap.exists()) {
          setListing({ id: docSnap.id, ...docSnap.data() } as Listing);
        }
      } finally {
        setLoadingListing(false);
      }
    };
    fetchListing();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const q = query(
          collection(db, "reviews"),
          where("listingId", "==", id)
        );
        const snap = await getDocs(q);
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Review))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setReviews(data);
        if (user) {
          setAlreadyReviewed(data.some((r) => r.userId === user.uid));
        }
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
        stars,
        comment: comment.trim(),
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

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (loadingListing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-slate-600 font-medium">Listing not found.</p>
        <Link href="/" className="text-green-600 hover:underline text-sm">Go back home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <TreePalm className="w-5 h-5 text-green-600" />
            <span className="font-bold text-slate-800 hidden sm:block">Kerala Stay & Dine</span>
          </div>
          {user && (
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Lightbox */}
      {lightboxIndex >= 0 && listing.photos && listing.photos.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(-1)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
            onClick={() => setLightboxIndex(-1)}
            data-testid="button-lightbox-close"
          >
            <ChevronLeft className="w-6 h-6 rotate-[135deg]" />
          </button>
          {listing.photos.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full p-2 transition-colors"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + listing.photos!.length) % listing.photos!.length); }}
                data-testid="button-lightbox-prev"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full p-2 transition-colors"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % listing.photos!.length); }}
                data-testid="button-lightbox-next"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={listing.photos[lightboxIndex]}
            alt={`${listing.name} photo ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 text-white/60 text-sm">
            {lightboxIndex + 1} / {listing.photos.length}
          </p>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">

          {/* Photo gallery */}
          {listing.photos && listing.photos.length > 0 ? (
            <div className="relative">
              {/* Main photo */}
              <div
                className="h-56 sm:h-72 w-full overflow-hidden cursor-pointer bg-slate-100"
                onClick={() => setLightboxIndex(0)}
                data-testid="photo-gallery-main"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={listing.photos[0]}
                  alt={`${listing.name} main photo`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              {/* Thumbnail strip */}
              {listing.photos.length > 1 && (
                <div className="flex gap-1.5 p-3 bg-slate-50 border-b border-slate-100 overflow-x-auto scrollbar-hide">
                  {listing.photos.map((photo, i) => (
                    <button
                      key={i}
                      data-testid={`photo-thumb-${i}`}
                      onClick={() => setLightboxIndex(i)}
                      className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === 0 ? "border-green-500" : "border-transparent hover:border-green-300"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <div className="flex items-center gap-1 ml-1 text-xs text-slate-400 shrink-0">
                    <Images className="w-3.5 h-3.5" />
                    {listing.photos.length} photos
                  </div>
                </div>
              )}
              {listing.photos.length === 1 && (
                <div className="absolute bottom-3 right-3 flex items-center gap-1 text-xs text-white bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-sm">
                  <Images className="w-3 h-3" />
                  Tap to view
                </div>
              )}
            </div>
          ) : null}

          <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h1 className="text-2xl font-extrabold text-slate-800">{listing.name}</h1>
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ${TYPE_COLORS[listing.type] || "bg-slate-100 text-slate-600"}`}>
              {TYPE_ICONS[listing.type]} {listing.type}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            {listing.avgStars > 0 ? (
              <>
                <StarDisplay rating={listing.avgStars} />
                <span className="font-bold text-slate-800">{listing.avgStars}</span>
                <span className="text-slate-400 text-sm">({listing.reviewCount} {listing.reviewCount === 1 ? "review" : "reviews"})</span>
              </>
            ) : (
              <span className="text-slate-400 text-sm">No reviews yet — be the first!</span>
            )}
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-start gap-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <span>{listing.address}, {listing.district}</span>
            </div>
            {listing.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-green-600 shrink-0" />
                <a href={`tel:${listing.phone}`} className="hover:text-green-600 transition-colors">{listing.phone}</a>
              </div>
            )}
          </div>

          <p className="text-slate-600 leading-relaxed mb-4">{listing.description}</p>

          {listing.addedByName && (
            <p className="text-xs text-slate-400">Added by {listing.addedByName}</p>
          )}
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <Map className="w-4 h-4 text-green-600" />
            <h2 className="text-sm font-bold text-slate-700">Location</h2>
          </div>
          <div className="h-64 sm:h-80 w-full">
            <iframe
              data-testid="map-embed"
              title={`Map for ${listing.name}`}
              className="w-full h-full border-0"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(`${listing.address}, ${listing.district}, Kerala, India`)}&output=embed&z=15`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <MessageSquare className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-bold text-slate-800">Reviews</h2>
            {reviews.length > 0 && <span className="text-sm text-slate-400">({reviews.length})</span>}
          </div>

          {user ? (
            alreadyReviewed ? (
              <div className="bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-3 rounded-xl mb-6">
                You have already reviewed this place. Thank you!
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="mb-8 pb-6 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-700 mb-3">Write a Review</p>
                <div className="mb-3">
                  <label className="text-xs text-slate-500 mb-1 block">Your Rating</label>
                  <StarPicker value={stars} onChange={setStars} />
                </div>
                <div className="mb-3">
                  <label className="text-xs text-slate-500 mb-1 block">Your Comment</label>
                  <textarea
                    data-testid="textarea-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="Share your experience..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                  />
                </div>
                {reviewError && (
                  <p data-testid="text-review-error" className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg mb-3">{reviewError}</p>
                )}
                <button
                  data-testid="button-submit-review"
                  type="submit"
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            )
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 mb-6 text-center">
              <p className="text-slate-500 text-sm mb-2">Sign in to leave a review</p>
              <Link href="/login" className="text-sm bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg transition-colors inline-block">
                Sign In
              </Link>
            </div>
          )}

          {loadingReviews ? (
            <div className="space-y-4">
              {[1, 2].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No reviews yet. Be the first to share your experience!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} data-testid={`review-${review.id}`} className="border-b border-slate-100 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800 text-sm">{review.userName}</span>
                    <span className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                  <div className="flex items-center gap-0.5 mb-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= review.stars ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                    ))}
                  </div>
                  <p className="text-slate-600 text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
