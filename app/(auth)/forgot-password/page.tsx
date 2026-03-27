"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Mail, ArrowLeft, MailCheck, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setError("");
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (e.code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else if (e.code === "auth/user-not-found") {
        setSent(true);
      } else {
        setError(e.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center sm:items-center sm:py-12">
      <div className="w-full max-w-sm bg-white flex flex-col min-h-screen sm:min-h-0 sm:rounded-2xl sm:shadow-md px-6 pt-12 pb-8">

        <Link href="/login" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors mb-8 self-start">
          <ArrowLeft className="w-4 h-4 text-slate-700" />
        </Link>

        {sent ? (
          <div className="flex flex-col flex-1">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
              <MailCheck className="w-7 h-7 text-green-500" />
            </div>
            <h1 className="text-[2rem] font-extrabold text-slate-900 leading-tight mb-3">
              Check your<br />Inbox
            </h1>
            <p className="text-slate-500 text-sm mb-5">
              If <span className="font-semibold text-slate-700">{email}</span> is linked to an account, a reset link has been sent.
            </p>
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-amber-700 text-sm">
                  <span className="font-semibold">Check your Spam / Junk folder</span> — Firebase emails often land there.
                </p>
              </div>
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3.5">
                <Mail className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-blue-700 text-sm">
                  If you signed up with <span className="font-semibold">Google</span>, use the Google button to sign in — there is no password to reset.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setSent(false); setEmail(""); }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-4 rounded-full transition-colors text-sm mb-3"
            >
              Try a different email
            </button>
            <Link
              href="/login"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-full transition-colors text-sm text-center block"
            >
              Back to Sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-[2rem] font-extrabold text-slate-900 leading-tight mb-3">
              Forgot your<br />Password?
            </h1>
            <p className="text-slate-500 text-sm mb-5">
              Enter your account email and we&apos;ll send a reset link to your inbox.
            </p>

            <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-amber-700 text-xs leading-relaxed">
                The email may land in your <span className="font-semibold">Spam or Junk folder</span>. This only works for email/password accounts, not Google sign-in.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="flex items-center gap-3 bg-slate-100 rounded-2xl px-4 py-3.5 mb-4">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  className="flex-1 bg-transparent text-slate-800 text-sm placeholder-slate-400 focus:outline-none"
                />
              </div>

              {error && (
                <div className="mb-4 text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold py-4 rounded-full transition-colors disabled:opacity-60 text-sm mb-4"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-auto">
              Remember your password?{" "}
              <Link href="/login" className="text-green-500 font-semibold hover:underline">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
