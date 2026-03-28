"use client";

import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";

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

export function useListingNotifications() {
  const [notifications, setNotifications] = useState<ListingNotification[]>([]);
  const initialLoadDone = useRef(false);
  const knownIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const stored = loadStored();
    setNotifications(stored);
    stored.forEach((n) => knownIds.current.add(n.listingId));

    const q = query(collection(db, "listings"));

    const unsub = onSnapshot(q, (snapshot) => {
      if (!initialLoadDone.current) {
        snapshot.docs.forEach((doc) => knownIds.current.add(doc.id));
        initialLoadDone.current = true;
        return;
      }

      const newItems: ListingNotification[] = [];
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && !knownIds.current.has(change.doc.id)) {
          knownIds.current.add(change.doc.id);
          const data = change.doc.data();
          newItems.push({
            id: `notif_${change.doc.id}_${Date.now()}`,
            listingId: change.doc.id,
            name: data.name || "New Place",
            type: data.type || "Hotel",
            district: data.district || "",
            timestamp: Date.now(),
            read: false,
          });
        }
      });

      if (newItems.length > 0) {
        setNotifications((prev) => {
          const merged = [...newItems, ...prev].slice(0, MAX_STORED);
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
