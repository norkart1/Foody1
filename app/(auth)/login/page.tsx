"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { SiFacebook, SiGoogle, SiApple } from "react-icons/si";

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setError(""); setLoading(true);
    try {
      await signIn(email, password);
      router.push("/");
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === "auth/invalid-credential" || e.code === "auth/user-not-found" || e.code === "auth/wrong-password")
        setError("Incorrect email or password.");
      else if (e.code === "auth/too-many-requests") setError("Too many attempts. Please wait and try again.");
      else if (e.code === "auth/unauthorized-domain") setError("Domain not authorized. Add it in Firebase Console → Authentication → Authorized domains.");
      else if (e.code === "auth/operation-not-allowed") setError("Email/Password sign-in not enabled in Firebase Console.");
      else setError(e.code || e.message || "Login failed.");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(""); setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push("/");
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") {
        /* user dismissed */
      } else if (e.code === "auth/unauthorized-domain") {
        setError("Add your domain to Firebase Console → Authentication → Authorized domains.");
      } else {
        setError(e.message || "Google sign-in failed.");
      }
    } finally { setGoogleLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center sm:items-center sm:py-12">
      <div className="w-full max-w-sm bg-white flex flex-col min-h-screen sm:min-h-0 sm:rounded-2xl sm:shadow-md px-6 pt-12 pb-8">

        <Link href="/" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors mb-8 self-start">
          <ArrowLeft className="w-4 h-4 text-slate-700" />
        </Link>

        <h1 className="text-[2rem] font-extrabold text-slate-900 leading-tight mb-8">
          Login to your<br />Account
        </h1>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3 bg-slate-100 rounded-2xl px-4 py-3.5">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              data-testid="input-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="flex-1 bg-transparent text-slate-800 text-sm placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 bg-slate-100 rounded-2xl px-4 py-3.5">
            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              data-testid="input-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="flex-1 bg-transparent text-slate-800 text-sm placeholder-slate-400 focus:outline-none"
            />
            <button type="button" data-testid="button-toggle-password" onClick={() => setShowPassword(v => !v)} className="text-slate-400 hover:text-slate-600">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRememberMe(v => !v)}
          data-testid="checkbox-remember"
          className="flex items-center gap-2.5 mb-5"
        >
          <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${rememberMe ? "border-green-500 bg-white" : "border-slate-300 bg-white"}`}>
            {rememberMe && <span className="w-2.5 h-2.5 rounded-sm bg-green-500" />}
          </span>
          <span className="text-sm text-slate-600">Remember me</span>
        </button>

        {error && (
          <div data-testid="text-error" className="mb-4 text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <button
          type="button"
          data-testid="button-login"
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold py-4 rounded-full transition-colors disabled:opacity-60 text-sm mb-3"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <button
          type="button"
          data-testid="button-forgot-password"
          className="text-green-500 text-sm font-semibold text-center mb-6 hover:underline"
          onClick={() => setError("Password reset is not available yet. Please contact support.")}
        >
          Forgot the password?
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-sm text-slate-400 whitespace-nowrap">or continue with</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            type="button"
            disabled
            title="Coming soon"
            className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center opacity-40 cursor-not-allowed"
          >
            <SiFacebook className="w-5 h-5 text-blue-600" />
          </button>
          <button
            type="button"
            data-testid="button-google"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-14 h-14 bg-slate-100 hover:bg-slate-200 rounded-2xl flex items-center justify-center transition-colors disabled:opacity-60"
          >
            {googleLoading
              ? <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              : <SiGoogle className="w-4 h-4" />}
          </button>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center opacity-40 cursor-not-allowed"
          >
            <SiApple className="w-5 h-5 text-slate-900" />
          </button>
        </div>

        <p className="text-center text-sm text-slate-500 mt-auto">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-green-500 font-semibold hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
