"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { BookOpen, LogIn } from "lucide-react";

export default function BookingsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pb-24">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 pb-24 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800 mb-2">Your Bookings</h2>
        <p className="text-slate-500 text-sm mb-6">Sign in to view and manage your bookings.</p>
        <Link
          href="/login"
          className="flex items-center gap-2 bg-green-500 text-white font-semibold px-6 py-3 rounded-full text-sm"
        >
          <LogIn className="w-4 h-4" />
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-800">My Bookings</h1>
      </div>
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-700 mb-2">No bookings yet</h2>
        <p className="text-slate-400 text-sm mb-6">
          When you make a booking, it will appear here.
        </p>
        <Link
          href="/"
          className="bg-green-500 text-white font-semibold px-6 py-3 rounded-full text-sm"
        >
          Explore Places
        </Link>
      </div>
    </div>
  );
}
