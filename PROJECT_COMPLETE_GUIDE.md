# Content Blender - Complete Project Guide

**Last Updated:** April 29, 2026  
**Status:** Active Development  
**Storage Backend:** File-based (default) / MongoDB (configurable)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Core Concepts](#core-concepts)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Directory Structure](#directory-structure)
6. [Database & Storage](#database--storage)
7. [API Reference](#api-reference)
8. [Frontend Components](#frontend-components)
9. [Key Features Implementation](#key-features-implementation)
10. [Setup & Installation](#setup--installation)
11. [Common Workflows](#common-workflows)
12. [Data Structures](#data-structures)
13. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Content Blender** is a **headless CMS** (Content Management System) where:
- **XML is the single source of truth** — all data is stored in XML format
- **JSON is the runtime format** — data is converted to JSON when the app runs
- **React drives the no-code UI** — a visual editor lets users create content without coding

### What It Does

Content Blender allows you to:
- Create reusable **blocks** (text, images, sections, etc.)
- Organize blocks into **documents** (called "Blends")
- Edit layouts visually with a drag-and-drop composer
- Export content as XML or HTML
- Switch between file-based storage and MongoDB without code changes

### Real-World Analogy

Think of it like a **digital newspaper factory**:
- **Blocks** = individual articles, photos, headlines, quotes
- **CBank** = the library where all articles and photos are stored
- **CBlend** = the final newspaper layout (which articles go where)
- **Export** = printing the newspaper in different formats (XML, HTML, PDF)

---

## Core Concepts

### 1. **Block** - A Unit of Content

A **block** is a single piece of reusable content. Think of it as a LEGO brick.

```javascript
{
  id: "b_abc123",           // Unique identifier
  type: "paragraph",        // Block type: title, section, paragraph, image, quote, list, hero, card, row
  name: "Intro Text",       // Human-readable label
  content: "Hello world...", // Main text/data content
  version: "1.0",           // Version number
  items: [],                // Sub-items (for lists, cards, etc.)
  containerType: null       // null or "row" (if this block is inside a row)
}
```

**Available Block Types:**
| Type | Purpose | Content | Items |
|------|---------|---------|-------|
| `title` | Page heading | Text | — |
| `section` | Section divider | Text | — |
| `paragraph` | Body text | Text | — |
| `image` | Image display | URL/file | Alt text, caption |
| `quote` | Block quote | Text | — |
| `list` | Bulleted/numbered list | — | Array of items |
| `card` | Grid card | Title | Array of descriptions |
| `hero` | Large hero section | Text + image | — |
| `row` | Multi-column container | — | Child blocks |

### 2. **CBank** - The Content Bank

**CBank** is a centralized library of all reusable blocks.

Think of it as a **library shelf** where you store all available content pieces. You can have 100 different "paragraph" blocks with different text. When creating a document, you pick and arrange blocks from the CBank.

**CBank Structure:**
```xml
<?xml version="1.0"?>
<cbank>
  <cblock id="b_xyz" type="paragraph" name="Intro">
    <content>Welcome to our site</content>
  </cblock>
  <cblock id="b_abc" type="title" name="Main Title">
    <content>My Website</content>
  </cblock>
</cbank>
```

### 3. **CBlend** - A Document

A **CBlend** is a **composition/blend** of blocks arranged in a specific order to create a final document.

**What it is:** An ordered list of blocks that form a complete page or article.

```javascript
{
  id: "blend_xyz789",       // Unique blend ID
  name: "My Article",       // Document name
  content: [                // Array of blocks (in order)
    {
      uid: "u1a2b3c4",      // Unique instance ID
      ref: "b_abc",         // Reference to CBank block
      type: "hero",
      content: "Big Headline"
    },
    {
      uid: "u5e6f7g8",
      ref: "b_xyz",
      type: "paragraph",
      content: "Introduction..."
    },
    {
      uid: "u9h0i1j2",
      type: "row",           // Row container with child blocks
      columns: 2,
      gap: "16px",
      children: [
        { uid: "u3k4l5", type: "card", content: "Feature 1" },
        { uid: "u6m7n8", type: "card", content: "Feature 2" }
      ]
    }
  ]
}
```

**Key difference:** 
- **Block** = template/definition (stored in CBank)
- **CBlend** = specific arrangement of blocks (a document)

### 4. **Row** - Multi-Column Layout Container

A **row** is a special block type that acts as a **container** for other blocks.

**Features:**
- Can hold 1-4 columns
- Blocks inside resize proportionally
- Configurable gap (spacing) between columns: 8px, 16px, 24px, 32px
- Mobile responsive (becomes 1 column on small screens)
- Blocks can be individually added, removed, or reordered

**XML Example:**
```xml
<include type="row" columns="2" gap="16px">
  <include type="paragraph">
    <content>Left column text</content>
  </include>
  <include type="paragraph">
    <content>Right column text</content>
  </include>
</include>
```

### 5. **Image Metadata** - Enhanced Image Handling

Images now have rich metadata:

```javascript
{
  type: "image",
  sourceType: "url" | "local",        // Where the image comes from
  url: "/uploads/abc123.jpg",         // Path or external URL
  altText: "Description for screen readers",
  caption: "Optional figure caption"
}
```

**Two Upload Methods:**
1. **URL Mode:** Paste external image URL (e.g., from another website)
2. **Upload Mode:** Upload file to backend (`/api/upload/image`)

### 6. **XML vs JSON Format**

**XML** (Persistent Storage):
```xml
<?xml version="1.0"?>
<cblock id="b123" type="paragraph" name="Intro">
  <content>Hello world</content>
  <version>1.0</version>
</cblock>
```

**JSON** (Runtime Format):
```json
{
  "id": "b123",
  "type": "paragraph",
  "name": "Intro",
  "content": "Hello world",
  "version": "1.0"
}
```

**Why both?**
- **XML** is human-readable, version-control friendly, and survives software updates
- **JSON** is faster, easier for JavaScript/web apps to work with
- The app converts between them automatically

### 7. **Storage Adapter** - Pluggable Backend

The system can save data to different locations:

| Backend | Location | Best For | Configuration |
|---------|----------|----------|---|
| **File** (default) | Disk (`/storage/`) | Development | `STORAGE_BACKEND=file` |
| **MongoDB** | Cloud database | Production | `STORAGE_BACKEND=mongo` + `MONGO_URI` |

**Switch anytime** by changing `.env` — no code changes needed.

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER                             │
│                   (Frontend - React)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ComposerPage (3-panel editor)                       │   │
│  │  ├─ Canvas Panel (Visual layout)                     │   │
│  │  ├─ Editor Panel (Block properties)                  │   │
│  │  └─ Preview/XML Panel (Output)                       │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬──────────────────────────────────────┘
                         │
                    HTTP/REST API
                    /api/cbank/*
                    /api/cblend/*
                    /api/upload/*
                    /api/export/*
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  NODE.JS BACKEND                            │
│              (Express - server.js)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Route Handlers                                      │   │
│  │  ├─ /cbank.js (Block CRUD)                           │   │
│  │  ├─ /cblend.js (Document CRUD)                       │   │
│  │  ├─ /upload.js (File upload)                         │   │
│  │  ├─ /export.js (XML/HTML export)                     │   │
│  │  └─ /health.js (Status check)                        │   │
│  └────────────────┬────────────────────────────────────┘    │
│                   │                                          │
│  ┌────────────────▼────────────────────────────────────┐    │
│  │  Storage Adapter (Pluggable)                        │    │
│  │  ├─ File Adapter → /storage/*.xml                   │    │
│  │  └─ MongoDB Adapter → Remote database               │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Utils                                               │   │
│  │  ├─ xmlTransform.js (XML ↔ JSON conversion)         │   │
│  │  └─ db.js (MongoDB connection)                       │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

```
src/
├── App.jsx                 # Main router component
├── main.jsx               # Entry point
│
├── pages/
│   ├── ComposerPage.jsx   # 3-panel editor (main workspace)
│   │   ├─ Canvas panel (visual editor)
│   │   ├─ Editor panel (block properties)
│   │   └─ Preview/XML panel (output)
│   ├── CbankPage.jsx      # Block library viewer
│   └── BlendListPage.jsx  # Saved documents list
│
├── components/
│   ├── EditorPanel.jsx       # Right-side editor for selected block
│   ├── ImageBlockEditor.jsx  # Dedicated image upload/editing
│   ├── RowBlock.jsx          # Multi-column container visualization
│   └── LayoutSaveDialog.jsx  # Save layout dialog
│
├── hooks/
│   ├── useCBank.js        # Block management (fetch, create, delete)
│   ├── useCBlend.js       # Document management + row operations
│   └── useCustomLayouts.js # Layout persistence
│
├── context/
│   └── CbankContext.jsx   # Global state for blocks
│
├── utils/
│   ├── api.js             # Axios HTTP client
│   ├── blocks.js          # Block type definitions, factories
│   └── xmlClient.js       # Client-side XML builder
│
└── styles/
    ├── app.css            # App styling
    └── global.css         # Global styles
```

### Backend Architecture

```
backend/
├── server.js              # Express app setup, route registration
├── package.json          # Dependencies (express, multer, mongoose, fast-xml-parser)
│
├── routes/
│   ├── cbank.js          # GET/POST/PUT/DELETE blocks
│   ├── cblend.js         # GET/POST/PUT/DELETE documents
│   ├── upload.js         # POST image files (multipart/form-data)
│   ├── export.js         # GET export (XML or HTML)
│   └── health.js         # GET service status
│
├── middleware/
│   └── errorHandler.js   # Centralized error handling
│
├── storage/
│   ├── storageAdapter.js # Factory: selects file or mongo adapter
│   ├── fileAdapter.js    # Read/write XML files to disk
│   ├── mongoAdapter.js   # Read/write documents to MongoDB
│   ├── cbank.xml         # Main block library (file-based)
│   ├── blends/           # Folder of saved documents (file-based)
│   │   └── blend-*.xml   # Individual document files
│   └── uploads/          # User-uploaded images
│
└── utils/
    ├── db.js             # Mongoose connection setup
    └── xmlTransform.js   # XML ↔ JSON conversion, deep nesting support
```

---

## Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js (REST API server)
- **Parsing:** fast-xml-parser (XML ↔ JSON conversion)
- **File Upload:** Multer (multipart/form-data handling)
- **Database:** MongoDB + Mongoose (optional, file storage by default)
- **Environment:** dotenv (.env file loading)

### Frontend
- **Framework:** React 18+ (with JSX)
- **Build Tool:** Vite (fast dev server + bundling)
- **State Management:** React Context API + custom hooks
- **HTTP Client:** Axios (REST API calls)
- **Styling:** CSS (modular)
- **Proxy:** Vite dev server proxies `/api/*` → `http://localhost:4000`

---

## Directory Structure

```
Content-Blender-main 2/
│
├── README.md                          # Project overview
├── PROJECT_EXPLANATION.md             # Beginner's guide to concepts
├── IMPLEMENTATION_SUMMARY.md          # Feature implementation details
├── QUICK_START_GUIDE.md              # Setup instructions
├── PROJECT_COMPLETE_GUIDE.md         # This file
│
├── backend/
│   ├── package.json                   # Backend dependencies
│   ├── server.js                      # Express app entry point
│   ├── .env.example                   # Template for configuration
│   │
│   ├── routes/
│   │   ├── health.js                  # GET /api/health
│   │   ├── cbank.js                   # GET/POST/PUT/DELETE /api/cbank
│   │   ├── cblend.js                  # GET/POST/PUT/DELETE /api/cblend
│   │   ├── upload.js                  # POST /api/upload/image
│   │   └── export.js                  # GET /api/export
│   │
│   ├── middleware/
│   │   └── errorHandler.js            # Error handling middleware
│   │
│   ├── storage/
│   │   ├── storageAdapter.js          # Adapter factory pattern
│   │   ├── fileAdapter.js             # File system storage implementation
│   │   ├── mongoAdapter.js            # MongoDB storage implementation
│   │   ├── cbank.xml                  # Block library (file-based)
│   │   ├── blends/                    # Saved documents directory
│   │   │   └── blend-*.xml            # Individual document files
│   │   └── uploads/                   # User-uploaded images
│   │
│   └── utils/
│       ├── db.js                      # MongoDB connection
│       └── xmlTransform.js            # XML ↔ JSON conversion logic
│
└── frontend/
    ├── package.json                   # Frontend dependencies
    ├── vite.config.js                 # Vite configuration
    ├── index.html                     # HTML entry point
    │
    └── src/
        ├── main.jsx                   # React app bootstrap
        ├── App.jsx                    # Main router component
        │
        ├── pages/
        │   ├── ComposerPage.jsx       # 3-panel editor workspace
        │   ├── CbankPage.jsx          # Block library page
        │   └── BlendListPage.jsx      # Saved documents page
        │
        ├── components/
        │   ├── EditorPanel.jsx        # Block editor panel
        │   ├── ImageBlockEditor.jsx   # Image upload/edit component
        │   ├── RowBlock.jsx           # Row container component
        │   └── LayoutSaveDialog.jsx   # Save dialog component
        │
        ├── hooks/
        │   ├── useCBank.js            # Block operations
        │   ├── useCBlend.js           # Document + row operations
        │   └── useCustomLayouts.js    # Layout persistence
        │
        ├── context/
        │   └── CbankContext.jsx       # Global block state
        │
        ├── utils/
        │   ├── api.js                 # Axios client configuration
        │   ├── blocks.js              # Block types, schemas, factories
        │   └── xmlClient.js           # Client-side XML building
        │
        └── styles/
            ├── app.css                # App component styles
            └── global.css             # Global styles
```

---

## Database & Storage

### File-Based Storage (Default)

**CBank Storage:**
```
backend/storage/cbank.xml
```

**CBlend Storage:**
```
backend/storage/blends/blend-u1a2b3c4.xml
backend/storage/blends/blend-u5e6f7g8.xml
... (each document is a separate file)
```

**Upload Storage:**
```
backend/storage/uploads/550e8400-e29b-41d4-a716-446655440000.jpg
backend/storage/uploads/abc123def456.png
... (UUID naming to avoid collisions)
```

### MongoDB Storage

When `STORAGE_BACKEND=mongo` and `MONGO_URI=mongodb://...`:

**Collections:**
- `cbanks` — stores blocks
- `cblends` — stores documents
- `uploads` — stores upload metadata

**Sample document:**
```javascript
{
  _id: ObjectId("..."),
  id: "b_abc123",
  type: "paragraph",
  name: "Intro Text",
  content: "Hello world",
  version: "1.0",
  createdAt: ISODate("2024-04-29T..."),
  updatedAt: ISODate("2024-04-29T...")
}
```

---

## API Reference

### Health Check

**GET** `/api/health`

Returns service status and storage backend info.

**Response:**
```json
{
  "status": "ok",
  "message": "✅ Content Blender API running",
  "backend": "file",
  "timestamp": "2024-04-29T10:30:00Z"
}
```

---

### CBank API `/api/cbank`

#### List All Blocks

**GET** `/api/cbank`

Returns array of all blocks in JSON format.

**Response:**
```json
{
  "blocks": [
    {
      "id": "b_abc123",
      "type": "paragraph",
      "name": "Intro",
      "content": "Hello world",
      "version": "1.0",
      "items": []
    },
    ...
  ]
}
```

#### Get Full CBank as XML

**GET** `/api/cbank/xml`

Returns the complete CBank as XML document.

**Response:**
```xml
<?xml version="1.0"?>
<cbank>
  <cblock id="b_abc123" type="paragraph" name="Intro" version="1.0">
    <content>Hello world</content>
  </cblock>
  ...
</cbank>
```

#### Get Single Block

**GET** `/api/cbank/:id`

Retrieve a specific block by ID.

**Response:**
```json
{
  "id": "b_abc123",
  "type": "paragraph",
  "name": "Intro",
  "content": "Hello world",
  "version": "1.0",
  "items": []
}
```

#### Create Block

**POST** `/api/cbank`

**Request Body:**
```json
{
  "id": "b_new123",
  "type": "paragraph",
  "name": "My New Block",
  "content": "Block content",
  "items": [],
  "version": "1.0"
}
```

**Response:** Created block (201)

#### Update Block

**PUT** `/api/cbank/:id`

**Request Body:**
```json
{
  "type": "paragraph",
  "name": "Updated Name",
  "content": "Updated content",
  "items": [],
  "version": "1.1"
}
```

**Response:** Updated block (200)

#### Delete Block

**DELETE** `/api/cbank/:id`

**Response:** `{ "message": "Block deleted" }` (200)

---

### CBlend API `/api/cblend`

#### List All Documents

**GET** `/api/cblend`

Returns array of all saved documents.

**Response:**
```json
{
  "blends": [
    {
      "id": "blend_xyz789",
      "name": "My Article",
      "content": [
        {
          "uid": "u1a2b3c4",
          "ref": "b_abc123",
          "type": "paragraph",
          "content": "Intro text"
        },
        ...
      ]
    },
    ...
  ]
}
```

#### Get Single Document

**GET** `/api/cblend/:id`

Retrieve a specific document by ID.

**Response:**
```json
{
  "id": "blend_xyz789",
  "name": "My Article",
  "content": [...]
}
```

#### Create Document

**POST** `/api/cblend`

**Request Body:**
```json
{
  "id": "blend_new",
  "name": "New Document",
  "content": [
    {
      "uid": "u1a2b3c4",
      "type": "paragraph",
      "content": "Content"
    }
  ]
}
```

**Response:** Created document (201)

#### Update Document

**PUT** `/api/cblend/:id`

**Request Body:**
```json
{
  "name": "Updated Name",
  "content": [...]
}
```

**Response:** Updated document (200)

#### Delete Document

**DELETE** `/api/cblend/:id`

**Response:** `{ "message": "CBlend deleted" }` (200)

---

### Upload API `/api/upload`

#### Upload Image

**POST** `/api/upload/image`

Upload an image file with multipart/form-data.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (binary image data)
- Max size: 10MB
- Allowed types: JPG, JPEG, PNG, GIF, WebP

**Response:**
```json
{
  "filename": "550e8400-e29b-41d4-a716-446655440000.jpg",
  "path": "/uploads/550e8400-e29b-41d4-a716-446655440000.jpg",
  "size": 45280,
  "mimetype": "image/jpeg"
}
```

---

### Export API `/api/export`

#### Export Document as XML

**GET** `/api/export/cblend/:id/xml`

Export a document as XML format.

**Response:** XML document with proper headers

#### Export Document as HTML

**GET** `/api/export/cblend/:id/html`

Export a document as standalone HTML.

**Response:** Complete HTML document with styling

**HTML Features:**
- Responsive layout (mobile-friendly)
- Row containers render as flexbox
- Images display with alt text and captions
- Proper semantic HTML (figure, figcaption)

---

## Frontend Components

### ComposerPage.jsx

The main workspace with 3 panels:

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Navigation Bar (Home, Composer, Blends)             │
├──────────────┬──────────────────────┬───────────────┤
│              │                      │               │
│  CBank       │  Canvas Panel        │  Editor/      │
│  (Left)      │  (Center - Main)     │  Preview      │
│              │                      │  (Right)      │
│  - List of   │  Visual Editor       │  - Block      │
│    blocks    │  - Add blocks        │    editor     │
│              │  - Drag to add       │  - Preview    │
│              │  - Select blocks     │  - XML view   │
│              │  - Row containers    │               │
│              │                      │               │
└──────────────┴──────────────────────┴───────────────┘
```

**Key Features:**
- Left panel: CBank (block library)
- Center panel: Canvas (visual editor, drag-and-drop)
- Right panel: Toggle between Editor, Preview, and XML
- Toolbar: Add rows, add blocks, save/export buttons

### EditorPanel.jsx

Right-side panel for editing selected block properties.

**Block Type Editors:**
- **title/section:** Text input
- **paragraph/quote:** Textarea
- **image:** Delegates to `ImageBlockEditor`
- **list/card:** Comma/newline-separated items
- **row:** Column count + gap controls

### ImageBlockEditor.jsx

Dedicated image upload and editing component.

**Features:**
- Two modes: URL paste or file upload
- Drag-and-drop file upload
- Real-time preview
- Alt text (accessibility)
- Caption (optional)
- Error handling with toast notifications

**Supported Formats:** JPG, PNG, GIF, WebP (max 10MB)

### RowBlock.jsx

Renders a multi-column row container in the canvas.

**Features:**
- Visual row container with flex layout
- Shows child blocks inside
- "+ Add to row" button
- Column count selector (1-4)
- Gap spacing selector (8px, 16px, 24px, 32px)
- Remove individual child blocks
- Remove entire row

---

## Key Features Implementation

### Feature 1: Multi-Column Layouts (Rows)

**What it does:** Allows creating side-by-side block layouts (2 columns, 3 columns, etc.)

**Key Files Modified:**
- Backend: `routes/cbank.js`, `routes/cblend.js`, `storage/fileAdapter.js`, `utils/xmlTransform.js`, `routes/export.js`
- Frontend: `components/RowBlock.jsx`, `hooks/useCBlend.js`, `utils/blocks.js`, `pages/ComposerPage.jsx`

**Data Structure:**
```javascript
{
  uid: "u...",
  type: "row",
  columns: 2,           // 1-4 columns
  gap: "16px",          // 8px, 16px, 24px, 32px
  children: [           // Child blocks
    { uid: "u...", type: "paragraph", content: "..." },
    { uid: "u...", type: "image", url: "..." }
  ]
}
```

**XML Representation:**
```xml
<include type="row" columns="2" gap="16px">
  <include type="paragraph">
    <content>Left column</content>
  </include>
  <include type="image">
    <metadata url="/uploads/img.jpg" altText="Alt"/>
  </include>
</include>
```

### Feature 2: Enhanced Image Handling

**What it does:** Allows uploading images with metadata (alt text, captions)

**Key Files Modified:**
- Backend: `routes/upload.js` (new), `routes/cbank.js`, `routes/cblend.js`, `utils/xmlTransform.js`, `routes/export.js`, `server.js`
- Frontend: `components/ImageBlockEditor.jsx` (new), `utils/api.js`, `pages/ComposerPage.jsx`

**Data Structure:**
```javascript
{
  type: "image",
  sourceType: "url" | "local",
  url: "/uploads/abc.jpg" | "https://example.com/img.jpg",
  altText: "Image description",
  caption: "Optional caption"
}
```

**XML Representation:**
```xml
<include type="image">
  <metadata 
    sourceType="local" 
    url="/uploads/abc123.jpg" 
    altText="Alt text" 
    caption="Caption text"/>
</include>
```

**Upload Endpoint:**
- **POST** `/api/upload/image`
- Max: 10MB
- Formats: JPG, PNG, GIF, WebP
- Returns: UUID filename + path

---

## Setup & Installation

### Prerequisites

- Node.js 14+ (check with `node --version`)
- npm or yarn
- Git (optional, for version control)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your settings
# For development, you can use defaults:
# STORAGE_BACKEND=file
# NODE_ENV=development
# PORT=4000

# Start the server
npm run dev

# You should see:
# ✅ Content Blender API running on http://localhost:4000
```

### Frontend Setup

```bash
# Open new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# You should see:
#   VITE v... dev server running at:
#   ➜  Local:   http://localhost:5173/
```

### Verify Setup

1. **Backend Health Check:**
   ```bash
   curl http://localhost:4000/api/health
   ```
   Should return JSON with status.

2. **Frontend:**
   Open browser to `http://localhost:5173`
   Should display the Content Blender UI.

3. **Storage Directory:**
   ```bash
   ls backend/storage/
   # Should show: cbank.xml, blends/, uploads/
   ```

---

## Common Workflows

### Workflow 1: Create a Block in CBank

1. Go to **CBank** page in frontend
2. Click **"+ New Block"** button
3. Fill in:
   - **Type:** Select block type (paragraph, image, etc.)
   - **Name:** Human-readable label
   - **Content:** Text content for the block
4. Click **"Save"**
5. Block is added to `backend/storage/cbank.xml`

### Workflow 2: Create a Document (CBlend)

1. Go to **Composer** page
2. Drag blocks from CBank to canvas (center panel)
3. Arrange blocks in desired order
4. Edit each block using the Editor panel (right)
5. Click **"Save Document"** to create CBlend
6. Document is saved to `backend/storage/blends/blend-*.xml`

### Workflow 3: Create a Multi-Column Layout

1. In Composer, go to toolbar (scroll down)
2. Click **"+ Row (2 cols)"** or **"+ Row (3 cols)"**
3. Row container appears in canvas
4. Inside row, click **"+ Add to row"**
5. Add blocks to each column
6. Adjust column count and gap using controls
7. Save document

### Workflow 4: Upload Image

1. Create image block or add one to row
2. Select the image block
3. Go to **"Editor"** tab (right panel)
4. Choose **"Upload"** mode
5. Click dashed area or drag-drop an image file
6. Preview updates automatically
7. Fill in **Alt Text** and **Caption**
8. Save document

### Workflow 5: Export Document

1. In Composer, load a document
2. Click **"Export"** (top menu)
3. Choose format:
   - **XML:** Machine-readable format
   - **HTML:** Viewable in browser
4. Download file or copy to clipboard

---

## Data Structures

### Block Object

```javascript
{
  // Core properties
  id: "b_abc123",               // Unique block ID in CBank
  type: "paragraph",            // Block type
  name: "Intro Text",           // Human-readable label
  content: "Text content",      // Main content
  version: "1.0",               // Semantic versioning
  items: [],                    // Sub-items (lists, cards)
  
  // Container tracking
  containerType: null,          // null or "row"
  
  // Image-specific metadata
  sourceType: "url|local",      // Where image comes from
  url: "/uploads/abc.jpg",      // File path or external URL
  altText: "Description",       // Accessibility
  caption: "Figure caption",    // Optional caption
  
  // Row-specific properties
  columns: 2,                   // 1-4 columns
  gap: "16px",                  // 8px, 16px, 24px, 32px
  children: []                  // Array of child blocks
}
```

### CBlend Object

```javascript
{
  id: "blend_xyz789",           // Unique document ID
  name: "My Article",           // Document name
  content: [                    // Array of blocks in order
    {
      uid: "u1a2b3c4",          // Unique instance ID (within blend)
      ref: "b_abc123",          // Reference to CBank block (optional)
      type: "paragraph",        // Block type
      content: "Text",          // Block content
      
      // Row-specific
      children: [],             // Child blocks if type=row
      columns: 2,
      gap: "16px",
      
      // Image-specific
      sourceType: "local",
      url: "/uploads/abc.jpg",
      altText: "Alt text",
      caption: "Caption"
    },
    ...
  ]
}
```

### XML Structure (CBank)

```xml
<?xml version="1.0"?>
<cbank>
  <cblock id="b_abc123" type="paragraph" name="Intro" version="1.0">
    <content>Hello world</content>
  </cblock>
  
  <cblock id="b_img123" type="image" name="Feature Image">
    <metadata sourceType="local" url="/uploads/abc.jpg" altText="Alt" caption="Caption"/>
  </cblock>
  
  <cblock id="b_row123" type="row" name="Feature Grid">
    <row columns="3" gap="16px">
      <include type="card">
        <content>Card 1</content>
      </include>
      <include type="card">
        <content>Card 2</content>
      </include>
    </row>
  </cblock>
</cbank>
```

### XML Structure (CBlend)

```xml
<?xml version="1.0"?>
<cblend id="blend_xyz789" name="My Article">
  <include type="hero">
    <content>Big Headline</content>
  </include>
  
  <include type="row" columns="2" gap="16px">
    <include type="paragraph">
      <content>Left column</content>
    </include>
    <include type="image">
      <metadata url="/uploads/abc.jpg" altText="Alt"/>
    </include>
  </include>
</cblend>
```

---

## Troubleshooting

### Backend Issues

**Problem:** Backend won't start / `npm run dev` fails

**Solution:**
1. Check Node.js version: `node --version` (should be 14+)
2. Install dependencies: `npm install` in `/backend`
3. Check port 4000 is available: `lsof -i :4000` (on macOS)
4. Check `.env` file exists (copy `.env.example` if missing)

**Problem:** "Cannot find module 'express'"

**Solution:**
```bash
cd backend
npm install
```

**Problem:** Storage adapter not switching between file/mongo

**Solution:**
1. Check `.env` file has `STORAGE_BACKEND=file` or `STORAGE_BACKEND=mongo`
2. Restart backend: `npm run dev`
3. Verify with `/api/health` endpoint

**Problem:** Uploads directory not created

**Solution:**
```bash
# Manually create if missing
mkdir -p backend/storage/uploads
```

### Frontend Issues

**Problem:** Frontend won't compile / `npm run dev` fails

**Solution:**
1. Install dependencies: `npm install` in `/frontend`
2. Check Node version compatibility
3. Clear cache: `rm -rf node_modules package-lock.json && npm install`

**Problem:** API requests failing (CORS errors)

**Solution:**
1. Ensure backend is running on `http://localhost:4000`
2. Check `vite.config.js` has `/api` proxy configured
3. Restart frontend dev server: `npm run dev`

**Problem:** Images not uploading

**Solution:**
1. Check backend `/api/upload/image` endpoint is accessible
2. Verify `multer` is installed: `npm list multer` in `/backend`
3. Check file size is < 10MB
4. Check file format is supported (JPG, PNG, GIF, WebP)

### Data Issues

**Problem:** Lost XML files after restart

**Solution:**
- Ensure `STORAGE_BACKEND=file` is set in `.env`
- Verify files exist in `backend/storage/` directory
- Check file permissions: `ls -la backend/storage/`

**Problem:** MongoDB connection fails

**Solution:**
1. Check `MONGO_URI` in `.env` is correct
2. Verify MongoDB server is running
3. Test connection: `mongosh "your-mongo-uri"`
4. Switch to file storage temporarily: `STORAGE_BACKEND=file`

---

## Summary

Content Blender is a **flexible, modular CMS** that:
- ✅ Stores content in XML (reliable, versionable)
- ✅ Runs with JSON runtime format (fast, JavaScript-friendly)
- ✅ Provides visual React UI (no-code editor)
- ✅ Supports pluggable storage (file or MongoDB)
- ✅ Includes multi-column layouts (rows)
- ✅ Handles rich image metadata (alt text, captions)
- ✅ Exports to XML and HTML formats

**Quick Reference:**
| Task | Location |
|------|----------|
| Create block | CBank page or API |
| Create document | Composer page + save |
| Edit block | Editor panel (right sidebar) |
| Add row | Composer toolbar |
| Upload image | Editor panel > Image block |
| Export | Top menu > Export |
| View API | `/api/health`, `/api/cbank`, `/api/cblend` |
| Store data | `backend/storage/` (file) or MongoDB (cloud) |

---

**Last Updated:** April 29, 2026  
**Project Location:** `/Users/vaishak/Downloads/Content-Blender-main 2`
