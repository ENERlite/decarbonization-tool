# Deployment Guide (v2)
## Getting Decarbonization Pathways live on enerlite-consulting.com

This guide takes you from a folder of files to a live, embedded tool on your Squarespace site, with admin capability for adding new buildings.

**Estimated time: 30–45 minutes** for first-time deployment. Adding new buildings later takes ~20 minutes each (see HOW_TO_ADD_A_BUILDING.md).

---

## Architecture

```
[GitHub repo] ──────► [Vercel] ──────► [URL like decarb-tool.vercel.app]
                                              │
                                              ▼
                                  [Embedded in Squarespace via iframe]
                                              │
                                              ▼
                       enerlite-consulting.com/decarbonization-tool
```

Public users access the tool at the Squarespace URL.
You access the admin builder at `enerlite-consulting.com/decarbonization-tool#admin`.

---

## STEP 1 — Put the code on GitHub (≈ 10 minutes)

### 1.1 — Create a new repository

1. Go to https://github.com/new
2. **Repository name:** `decarbonization-tool`
3. Set to **Public** (Vercel free tier needs this) or Private
4. Leave "Add a README" **unchecked** — I gave you one
5. Click **"Create repository"**

### 1.2 — Upload the files

The web uploader works fine — no command line needed:

1. On the empty repo page, click the **"uploading an existing file"** link
2. Drag the unzipped folder contents:
   ```
   ├── index.html
   ├── package.json
   ├── vite.config.js
   ├── .gitignore
   ├── README.md
   ├── DEPLOYMENT_GUIDE.md
   ├── HOW_TO_ADD_A_BUILDING.md
   ├── public/
   │   └── buildings/
   │       ├── index.json
   │       ├── office.json
   │       ├── retail.json
   │       └── multifamily.json
   └── src/
       ├── App.jsx
       ├── MainTool.jsx
       ├── Admin.jsx
       ├── main.jsx
       ├── schema.js
       ├── loader.js
       ├── router.js
       └── theme.jsx
   ```
3. Commit with message "Initial upload"
4. Click **"Commit changes"**

> **Important:** When you drag a folder, GitHub's web uploader preserves nested directories. If something looks flat after upload, delete the repo and try again — make sure all files are in their correct subfolders.

---

## STEP 2 — Deploy to Vercel (≈ 5 minutes)

### 2.1 — Sign up

1. Go to https://vercel.com/signup
2. Click **"Continue with GitHub"**
3. Authorize Vercel

### 2.2 — Import your project

1. Vercel dashboard → **"Add New..."** → **"Project"**
2. Find `decarbonization-tool` → click **"Import"**
3. **Don't change any settings** — Vercel auto-detects Vite + React correctly:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Click **"Deploy"**
5. Wait 1–2 minutes for the build

### 2.3 — Get your URL

Vercel gives you a URL like `decarbonization-tool-xyz.vercel.app`.

**Test both pages:**
- Main tool: `https://your-url.vercel.app`
- Admin builder: `https://your-url.vercel.app#admin`

Both should work. Click through the main tool. Open the admin builder and confirm you can fill in fields.

### 2.4 — Customize the URL (optional but recommended)

In your Vercel project: **Settings → Domains → Edit** the `*.vercel.app` subdomain to something cleaner like `enerlite-decarb.vercel.app`.

---

## STEP 3 — Embed it in Squarespace (≈ 15 minutes)

### 3.1 — Create the new page

1. Squarespace → site editor → **Pages**
2. Hover over **Main Navigation** → click **"+"**
3. Choose **"Blank"** template
4. Name it: **Decarbonization Tool**

### 3.2 — Insert the embed

1. Edit the new page → click **"+"** to add a block
2. Find **Code Block** under "More"
3. Set to **HTML** mode
4. Paste this, replacing the URL:

```html
<div style="position: relative; width: 100%; height: 100vh; min-height: 900px; max-width: 1400px; margin: 0 auto;">
  <iframe
    src="https://YOUR-VERCEL-URL.vercel.app"
    style="width: 100%; height: 100%; border: none; display: block;"
    title="Decarbonization Pathways Tool"
    allow="fullscreen"
    loading="lazy">
  </iframe>
</div>
```

5. Save the block. Save the page.

### 3.3 — Test the live site

Open `https://www.enerlite-consulting.com/decarbonization-tool`. Tool should load inside your normal site nav and footer.

---

## STEP 4 — Verify the admin builder works

This is what makes v2 different from v1.

1. Visit `https://www.enerlite-consulting.com/decarbonization-tool` and scroll to the bottom of the tool
2. Click the **"Add a building"** link in the footer
3. The Building Builder loads
4. Bookmark this URL — it ends in `#admin`. You'll come back here to add new buildings.

> **About admin access:** the builder is publicly accessible by URL. This is fine because the form only generates a JSON file on whoever's computer is using it — it doesn't change the public site. Changes only happen when someone uploads that JSON to GitHub. If you want to lock down access later, options are: (a) put the admin behind a Squarespace member-only page; (b) move the builder to a separate Vercel deployment with a non-guessable URL; (c) add password protection via Vercel's Pro plan. Talk to me when you want this.

---

## Adding new buildings later

See **HOW_TO_ADD_A_BUILDING.md** in the project. The short version:

1. Go to the Builder page (`#admin`)
2. Fill out the form (or "Import existing JSON" if editing)
3. Download the JSON
4. Upload to GitHub in `public/buildings/`
5. Add the ID to `public/buildings/index.json`
6. Vercel auto-deploys in 1–2 minutes

---

## Costs

- **GitHub:** Free
- **Vercel:** Free (Hobby tier)
- **Squarespace:** Already paying for it
- **Total ongoing:** $0/month additional

---

## Common issues

**"Iframe is too short"**
Increase `min-height: 900px` to `1100px` or `1200px` in the embed code.

**"My new building doesn't show up"**
Most likely: it's not listed in `public/buildings/index.json`. Check spelling.

**"Vercel deploy failed"**
Open the failed deployment in Vercel — the error log usually points to a specific JSON file with bad syntax. Most common: a stray comma after the last item in an array.

**"My data has errors I didn't notice"**
Building JSONs are validated on load. Open the browser console on the live site (F12) — validation warnings appear there. Or open the Builder, "Import existing JSON," pick the file, and the validation panel shows what's wrong.

---

If you hit a snag, screenshot the error and we'll work through it.
