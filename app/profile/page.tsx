"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { updateProfile, sendPasswordResetEmail } from "firebase/auth";
import {
  User, LogIn, LogOut, ChevronRight, Bookmark,
  Bell, Shield, HelpCircle, Moon, Pencil, X,
  Check, Plus, ChevronDown, ChevronUp,
} from "lucide-react";

const HELP_FAQ = [
  {
    q: "How do I add a new listing?",
    a: "Tap the '+' button on the Profile page or in the header to submit a hotel, resort, or restaurant for review.",
  },
  {
    q: "How do I save a place?",
    a: "Tap the bookmark icon on any listing card or on the listing detail page. All saved places appear in My Bookmarks.",
  },
  {
    q: "Can I leave a review?",
    a: "Yes! Open any listing detail page and scroll to the Review section. You must be signed in to submit a review.",
  },
  {
    q: "How do I contact a property?",
    a: "On the listing detail page, tap the phone number or the call button at the bottom to dial directly.",
  },
  {
    q: "How do I reset my password?",
    a: "Go to Profile → Security and tap 'Send Reset Email'. We'll email you a link to set a new password.",
  },
];

function Sheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl px-5 pt-5 pb-10 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [editOpen, setEditOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState("");

  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");
  const [sendingReset, setSendingReset] = useState(false);

  const [darkTheme, setDarkTheme] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("darkTheme");
    if (stored === "true") {
      setDarkTheme(true);
      document.documentElement.classList.add("dark");
    }
    const notif = localStorage.getItem("notifications");
    setNotifications(notif !== "false");
  }, []);

  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user]);

  const handleDarkTheme = (val: boolean) => {
    setDarkTheme(val);
    localStorage.setItem("darkTheme", String(val));
    if (val) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const handleNotifications = (val: boolean) => {
    setNotifications(val);
    localStorage.setItem("notifications", String(val));
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) { setNameError("Name cannot be empty."); return; }
    setSavingName(true);
    setNameError("");
    try {
      await updateProfile(auth.currentUser!, { displayName: displayName.trim() });
      setNameSuccess(true);
      setTimeout(() => { setNameSuccess(false); setEditOpen(false); }, 1200);
    } catch {
      setNameError("Failed to update name. Please try again.");
    } finally {
      setSavingName(false);
    }
  };

  const handleSendReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    setResetError("");
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetSent(true);
    } catch {
      setResetError("Failed to send reset email. Please try again.");
    } finally {
      setSendingReset(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-24">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 pb-24 text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
          <User className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">My Profile</h2>
        <p className="text-gray-400 text-sm mb-6">Sign in to access your profile and manage listings.</p>
        <Link href="/login" className="flex items-center gap-2 bg-green-500 text-white font-bold px-8 py-3.5 rounded-full text-sm mb-3">
          <LogIn className="w-4 h-4" /> Sign In
        </Link>
        <Link href="/register" className="text-green-500 font-semibold text-sm">Create an account</Link>
      </div>
    );
  }

  const initials = user.displayName
    ? user.displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? "U";

  const menuItems = [
    {
      icon: <User className="w-5 h-5 text-green-600" />,
      label: "Edit Profile",
      action: () => setEditOpen(true),
    },
    {
      icon: <Bell className="w-5 h-5 text-green-600" />,
      label: "Notifications",
      action: () => setNotifOpen(true),
      trailing: (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${notifications ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
          {notifications ? "On" : "Off"}
        </span>
      ),
    },
    {
      icon: <Shield className="w-5 h-5 text-green-600" />,
      label: "Security",
      action: () => setSecurityOpen(true),
    },
    {
      icon: <Bookmark className="w-5 h-5 text-green-600" />,
      label: "My Bookmarks",
      href: "/bookmarks",
    },
    {
      icon: <Plus className="w-5 h-5 text-green-600" />,
      label: "Add a Place",
      href: "/add",
    },
    {
      icon: <HelpCircle className="w-5 h-5 text-green-600" />,
      label: "Help",
      action: () => setHelpOpen(true),
    },
    {
      icon: <Moon className="w-5 h-5 text-green-600" />,
      label: "Dark Theme",
      trailing: (
        <button
          onClick={(e) => { e.stopPropagation(); handleDarkTheme(!darkTheme); }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkTheme ? "bg-green-500" : "bg-gray-200"}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${darkTheme ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      ),
      action: () => handleDarkTheme(!darkTheme),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* ── Header ── */}
      <div className="bg-white px-5 pt-12 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-gray-900">Profile</h1>
      </div>

      {/* ── Avatar + Name ── */}
      <div className="bg-white pb-6 flex flex-col items-center">
        <div className="relative mb-3">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center overflow-hidden">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-3xl font-extrabold">{initials}</span>
            )}
          </div>
          <button
            onClick={() => setEditOpen(true)}
            className="absolute bottom-0 right-0 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-md border-2 border-white"
          >
            <Pencil className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <p className="text-lg font-extrabold text-gray-900">{user.displayName || "Welcome"}</p>
        <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
      </div>

      {/* ── Menu ── */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {menuItems.map((item, i) => {
            const isLast = i === menuItems.length - 1;
            const inner = (
              <div className={`flex items-center gap-4 px-4 py-4 ${!isLast ? "border-b border-gray-50" : ""}`}>
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <span className="flex-1 font-semibold text-gray-800 text-sm">{item.label}</span>
                {item.trailing ?? <ChevronRight className="w-4 h-4 text-gray-300" />}
              </div>
            );

            if (item.href) {
              return <Link key={item.label} href={item.href}>{inner}</Link>;
            }
            return (
              <button key={item.label} onClick={item.action} className="w-full text-left active:bg-gray-50">
                {inner}
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full mt-4 flex items-center gap-3 px-4 py-4 bg-white rounded-2xl shadow-sm"
        >
          <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5 text-red-400" />
          </div>
          <span className="text-red-500 font-bold text-sm">Logout</span>
        </button>
      </div>

      {/* ── Edit Profile Sheet ── */}
      <Sheet open={editOpen} onClose={() => { setEditOpen(false); setNameError(""); setNameSuccess(false); }} title="Edit Profile">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5 block">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5 block">Email</label>
            <input
              type="email"
              value={user.email || ""}
              disabled
              className="w-full px-4 py-3 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
          </div>
          {nameError && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{nameError}</p>}
          {nameSuccess && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg text-sm">
              <Check className="w-4 h-4" /> Profile updated!
            </div>
          )}
          <button
            onClick={handleSaveName}
            disabled={savingName}
            className="w-full bg-green-500 text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-60"
          >
            {savingName ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </Sheet>

      {/* ── Notifications Sheet ── */}
      <Sheet open={notifOpen} onClose={() => setNotifOpen(false)} title="Notifications">
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-semibold text-gray-800 text-sm">Push Notifications</p>
              <p className="text-xs text-gray-400 mt-0.5">Receive updates and alerts</p>
            </div>
            <button
              onClick={() => handleNotifications(!notifications)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${notifications ? "bg-green-500" : "bg-gray-200"}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${notifications ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-semibold text-gray-800 text-sm">Booking Reminders</p>
              <p className="text-xs text-gray-400 mt-0.5">Get reminded about upcoming bookings</p>
            </div>
            <button
              onClick={() => handleNotifications(!notifications)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${notifications ? "bg-green-500" : "bg-gray-200"}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${notifications ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-semibold text-gray-800 text-sm">New Listings</p>
              <p className="text-xs text-gray-400 mt-0.5">Be notified of new places in Kerala</p>
            </div>
            <button
              onClick={() => handleNotifications(!notifications)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${notifications ? "bg-green-500" : "bg-gray-200"}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${notifications ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          <button
            onClick={() => setNotifOpen(false)}
            className="w-full bg-green-500 text-white font-bold py-3.5 rounded-xl text-sm mt-2"
          >
            Done
          </button>
        </div>
      </Sheet>

      {/* ── Security Sheet ── */}
      <Sheet open={securityOpen} onClose={() => { setSecurityOpen(false); setResetSent(false); setResetError(""); }} title="Security">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            To change your password, we will send a reset link to <span className="font-semibold text-gray-800">{user.email}</span>.
          </p>
          {resetSent ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-xl text-sm font-semibold">
              <Check className="w-4 h-4 shrink-0" />
              Reset email sent! Check your inbox.
            </div>
          ) : (
            <>
              {resetError && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{resetError}</p>}
              <button
                onClick={handleSendReset}
                disabled={sendingReset}
                className="w-full bg-green-500 text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-60"
              >
                {sendingReset ? "Sending…" : "Send Reset Email"}
              </button>
            </>
          )}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 leading-relaxed">
              Your account is secured with Firebase Authentication. We recommend using a strong, unique password and keeping your email address up to date.
            </p>
          </div>
        </div>
      </Sheet>

      {/* ── Help Sheet ── */}
      <Sheet open={helpOpen} onClose={() => setHelpOpen(false)} title="Help & FAQ">
        <div className="space-y-2">
          {HELP_FAQ.map((item, i) => (
            <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left"
              >
                <span className="text-sm font-semibold text-gray-800 pr-3">{item.q}</span>
                {openFaq === i
                  ? <ChevronUp className="w-4 h-4 text-green-500 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-300 shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
          <div className="pt-3 text-center">
            <p className="text-xs text-gray-400">Still need help?</p>
            <a
              href="mailto:support@keralastayandine.com"
              className="text-green-500 text-sm font-semibold"
            >
              Contact Support
            </a>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
