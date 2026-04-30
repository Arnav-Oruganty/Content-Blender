# Migrating to BaseX

BaseX is a native XML database — it stores your CBank and CBlend files
**as actual XML**, making it the ideal backend for Content Blender where
XML is already the single source of truth.

---

## What changes

| Layer | Before (file/mongo) | After (BaseX) |
|---|---|---|
| `STORAGE_BACKEND` env | `file` or `mongo` | `basex` |
| CBank storage | `storage/cbank.xml` on disk or MongoDB BSON | `content_blender/cbank/cbank.xml` in BaseX |
| CBlend storage | `storage/blends/*.xml` or MongoDB collection | `content_blender/blends/<id>.xml` in BaseX |
| Queries | `fs.readFileSync` / Mongoose find | Native XQuery 3.1 via BaseX TCP client |
| New npm dep | — | `basex@^1.1.0` |
| Removed npm dep | `mongoose` | — |
| New util | — | `backend/utils/basex.js` |
| New adapter | — | `backend/storage/basexAdapter.js` |

**Frontend, routes, XML transform, and all other files are unchanged.**

---

## What stays the same

- All REST API endpoints (`/api/cbank`, `/api/cblend`, `/api/export`, `/api/health`)
- All XML schemas (CBank XSD, CBlend XSD)
- XML ↔ JSON transform logic (`utils/xmlTransform.js`)
- Storage adapter interface (`getCBank`, `saveCBank`, `listBlends`, `getBlend`, `saveBlend`, `deleteBlend`)
- Frontend React app — zero changes

---

## Step 1 — Install BaseX server

BaseX requires Java 8+.

### Option A: Download (all platforms)
```
https://basex.org/products/download/
```

### Option B: Homebrew (macOS)
```bash
brew install basex
```

### Option C: apt (Ubuntu / Debian)
```bash
sudo apt install basex
```

### Option D: Docker
```bash
docker run -d \
  --name basex \
  -p 1984:1984 \
  -e BASEX_PASSWORD=admin \
  basex/basexhttp:latest
```

---

## Step 2 — Start BaseX server

```bash
# Start in background (daemon mode)
basexserver -S

# Or foreground (see logs)
basexserver
```

Default credentials: `admin` / `admin`  
Default port: `1984`

Verify it's running:
```bash
basexclient -U admin -P admin -c "INFO"
# Should print BaseX server info
```

---

## Step 3 — Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
STORAGE_BACKEND=basex

BASEX_HOST=127.0.0.1
BASEX_PORT=1984
BASEX_USER=admin
BASEX_PASSWORD=admin
```

---

## Step 4 — Install the `basex` npm package

```bash
cd backend
npm install
```

The `basex` package is already in `package.json`. This adds ~30KB, no native bindings.

---

## Step 5 — Run

```bash
# Backend
npm run dev

# You should see:
# 🗄️   BaseX server reachable
# 📦  BaseX: CBank seeded with 8 default blocks   (first run only)
# ✅  Content Blender API → http://localhost:4000
#    Storage : basex
#    BaseX   : 127.0.0.1:1984
```

The database `content_blender` is created automatically on first run.
The CBank is seeded with 8 default blocks on first run.

---

## Database layout inside BaseX

```
content_blender/           ← BaseX database
  cbank/
    cbank.xml              ← Full CBank registry (replaced on every save)
  blends/
    blend-a1b2c3.xml       ← One CBlend document per saved document
    blend-d4e5f6.xml
    ...
```

You can browse and query this directly in the BaseX GUI:
```bash
basexgui
```

Or via the command-line client:
```bash
# List all documents
basexclient -U admin -P admin -c "OPEN content_blender; LIST"

# Query the CBank
basexclient -U admin -P admin -c "XQUERY db:get('content_blender','cbank/cbank.xml')"

# Query all blend titles
basexclient -U admin -P admin \
  -c "XQUERY for \$d in db:get('content_blender','blends') return string(\$d/cblend/meta/@title)"
```

---

## XQuery examples

Since your data is now in a real XML database, you can run powerful queries:

```xquery
(: Find all blocks of type 'hero' :)
for $b in db:get('content_blender', 'cbank/cbank.xml')/cbank/cblock
where $b/@type = 'hero'
return $b

(: Find all blends using the 'landing' layout :)
for $d in db:get('content_blender', 'blends')
let $blend := $d/cblend
where $blend/meta/@layout = 'landing'
return string($blend/meta/@title)

(: Full-text search across all blend content :)
for $inc in db:get('content_blender', 'blends')//include
where contains(lower-case($inc/content), 'product')
return string($inc/@type) || ': ' || string($inc/content)
```

---

## Reverting to file storage

Change one line in `.env`:
```env
STORAGE_BACKEND=file
```

Restart the backend. The file adapter uses `storage/cbank.xml` and
`storage/blends/*.xml` — completely independent of BaseX.

---

## New files added

| File | Purpose |
|---|---|
| `backend/utils/basex.js` | Promisified BaseX TCP client wrapper |
| `backend/storage/basexAdapter.js` | CBank + CBlend persistence via BaseX |
| `BASEX_MIGRATION.md` | This guide |

## Modified files

| File | Change |
|---|---|
| `backend/package.json` | Added `basex`, removed `mongoose` |
| `backend/.env.example` | Added BaseX vars, set `STORAGE_BACKEND=basex` |
| `backend/server.js` | BaseX ping on startup, boot failure message |
| `backend/storage/storageAdapter.js` | Added `basex` case |
| `backend/routes/health.js` | Shows BaseX connectivity in health check |

---

## Troubleshooting

**`ECONNREFUSED: connection refused`**
→ BaseX server is not running. Run `basexserver -S`

**`Access denied`**
→ Wrong credentials. Check `BASEX_USER` and `BASEX_PASSWORD` in `.env`

**`Cannot find module 'basex'`**
→ Run `npm install` inside the `backend/` directory

**Data not appearing in BaseX GUI**
→ Click "Refresh" in the GUI. Changes are committed immediately but the GUI may cache.

**Port 1984 already in use**
→ Another BaseX instance is running, or use `BASEX_PORT=1985` and start BaseX with `basexserver -p 1985 -S`
