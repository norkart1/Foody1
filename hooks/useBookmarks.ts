"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

export interface BookmarkedListing {
  id: string;
  name: string;
  type: string;
  district: string;
  avgStars?: number;
  reviewCount?: number;
  photos?: string[];
  price?: number;
  savedAt: number;
}

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkedListing[]>([]);
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBookmarks([]);
      setBookmarkIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = collection(db, "users", user.uid, "bookmarks");
    const unsub = onSnapshot(ref, (snap) => {
      const items = snap.docs.map((d) => d.data() as BookmarkedListing);
      items.sort((a, b) => b.savedAt - a.savedAt);
      setBookmarks(items);
      setBookmarkIds(new Set(items.map((b) => b.id)));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const addBookmark = useCallback(
    async (listing: Omit<BookmarkedListing, "savedAt">) => {
      if (!user) return;
      const ref = doc(db, "users", user.uid, "bookmarks", listing.id);
      await setDoc(ref, { ...listing, savedAt: Date.now() });
    },
    [user]
  );

  const removeBookmark = useCallback(
    async (listingId: string) => {
      if (!user) return;
      const ref = doc(db, "users", user.uid, "bookmarks", listingId);
      await deleteDoc(ref);
    },
    [user]
  );

  const toggleBookmark = useCallback(
    async (listing: Omit<BookmarkedListing, "savedAt">) => {
      if (bookmarkIds.has(listing.id)) {
        await removeBookmark(listing.id);
      } else {
        await addBookmark(listing);
      }
    },
    [bookmarkIds, addBookmark, removeBookmark]
  );

  const isBookmarked = useCallback(
    (id: string) => bookmarkIds.has(id),
    [bookmarkIds]
  );

  return { bookmarks, loading, isBookmarked, toggleBookmark, removeBookmark };
}
