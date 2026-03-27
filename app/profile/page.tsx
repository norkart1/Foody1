"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { User, LogIn, LogOut, Plus, Mail, ChevronRight, Bookmark } from "lucide-react";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

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
          <User className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800 mb-2">My Profile</h2>
        <p className="text-slate-500 text-sm mb-6">Sign in to view your profile and manage listings.</p>
        <Link
          href="/login"
          className="flex items-center gap-2 bg-green-500 text-white font-semibold px-6 py-3 rounded-full text-sm mb-3"
        >
          <LogIn className="w-4 h-4" />
          Sign In
        </Link>
        <Link href="/register" className="text-green-500 font-semibold text-sm hover:underline">
          Create an account
        </Link>
      </div>
    );
  }

  const initials = user.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white px-4 pt-12 pb-6 shadow-sm mb-4">
        <h1 className="text-xl font-extrabold text-slate-800 mb-4">Profile</h1>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
            <span className="text-white text-xl font-extrabold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-slate-800 text-lg truncate">
              {user.displayName || "Welcome"}
            </p>
            <div className="flex items-center gap-1.5 text-slate-400 text-sm mt-0.5">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-3">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <Link
            href="/bookmarks"
            className="flex items-center gap-3 px-4 py-4 border-b border-slate-50 active:bg-slate-50"
          >
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
              <Bookmark className="w-5 h-5 text-green-500" />
            </div>
            <span className="flex-1 font-semibold text-slate-700 text-sm">My Bookmarks</span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </Link>
          <Link
            href="/add"
            className="flex items-center gap-3 px-4 py-4 border-b border-slate-50 active:bg-slate-50"
          >
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5 text-green-500" />
            </div>
            <span className="flex-1 font-semibold text-slate-700 text-sm">Add a Place</span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-4 w-full active:bg-slate-50"
          >
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5 text-red-400" />
            </div>
            <span className="flex-1 text-left font-semibold text-red-500 text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
