"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email address."); return; }
    setError(""); setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === "auth/user-not-found" || e.code === "auth/invalid-email")
        setError("No account found with that email address.");
      else if (e.code === "auth/too-many-requests")
        setError("Too many attempts. Please wait a moment and try again.");
      else
        setError(e.message || "Failed to send reset email. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center sm:items-center sm:py-12">
      <div className="w-full max-w-sm bg-white flex flex-col min-h-screen sm:min-h-0 sm:rounded-2xl sm:shadow-md px-6 pt-12 pb-8">

        <Link href="/login" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors mb-8 self-start">
          <ArrowLeft className="w-4 h-4 text-slate-700" />
        </Link>

        {sent ? (
          <div className="flex flex-col flex-1">
            <h1 className="text-[2rem] font-extrabold text-slate-900 leading-tight mb-4">
              Check your<br />Email
            </h1>
            <p className="text-slate-500 text-sm mb-8">
              We sent a password reset link to <span className="font-semibold text-slate-700">{email}</span>. Check your inbox and follow the instructions.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-4 mb-8">
              <p className="text-green-700 text-sm">
                Didn&apos;t receive it? Check your spam folder or try again below.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setSent(false); setEmail(""); }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-4 rounded-full transition-colors text-sm mb-4"
            >
              Try a different email
            </button>
            <Link
              href="/login"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-full transition-colors text-sm text-center"
            >
              Back to Sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-[2rem] font-extrabold text-slate-900 leading-tight mb-4">
              Forgot your<br />Password?
            </h1>
            <p className="text-slate-500 text-sm mb-8">
              Enter the email address linked to your account and we&apos;ll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="flex items-center gap-3 bg-slate-100 rounded-2xl px-4 py-3.5 mb-4">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  className="flex-1 bg-transparent text-slate-800 text-sm placeholder-slate-400 focus:outline-none"
                />
              </div>

              {error && (
                <div className="mb-4 text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">
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
