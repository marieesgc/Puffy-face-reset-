# Soft Girl Circle — 7-Day Puffy Face Reset

## What this is
A React app (built with Vite). Progress, photos, and cycle count save
automatically to the browser's `localStorage` — this is real, permanent
storage on whatever device someone uses, no backend needed. The one
limitation: it's per-browser/device, not a shared account across devices.
That's fine for now; moving to a real account-based database (Supabase,
Firebase) is a future upgrade, not something needed to go live.

## Deploying (GitHub + Vercel)

1. Create a free GitHub account if you don't have one.
2. Create a new, empty repository on GitHub.
3. Upload this entire folder to that repository (drag-and-drop on
   GitHub's web UI works fine — you don't need git installed).
4. Create a free Vercel account (github.com login works for this too).
5. In Vercel, choose "Add New Project" and import the GitHub repo.
6. Vercel auto-detects Vite — leave the default build settings and click Deploy.
7. Once it's live, open the site, go through a day, then refresh the page.
   Your progress should still be there.
8. If it isn't, something in the storage code needs a look — bring the
   deployed URL and what you saw back to this chat.

## Running locally (optional, only if you want to preview before deploying)
```
npm install
npm run dev
```
