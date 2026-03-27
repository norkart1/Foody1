# Kerala Stay & Dine

A Next.js web app for discovering hotels, resorts, and restaurants across all 14 districts of Kerala, India. Users can browse listings, search by name/place, filter by district and category, and leave reviews. Authentication is handled via Firebase Auth.

## Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Auth & Database**: Firebase (Auth, Firestore, Storage) — v10
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React, React Icons
- **Package Manager**: npm

## Project Structure

- `app/` — Next.js App Router pages
  - `(auth)/login` — Login page
  - `(auth)/register` — Registration page
  - `listings/[id]` — Individual listing detail page
  - `page.tsx` — Home page with search/filter
- `lib/firebase.ts` — Firebase app initialization (reads env vars)
- `context/AuthContext.tsx` — React context for auth state
- `next.config.ts` — Next.js config (Replit dev origins, transpilePackages for Firebase)

## Environment Variables

The following `NEXT_PUBLIC_` variables must be set as Replit Secrets:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Running

The app runs on port 5000 via `npm run dev`. The workflow "Start application" handles this automatically.

## Replit Migration Notes

- Downgraded from Next.js 16.2.1 → 15.5.14 (v16 exited immediately after startup on Replit)
- Downgraded Firebase 12 → 10 to fix webpack module resolution errors with Next.js 15
- Added `transpilePackages: ['firebase']` and `experimental.optimizePackageImports: ['firebase']` to next.config.ts
- Scripts updated to use `-p 5000 -H 0.0.0.0` for Replit preview pane compatibility
- `allowedDevOrigins` set for `*.replit.dev` and `*.replit.app` domains
