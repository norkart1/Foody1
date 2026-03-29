"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { TreePalm, ArrowLeft, ImagePlus, X, Loader2, MapPin, ChevronDown, ChevronUp } from "lucide-react";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] bg-slate-100 rounded-2xl flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

const DISTRICTS = [
  "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha",
  "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad",
  "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
];

const MAX_PHOTOS = 5;
const MAX_PX = 1200;
const JPEG_QUALITY = 0.78;
// Files under this size are stored as base64 in Firestore — no Storage round-trip needed
const INLINE_THRESHOLD = 120 * 1024; // 120 KB

function toBase64(blob: Blob | File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_PX || height > MAX_PX) {
        if (width >= height) {
          height = Math.round((height * MAX_PX) / width);
          width = MAX_PX;
        } else {
          width = Math.round((width * MAX_PX) / height);
          height = MAX_PX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => { blob ? resolve(blob) : resolve(file); },
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}

async function processPhoto(file: File, idx: number, tempId: string): Promise<string> {
  // Small file → base64 stored in Firestore, no Storage round-trip needed (instant)
  if (file.size <= INLINE_THRESHOLD) {
    return toBase64(file);
  }
  // Large file → compress first
  const blob = await compressImage(file);
  // If compression brought it under threshold, still avoid Storage
  if (blob.size <= INLINE_THRESHOLD) {
    return toBase64(blob);
  }
  // Still large → upload to Firebase Storage
  const sRef = storageRef(storage, `listings/${tempId}/photo_${idx}.jpg`);
  await uploadBytes(sRef, blob, { contentType: "image/jpeg" });
  return getDownloadURL(sRef);
}

export default function AddListingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    type: "Hotel",
    district: "Thiruvananthapuram",
    description: "",
    address: "",
    phone: "",
    // Room details (Hotel / Resort only)
    pricePerNight: "",
    totalRooms: "",
    roomTypes: [] as string[],
  });

  const ROOM_TYPES = ["Single", "Double", "Twin", "Triple", "Suite", "Deluxe", "Family Room", "Executive"];

  const toggleRoomType = (rt: string) => {
    setForm((prev) => ({
      ...prev,
      roomTypes: prev.roomTypes.includes(rt)
        ? prev.roomTypes.filter((r) => r !== rt)
        : [...prev.roomTypes, rt],
    }));
  };

  const isAccommodation = form.type === "Hotel" || form.type === "Resort";

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_PHOTOS - photoFiles.length;
    const toAdd = files.slice(0, remaining);

    const previews = toAdd.map((f) => URL.createObjectURL(f));
    setPhotoFiles((prev) => [...prev, ...toAdd]);
    setPhotoPreviews((prev) => [...prev, ...previews]);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.description.trim() || !form.address.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);

    try {
      let photoUrls: string[] = [];

      if (photoFiles.length > 0) {
        const tempId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
        setUploadProgress(`Processing photos…`);
        let done = 0;
        photoUrls = await Promise.all(
          photoFiles.map(async (file, i) => {
            const url = await processPhoto(file, i, tempId);
            done += 1;
            setUploadProgress(`Processing (${done} / ${photoFiles.length})…`);
            return url;
          })
        );
      }

      setUploadProgress("Saving listing…");
      const docData: Record<string, unknown> = {
        name: form.name,
        type: form.type,
        district: form.district,
        description: form.description,
        address: form.address,
        phone: form.phone,
        photos: photoUrls,
        addedBy: user!.uid,
        addedByName: user!.displayName || user!.email,
        avgStars: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
      };
      // Include room details only for hotels / resorts
      if (isAccommodation) {
        if (form.pricePerNight) docData.price = Number(form.pricePerNight);
        if (form.totalRooms) docData.totalRooms = Number(form.totalRooms);
        if (form.roomTypes.length) docData.roomTypes = form.roomTypes;
      }
      // Include coordinates if set
      if (lat != null && lng != null) {
        docData.lat = lat;
        docData.lng = lng;
      }
      const docRef = await addDoc(collection(db, "listings"), docData);
      router.push(`/listings/${docRef.id}`);
    } catch (err) {
      console.error(err);
      setError("Failed to add listing. Please check Firebase Storage rules and try again.");
    } finally {
      setSubmitting(false);
      setUploadProgress("");
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <TreePalm className="w-5 h-5 text-green-600" />
            <span className="font-bold text-slate-800">Add a Place</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-1">Add New Listing</h1>
          <p className="text-slate-500 text-sm mb-6">Share a hotel, resort or restaurant in Kerala</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Place Name *</label>
                <input
                  name="name"
                  data-testid="input-name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Green Valley Resort"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
                <select
                  name="type"
                  data-testid="select-type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                >
                  <option>Hotel</option>
                  <option>Resort</option>
                  <option>Restaurant</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">District *</label>
                <select
                  name="district"
                  data-testid="select-district"
                  value={form.district}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                >
                  {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <textarea
                  name="description"
                  data-testid="textarea-description"
                  required
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe the place — facilities, specialties, what makes it unique..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                <input
                  name="address"
                  data-testid="input-address"
                  required
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Full address or location"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  name="phone"
                  data-testid="input-phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            </div>

            {/* ── Map Location Picker ── */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setMapOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-white"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold text-slate-700">Pin Location on Map</span>
                  <span className="text-xs text-slate-400">(optional)</span>
                  {lat != null && lng != null && (
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Set</span>
                  )}
                </div>
                {mapOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {mapOpen && (
                <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-slate-100">
                  <MapPicker
                    lat={lat}
                    lng={lng}
                    onChange={(newLat, newLng) => { setLat(newLat); setLng(newLng); }}
                  />
                </div>
              )}
            </div>

            {/* ── Room Details (Hotel / Resort only) ── */}
            {isAccommodation && (
              <div className="border border-green-100 bg-green-50/50 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">🛏️</span>
                  <p className="text-sm font-semibold text-slate-700">Room Details</p>
                  <span className="text-xs text-slate-400 font-normal">(optional)</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Price per Night (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                      <input
                        name="pricePerNight"
                        type="number"
                        min="0"
                        value={form.pricePerNight}
                        onChange={handleChange}
                        placeholder="e.g. 5000"
                        className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Total Rooms</label>
                    <input
                      name="totalRooms"
                      type="number"
                      min="1"
                      value={form.totalRooms}
                      onChange={handleChange}
                      placeholder="e.g. 24"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Room Types Available</label>
                  <div className="flex flex-wrap gap-2">
                    {ROOM_TYPES.map((rt) => {
                      const selected = form.roomTypes.includes(rt);
                      return (
                        <button
                          key={rt}
                          type="button"
                          onClick={() => toggleRoomType(rt)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            selected
                              ? "bg-green-500 text-white border-green-500"
                              : "bg-white text-slate-600 border-slate-200"
                          }`}
                        >
                          {rt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Photos <span className="text-slate-400 font-normal">(optional · up to {MAX_PHOTOS})</span>
              </label>

              {/* Thumbnails */}
              {photoPreviews.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-3">
                  {photoPreviews.map((src, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        data-testid={`button-remove-photo-${i}`}
                        onClick={() => removePhoto(i)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add photo button */}
              {photoFiles.length < MAX_PHOTOS && (
                <>
                  <button
                    type="button"
                    data-testid="button-add-photos"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 hover:border-green-400 hover:bg-green-50 rounded-lg text-sm text-slate-500 hover:text-green-600 transition-all w-full justify-center"
                  >
                    <ImagePlus className="w-4 h-4" />
                    {photoPreviews.length === 0 ? "Add photos" : `Add more (${MAX_PHOTOS - photoFiles.length} left)`}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoSelect}
                    data-testid="input-photos"
                  />
                </>
              )}
            </div>

            {error && (
              <p data-testid="text-error" className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            {uploadProgress && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>{uploadProgress}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Link href="/" className="flex-1 text-center py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                Cancel
              </Link>
              <button
                data-testid="button-submit"
                type="submit"
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? (uploadProgress.split("…")[0] || "Saving…") : "Add Listing"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
