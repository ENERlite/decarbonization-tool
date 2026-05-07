# How to Add a New Building to the Decarbonization Tool

This guide is for whoever needs to add a new building case study to the live tool. It assumes you have:
- The modeling outputs for your new building (energy use, costs, emissions, retrofit measure scenarios)
- Access to the project's GitHub repository
- A web browser

**Time required:** 20–30 minutes for someone who's never done this before.

You won't need to write any code or use the command line.

---

## Before you start: what data do you need?

Open your modeling spreadsheet and gather these numbers. They mirror what the original three buildings have.

### Building basics
- **ID** — a short identifier you make up: lowercase, hyphens for spaces. Example: `kaiser-pasadena`. This becomes the filename.
- **Name** — display name shown to users. Example: "Kaiser Pasadena Medical Office"
- **Type** — one of: Commercial Office, Big-Box Retail, Multifamily Residential, Healthcare, Education, Hospitality, Industrial, Mixed-Use, Other
- **Location** — city, county, state
- **Year built**, **Floor area** in ft², **Number of stories**
- **Construction** — short text, e.g. "Steel frame, brick veneer"
- **Occupancy** — short text, e.g. "Mon–Fri 7 AM – 7 PM, ~250 occupants"
- **Notes** — 1–3 sentences setting context. Why is this building interesting? What's the decarbonization story? Users will read this.

### Baseline performance (10 numbers)
- Annual electricity consumption (kWh)
- Annual natural gas consumption (kBtu)
- Peak electric demand (kW)
- GHG emissions from gas (tonnes CO₂)
- GHG emissions from electricity (tonnes CO₂)
- Energy Use Intensity / EUI (kBtu/ft²/yr)
- Annual electricity cost ($)
- Annual gas cost ($)
- 25-year NPV electricity cost ($)
- 25-year NPV gas cost ($)

### For each retrofit measure (12 fields per measure)
- **ID** — short identifier within this building, lowercase + hyphens. Example: `hpwh`, `lighting-controls`
- **Name** — display name. Example: "Heat Pump Water Heater"
- **Category** — pick one from the 6R framework: Reduce, Recover, Repair, Replace, Regenerate, or Bundle
- **Verified bundle?** — yes/no. Mark "yes" only for engineered packages where measure interactions are explicitly modeled. Single measures should be "no."
- **Resulting electricity** (kWh/yr after this measure)
- **Resulting peak demand** (kW)
- **Resulting natural gas** (kBtu/yr)
- **Resulting GHG from gas** (tonnes CO₂)
- **Resulting GHG from electricity** (tonnes CO₂)
- **Resulting EUI** (kBtu/ft²/yr)
- **Initial investment** ($)
- **25-year NPV total cost** ($) — investment + ongoing utility costs over 25 years, in present value
- **25-year NPV savings** ($) — total benefit vs. baseline. Negative means net cost.

> **Tip:** Most CEC-style studies output these numbers in summary tables. The shape matches what your modeling already produces.

---

## Step 1 — Open the Building Builder

1. Go to your live tool: **enerlite-consulting.com/decarbonization-tool**
2. Scroll to the very bottom of the page
3. Click the link **"Add a building"** in the footer

You'll land on the Builder page. (You can also bookmark this URL directly — it ends in `#admin`.)

> The Builder is publicly accessible — there's no password. It's safe because filling out the form on the website doesn't change the public tool. You're just generating a JSON file on your own computer. The tool only changes when someone uploads that file to GitHub (Step 3 below).

---

## Step 2 — Fill out the form

Work through the form top to bottom:

### Section 1 · Building basics
Fill every field. The **ID** field auto-cleans your input (lowercase, removes spaces). Pick something memorable — this becomes the filename and is hard to change later without breaking things.

### Section 2 · Baseline performance
Type or paste your 10 baseline numbers. The form accepts decimals (e.g. `33.7`) for EUI and GHG values.

### Section 3 · Retrofit measures
Click **"+ Add a measure"** to add your first one. Fill in all 12 fields. Click **"+ Add a measure"** again for the next one. Repeat for every parametric scenario you've modeled.

**About engineered bundles:** if your study includes a combined retrofit package where you modeled the *interactions* between measures (so the savings aren't just additive), check **"Verified bundle"**. The tool flags these to users as more reliable than user-combined measures.

You can collapse measures, duplicate similar ones (handy for variants), or remove them.

### Watch the validation panel at the bottom
As you fill in fields, a panel near the bottom shows any remaining issues. When everything checks out, it turns green: **"✓ Building data is valid."**

---

## Step 3 — Download the JSON file

Once validation passes:

1. Click **"↓ Download [your-id].json"** at the bottom of the form
2. The file downloads to your computer (probably your Downloads folder)
3. **Don't rename it.** The filename must match the ID exactly.

You can also click **"Preview JSON"** to see what's inside — it's plain text data, no secrets.

> **Optional safety net:** If you need to come back to this later, click "Preview JSON," select all, copy, and paste it somewhere you can find again (a Word doc, a Slack message to yourself). Or just download the file and re-import it later via "Import existing JSON" at the top.

---

## Step 4 — Add the file to GitHub

This is the only step that touches the live website. Take your time.

### 4.1 — Open the project in GitHub

1. Log in to github.com
2. Go to your `decarbonization-tool` repository (the one connected to Vercel)
3. Click into the folder structure: `public` → `buildings`

You'll see the existing JSON files: `office.json`, `retail.json`, `multifamily.json`, plus `index.json`.

### 4.2 — Upload your new JSON

1. In the `public/buildings/` folder, click the **"Add file"** button (top right)
2. Choose **"Upload files"**
3. Drag your downloaded JSON onto the upload area, or click "choose your files"
4. Scroll down. In the commit message box, type something like: `Add Kaiser Pasadena building`
5. Click **"Commit changes"**

### 4.3 — Update the index file

The tool needs to know about your new building. Edit `index.json`:

1. From the `public/buildings/` folder, click on **`index.json`** to open it
2. Click the pencil icon (top right of the file view) to edit
3. The file looks like this:
   ```json
   {
     "buildings": ["office", "retail", "multifamily"]
   }
   ```
4. Add your building's ID to the list, with a comma:
   ```json
   {
     "buildings": ["office", "retail", "multifamily", "kaiser-pasadena"]
   }
   ```
   (Replace `kaiser-pasadena` with whatever your ID is.)
5. Scroll down. Commit message: `Register Kaiser Pasadena in building index`
6. Click **"Commit changes"**

### 4.4 — Wait for the deploy

Vercel watches your GitHub repo and rebuilds the site automatically. You can check progress at vercel.com:

1. Open your Vercel dashboard
2. You'll see a deployment running (usually finishes in 1–2 minutes)
3. When it shows the green "Ready" badge, your new building is live

Visit **enerlite-consulting.com/decarbonization-tool** and click through. Your new building should appear as a card on the first screen.

---

## Common mistakes and fixes

**"My building doesn't show up"**
Check `index.json` — the building's ID must be in the `"buildings"` array, spelled exactly the same as the JSON filename (without the `.json` extension). Case matters. Spaces aren't allowed.

**"The validation panel won't go green"**
Read each error carefully. Common ones:
- "ID must be lowercase letters, numbers, and hyphens only" → change `Kaiser Pasadena` to `kaiser-pasadena`
- "measure[2].cat must be one of: Reduce, Recover..." → you typed something not in the dropdown
- "duplicate measure ids" → two measures share the same ID; rename one

**"I uploaded the wrong file / want to fix something"**
In the GitHub folder, click the file → click the pencil icon → make changes → commit. Or delete it (trash icon) and upload a new one. Vercel redeploys after every commit.

**"I want to edit a building that's already published"**
On the Builder page, click **"Import existing JSON"** at the top. Pick the JSON file (you can download it from GitHub first). The form will populate with everything. Make your edits, re-download, and re-upload to GitHub (overwrite the old file).

**"Can I delete a building?"**
Yes — delete the JSON file from `public/buildings/`, and remove its ID from `index.json`. Two commits, the tool stops listing it.

**"I want to take down the tool temporarily"**
In Vercel: Settings → General → "Pause deployments." Or just delete the embed iframe from your Squarespace page — the tool stays online, but visitors can't reach it from your site.

---

## What to do if something feels broken

1. **Check the deploy log.** Vercel dashboard → your project → click the latest deployment → look for red error messages. Build failures usually point at the exact JSON file with a typo.
2. **Validate your JSON.** Paste it into jsonlint.com. If it's not valid JSON syntax (missing commas, mismatched braces), you'll see the line number.
3. **Re-import via the Builder.** Open the Builder, "Import existing JSON," select the broken file. The validation panel tells you what's wrong in plain English.
4. **Roll back.** In GitHub, every commit is reversible. Find the last working commit in the History view, click "Revert."

---

## Going further

When you've added 5+ buildings, consider:

- **Group buildings by type** on the home page (offices, residential, retail) — easy to add to MainTool.jsx
- **Filter by location, EUI range, or climate zone** — schema already supports it
- **Add photos** — extend the schema with a `photoUrl` field, store images in `public/buildings/photos/`
- **Add more output metrics** — payback period, equivalent cars off the road, equivalent trees planted
- **Add a "compare two buildings" view** — useful when you have 5+ case studies

Let me know when you're ready to add any of these and we'll plan the next iteration.
