"use client";

import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export interface ListingNotification {
  id: string;
  listingId: string;
  name: string;
  type: string;
  district: string;
  timestamp: number;
  read: boolean;
}

const STORAGE_KEY = "listing_notifications";
const LAST_CHECKED_KEY = "listing_notifications_last_checked";
const MAX_STORED = 30;

function loadStored(): ListingNotification[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveStored(items: ListingNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_STORED)));
}

function getLastChecked(): number {
  try {
    return Number(localStorage.getItem(LAST_CHECKED_KEY) || "0");
  } catch {
    return 0;
  }
}

function setLastChecked(ts: number) {
  localStorage.setItem(LAST_CHECKED_KEY, String(ts));
}

export function useListingNotifications() {
  const [notifications, setNotifications] = useState<ListingNotification[]>([]);
  const initialLoadDone = useRef(false);
  const knownIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Load previously stored notifications
    const stored = loadStored();
    setNotifications(stored);
    stored.forEach((n) => knownIds.current.add(n.listingId));

    // When the user last had the app open
    const lastChecked = getLastChecked();
    // Mark now as the new "last checked" so future sessions use this timestamp
    const sessionStart = Date.now();

    const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;

        // On initial load: find listings created AFTER lastChecked (i.e. added since last visit)
        const newItems: ListingNotification[] = [];

        snapshot.docs.forEach((doc) => {
          knownIds.current.add(doc.id);

          // Skip if already stored as a notification
          if (stored.some((n) => n.listingId === doc.id)) return;

          const data = doc.data();
          const createdAt = data.createdAt
            ? new Date(data.createdAt).getTime()
            : 0;

          // Only notify about listings added after the user's last visit
          // and only if lastChecked is set (not first-ever open)
          if (lastChecked > 0 && createdAt > lastChecked) {
            newItems.push({
              id: `notif_${doc.id}_${createdAt}`,
              listingId: doc.id,
              name: data.name || "New Place",
              type: data.type || "Hotel",
              district: data.district || "",
              timestamp: createdAt,
              read: false,
            });
          }
        });

        // Save new "last checked" timestamp for next session
        setLastChecked(sessionStart);

        if (newItems.length > 0) {
          setNotifications((prev) => {
            // Avoid duplicates
            const existingIds = new Set(prev.map((n) => n.listingId));
            const unique = newItems.filter((n) => !existingIds.has(n.listingId));
            const merged = [...unique, ...prev].slice(0, MAX_STORED);
            saveStored(merged);
            return merged;
          });
        }

        return;
      }

      // After initial load: detect listings added while the app is open (real-time)
      const newItems: ListingNotification[] = [];
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && !knownIds.current.has(change.doc.id)) {
          knownIds.current.add(change.doc.id);
          const data = change.doc.data();
          const createdAt = data.createdAt
            ? new Date(data.createdAt).getTime()
            : Date.now();
          newItems.push({
            id: `notif_${change.doc.id}_${Date.now()}`,
            listingId: change.doc.id,
            name: data.name || "New Place",
            type: data.type || "Hotel",
            district: data.district || "",
            timestamp: createdAt,
            read: false,
          });
        }
      });

      if (newItems.length > 0) {
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.listingId));
          const unique = newItems.filter((n) => !existingIds.has(n.listingId));
          const merged = [...unique, ...prev].slice(0, MAX_STORED);
          saveStored(merged);
          return merged;
        });
      }
    });

    return () => unsub();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveStored(updated);
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    saveStored([]);
  };

  return { notifications, unreadCount, markAllRead, clearAll };
}
