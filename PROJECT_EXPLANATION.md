# Content Blender - Complete Beginner's Guide

This document explains every concept in this project as if you're brand new to computer science and web development.

---

## Table of Contents

1. [What is Content Blender?](#what-is-content-blender)
2. [Core Concepts Explained](#core-concepts-explained)
3. [Backend Breakdown](#backend-breakdown)
4. [Frontend Breakdown](#frontend-breakdown)
5. [How Frontend & Backend Talk to Each Other](#how-frontend--backend-talk-to-each-other)
6. [Data Flow Examples](#data-flow-examples)

---

## What is Content Blender?

**Content Blender** is a **Headless CMS** (Content Management System).

Think of it like this:
- **Headless** = no built-in website display
- **CMS** = a tool to organize and manage content (like text, images, sections)

**Real-world analogy**: Imagine a restaurant with a kitchen (backend) that prepares food (content) and a waiter system (frontend) that delivers it to different customers. The kitchen doesn't care if the waiter is French, Spanish, or robot—they just receive orders and send back the food. Content Blender works the same way.

**What it does:**
- You create **blocks** (building blocks of content like titles, paragraphs, images)
- You organize them into **documents** (called "Blends")
- You can export the content as **XML** or **HTML**
- Multiple systems can use the same content in different ways

---

## Core Concepts Explained

### 1. **Block** - A Unit of Content

A **block** is a single piece of reusable content. Think of it like a LEGO brick.

**Example blocks:**
```
{
  id: "b_abc123",           // Unique name for this block
  type: "paragraph",        // What kind of block is this?
  name: "Intro Text",       // Human-readable label
  content: "Hello world...", // The actual text/data
  version: "1.0",           // Version number
  items: []                 // Sub-items (for lists, cards, etc.)
}
```

**Block types available:**
- `title` - A heading
- `section` - A section divider/heading
- `paragraph` - A text paragraph
- `image` - An image
- `quote` - A block quote
- `list` - A bulleted/numbered list
- `hero` - A large hero image with text
- `card` - A grid of cards

### 2. **CBank** - The Block Library

**CBank** = **Content Bank**. It's a central storage place for all your reusable blocks.

**Simple analogy:** It's like a library where you store all available LEGO bricks. You can have 100 different "paragraph" blocks, each with different text.

When you want to create a document, you pick blocks from the CBank and arrange them.

### 3. **CBlend** - A Document

A **CBlend** = a **composition/blend** of blocks.

**What it is:** An ordered list of blocks arranged to create a final document.

**Example CBlend structure:**
```
{
  id: "blend_xyz789",
  name: "My Article",
  content: [
    { type: "hero", content: "Big Headline" },
    { type: "paragraph", content: "Introduction..." },
    { type: "section", content: "Chapter 1" },
    { type: "paragraph", content: "Details..." }
  ]
}
```

**Analogy:** If blocks are LEGO bricks, a Blend is the completed LEGO house you build with them.

### 4. **XML** - Data Storage Format

**XML** = **eXtensible Markup Language**

It's a way to store data that's both human-readable and machine-readable.

**Simple XML example:**
```xml
<?xml version="1.0"?>
<cbank>
  <cblock id="b123" type="paragraph" name="Intro">
    <content>Hello world</content>
  </cblock>
  <cblock id="b456" type="title" name="My Title">
    <content>Welcome</content>
  </cblock>
</cbank>
```

**Why XML?** It's structured, readable, and survives software changes. XML is the **"single source of truth"** in Content Blender—everything is stored in XML, then converted to other formats as needed.

### 5. **JSON** - Runtime Format

**JSON** = **JavaScript Object Notation**

It's a simpler, more compact way to represent data. JavaScript/web apps love JSON.

**Same data as JSON:**
```json
{
  "blocks": [
    { "id": "b123", "type": "paragraph", "name": "Intro", "content": "Hello world" },
    { "id": "b456", "type": "title", "name": "My Title", "content": "Welcome" }
  ]
}
```

**In this project:**
- Data is stored in **XML** (permanent, reliable)
- When the app runs, XML is converted to **JSON** (fast, easy to work with)

### 6. **Storage Adapter** - Pluggable Storage

The system can save data in two different places:

1. **File Storage** (default, for development)
   - Saves as `.xml` files on disk
   - CBank → `storage/cbank.xml`
   - Blends → `storage/blends/blend-xxxxx.xml`

2. **MongoDB** (for production)
   - Saves to a database in the cloud
   - More reliable, scalable

**You can switch between them by changing one setting.** The code doesn't need to change.

---

## Backend Breakdown

The **backend** is the "kitchen" - it runs on the server and handles all the data.

### File Structure:

```
backend/
├── server.js                 # Entry point (starts the server)
├── package.json              # List of dependencies
├── middleware/
│   └── errorHandler.js       # Catches and handles errors
├── routes/                   # API endpoints
│   ├── health.js            # Health check
│   ├── cbank.js             # Block operations
│   ├── cblend.js            # Document operations
│   └── export.js            # Export to XML/HTML
├── storage/
│   ├── storageAdapter.js    # Decides where to save (file or mongo)
│   ├── fileAdapter.js       # Save/load from files
│   ├── mongoAdapter.js      # Save/load from MongoDB
│   ├── cbank.xml            # The actual CBank file
│   └── blends/              # Folder of saved documents
└── utils/
    ├── db.js                # Connect to database
    └── xmlTransform.js      # Convert between XML and JSON
```

### Key Backend Files:

#### **1. server.js** - The Starting Point

**What it does:**
- Starts the Express server (a web framework)
- Loads environment variables (settings from `.env` file)
- Sets up middleware (helper functions)
- Registers all the API routes
- Listens for incoming requests on `http://localhost:4000`

**Simple flow:**
```
1. Server starts
2. Loads settings (.env file)
3. Sets up middleware (cors, json parsing, logging)
4. Registers routes (what URLs to respond to)
5. Listens on port 4000
6. Waits for requests
```

#### **2. routes/cbank.js** - Block Management API

**What it does:** Handles HTTP requests related to blocks (CBank).

**Endpoints (API URLs):**

| Method | URL | What it does |
|--------|-----|-------------|
| GET | `/api/cbank` | Get all blocks as JSON |
| GET | `/api/cbank/xml` | Get all blocks as XML |
| GET | `/api/cbank/:id` | Get one specific block |
| POST | `/api/cbank` | Create a new block |
| PUT | `/api/cbank/:id` | Update an existing block |
| DELETE | `/api/cbank/:id` | Delete a block |

**Example: Creating a block**

When the frontend sends: `POST /api/cbank` with `{ type: "paragraph", content: "Hello" }`

The backend:
1. Generates a unique ID (e.g., `b_abc123`)
2. Creates the block object
3. Loads current CBank from storage
4. Adds new block to the list
5. Saves back to storage (file or MongoDB)
6. Sends back the created block

#### **3. routes/cblend.js** - Document Management API

**What it does:** Handles HTTP requests related to documents (CBlends).

Similar to cbank.js, but for complete documents:
- GET all blends
- GET one blend
- POST create a new blend
- PUT update a blend
- DELETE remove a blend

#### **4. utils/xmlTransform.js** - XML ↔ JSON Converter

**What it does:** Converts between XML and JSON formats.

**Why needed?** 
- Data is stored in XML (reliable, human-readable)
- Frontend wants JSON (faster, easier to work with in JavaScript)

**Two main functions:**

1. **parseCBankXML()** - XML to JSON
   ```
   Input:  <cblock id="b123" type="paragraph">...</cblock>
   Output: { id: "b123", type: "paragraph", ... }
   ```

2. **buildCBankXML()** - JSON to XML
   ```
   Input:  { id: "b123", type: "paragraph", ... }
   Output: <cblock id="b123" type="paragraph">...</cblock>
   ```

#### **5. storage/storageAdapter.js** - The Switch

**What it does:** Decides which storage backend to use.

```javascript
// Pseudocode
if (STORAGE_BACKEND === "file") {
  use fileAdapter
} else if (STORAGE_BACKEND === "mongo") {
  use mongoAdapter
}
```

This allows you to switch storage by changing one environment variable without changing any code.

#### **6. storage/fileAdapter.js** - File-Based Storage

**What it does:** Save and load data from XML files on disk.

**Methods:**
- `getCBank()` - Read `storage/cbank.xml` and return blocks
- `saveCBank(blocks)` - Write blocks to `storage/cbank.xml`
- `getCBlend(id)` - Read `storage/blends/blend-xxxxx.xml`
- `saveCBlend(id, blend)` - Write to file

**Example:**
```
getCBank()
  ↓
  Read the file: storage/cbank.xml
  ↓
  Parse XML to JSON
  ↓
  Return the blocks
```

#### **7. middleware/errorHandler.js** - Error Handling

**What it does:** Catches errors and sends friendly error messages to the frontend.

**Example:** If a request tries to delete a block that doesn't exist, this middleware catches that error and sends back a helpful message instead of crashing the server.

---

## Frontend Breakdown

The **frontend** is what you see in your browser. It's the "waiter" that takes orders and displays results.

### File Structure:

```
frontend/
├── package.json          # Dependencies
├── vite.config.js        # Build configuration
└── src/
    ├── App.jsx           # Main app structure
    ├── main.jsx          # Entry point
    ├── context/
    │   └── CbankContext.jsx    # Global state for blocks
    ├── hooks/
    │   ├── useCBank.js         # Custom hook for block operations
    │   └── useCBlend.js        # Custom hook for document operations
    ├── pages/
    │   ├── ComposerPage.jsx    # Editor (arrange blocks)
    │   ├── CbankPage.jsx       # Block registry (manage blocks)
    │   └── BlendListPage.jsx   # List of saved documents
    ├── utils/
    │   ├── api.js              # HTTP client
    │   ├── blocks.js           # Block definitions and templates
    │   └── xmlClient.js        # Client-side XML building
    └── styles/
        ├── app.css
        └── global.css
```

### Key Concepts:

#### **React** - The Frontend Framework

**What it is:** A JavaScript library for building interactive user interfaces.

**Key idea:** React automatically updates the screen when your data changes. You don't manually touch the HTML.

**Metaphor:** Think of React like a puppet theater. You control the puppet's movements (data), and React automatically moves the display (HTML) on stage for you.

#### **Components** - Reusable UI Building Blocks

A **component** is a reusable piece of the interface. Like a block, but for UI.

**Example components:**
- A button
- A form
- A page
- A card

**In React:**
```jsx
function MyButton() {
  return <button>Click me</button>
}
```

#### **State** - Data That Changes

**State** = data that can change over time.

**Examples in this app:**
- List of blocks
- Currently selected block
- Are we loading data?

When state changes, React automatically updates the screen.

```jsx
const [blocks, setBlocks] = useState([])
// blocks = current value
// setBlocks = function to change it
```

#### **Context** - Global State

**Context** = a way to share data across many components without passing it through each one.

**Analogy:** Imagine a company announcement system. Instead of each employee asking the boss for news individually, the boss announces once on the intercom, and everyone hears it.

**In this app:** `CbankContext` shares the list of blocks with all components that need it.

#### **Hooks** - Special Functions

**Hooks** = functions that let components do special things (manage state, fetch data, etc.).

**In this app:**
- `useCBank()` - Manages block operations (create, update, delete)
- `useCBlend()` - Manages document operations

---

## Key Frontend Files:

### **1. App.jsx** - The Main App

**What it does:**
- Sets up the navigation (3 pages)
- Shows the page content based on URL

**Structure:**
```
Content Blender
├── Composer (Editor)
├── CBank (Block Registry)
└── Documents (Saved Blends)
```

### **2. CbankContext.jsx** - Block State Management

**What it does:** 
- Stores the list of all blocks
- Provides functions to create, update, delete blocks
- All components can access this

**Functions provided:**
- `load()` - Fetch all blocks from backend
- `create()` - Create a new block
- `update()` - Update an existing block
- `remove()` - Delete a block

**Why needed?** Multiple pages need access to blocks. Instead of each page fetching separately, one context provides them all.

### **3. useCBank.js** - Custom Hook for Blocks

**What it does:** Wraps the context for easier use in components.

**Makes this easy:**
```jsx
const { blocks, create, update, remove } = useCBank()
```

Instead of:
```jsx
const context = useContext(CbankContext)
// and then accessing context.blocks, context.create, etc.
```

### **4. pages/ComposerPage.jsx** - The Editor

**What it does:** 
- Shows a 3-panel editor
- Left panel: list of blocks you can add
- Middle panel: your document (drag-and-drop arrangement)
- Right panel: edit the selected block

**Key features:**
- Add blocks to your document
- Reorder blocks
- Edit block content
- Save your document

### **5. pages/CbankPage.jsx** - Block Management

**What it does:**
- Shows all blocks
- Create new blocks
- Edit blocks
- Delete blocks
- View as XML

### **6. pages/BlendListPage.jsx** - Saved Documents

**What it does:**
- Shows all saved documents
- Open a document in the editor
- Delete documents

### **7. utils/api.js** - HTTP Client

**What it does:** Provides functions to talk to the backend.

**Functions:**
```javascript
cbankApi.list()           // GET /api/cbank
cbankApi.create(block)    // POST /api/cbank
cbankApi.update(id, data) // PUT /api/cbank/:id
cbankApi.delete(id)       // DELETE /api/cbank/:id

cblendApi.list()          // GET /api/cblend
cblendApi.create(doc)     // POST /api/cblend
// etc.

exportApi.blendXml(id)    // Export as XML
exportApi.blendHtml(id)   // Export as HTML
```

### **8. utils/blocks.js** - Block Definitions

**What it does:** Defines all available block types and templates.

**Provides:**
- `BLOCK_TYPES` - List of available block types
- `BLOCK_GROUPS` - Grouped by category (Typography, Media, Content)
- `LAYOUTS` - Pre-made templates (Article, Landing Page, Report, etc.)

**Example:**
```javascript
{ type: "title", label: "Title", icon: "T", colorClass: "type-title" }
```

---

## How Frontend & Backend Talk to Each Other

### **1. The Protocol: HTTP Requests**

**HTTP** = HyperText Transfer Protocol

It's the language the web uses. It works like this:

```
Frontend: "Hey backend, can you give me all blocks?"
Backend: "Sure! Here they are: [block1, block2, ...]"
```

### **2. Request Methods (Verbs)**

Different HTTP methods mean different things:

| Method | Meaning | Example |
|--------|---------|---------|
| GET | "Give me data" | Fetch all blocks |
| POST | "Create new data" | Make a new block |
| PUT | "Update existing data" | Change a block |
| DELETE | "Remove data" | Delete a block |

### **3. JSON: The Data Format**

When frontend and backend talk, they use JSON.

**Request example:**
```
Frontend sends:
POST /api/cbank
{
  "type": "paragraph",
  "content": "Hello",
  "name": "Intro"
}
```

**Backend responds:**
```
200 OK
{
  "ok": true,
  "data": {
    "id": "b_abc123",
    "type": "paragraph",
    "content": "Hello",
    "name": "Intro"
  }
}
```

### **4. The Axios Library**

**Axios** = a JavaScript library that makes HTTP requests easy.

**Simple usage:**
```javascript
// Make a GET request
const data = await api.get("/cbank")

// Make a POST request
const response = await api.post("/cbank", { type: "paragraph", ... })

// Make a PUT request
const updated = await api.put("/cbank/b123", { content: "New text" })

// Make a DELETE request
await api.delete("/cbank/b123")
```

### **5. Vite Proxy**

**Vite** = the build tool that runs the frontend during development.

**The problem:** Frontend runs on `localhost:5173`, backend on `localhost:4000`. Different URLs cause CORS (Cross-Origin Resource Sharing) errors.

**The solution:** Vite proxies requests.

```
Frontend: http://localhost:5173/api/cbank
  ↓ (Vite intercepts)
  ↓ (Vite forwards to)
Backend: http://localhost:4000/api/cbank
```

From the frontend's perspective, everything looks like it's on the same server!

---

## Data Flow Examples

### **Example 1: Creating a New Block**

**Step by step:**

1. **User creates a block in the UI**
   - Types "My Title" and selects type "title"
   - Clicks "Create"

2. **Frontend prepares data**
   ```jsx
   const newBlock = {
     type: "title",
     content: "My Title",
     name: "Homepage Title"
   }
   ```

3. **Frontend sends HTTP request**
   ```
   POST /api/cbank
   {
     "type": "title",
     "content": "My Title",
     "name": "Homepage Title"
   }
   ```

4. **Backend receives request** (in cbank.js)
   ```javascript
   // Generate unique ID
   const id = "b_abc123"
   
   // Load current blocks from storage
   const blocks = await storage.getCBank()
   
   // Create new block object
   const newBlock = {
     id: "b_abc123",
     type: "title",
     content: "My Title",
     name: "Homepage Title"
   }
   
   // Add to list
   blocks.push(newBlock)
   
   // Save to storage (XML file or MongoDB)
   await storage.saveCBank(blocks)
   ```

5. **Backend sends response**
   ```json
   {
     "ok": true,
     "data": {
       "id": "b_abc123",
       "type": "title",
       "content": "My Title",
       "name": "Homepage Title"
   }
   ```

6. **Frontend receives response**
   ```jsx
   // The create() function in CbankContext:
   // 1. Receives the response
   // 2. Adds it to the blocks list
   // 3. Shows a success message
   setBlocks((prev) => [...prev, saved])
   toast.success("Block created!")
   ```

7. **UI automatically updates**
   - React sees the blocks list changed
   - React re-renders the block list
   - User sees their new block!

---

### **Example 2: Creating and Saving a Document (CBlend)**

**Step by step:**

1. **User opens the Composer**
   - Page loads, frontend fetches all blocks
   - Displays them in left panel

2. **User builds a document**
   - Drags "title" block into middle panel
   - Drags "paragraph" block below it
   - Edits the text
   - Clicks "Save Document"

3. **Frontend prepares CBlend**
   ```json
   {
     "name": "My Article",
     "blocks": [
       { "blockId": "b_abc123", "content": "My Article Title" },
       { "blockId": "b_def456", "content": "Article text..." }
     ]
   }
   ```

4. **Frontend sends to backend**
   ```
   POST /api/cblend
   {
     "name": "My Article",
     "blocks": [...]
   }
   ```

5. **Backend processes**
   ```javascript
   // Generate ID
   const id = "blend_xyz789"
   
   // Create CBlend object
   const cblend = {
     id: "blend_xyz789",
     name: "My Article",
     blocks: [...],
     createdAt: "2025-04-22T10:30:00Z"
   }
   
   // Save to storage (as blend-xyz789.xml file or in MongoDB)
   await storage.saveCBlend(id, cblend)
   ```

6. **Backend responds**
   ```json
   {
     "ok": true,
     "data": {
       "id": "blend_xyz789",
       "name": "My Article",
       ...
     }
   }
   ```

7. **Frontend updates**
   - Shows "Document saved!" message
   - Adds document to the Documents page list

8. **Data is now persistent**
   - Saved as `storage/blends/blend-xyz789.xml` (file backend)
   - Or in MongoDB (mongo backend)
   - User can reload, and it's still there!

---

### **Example 3: Exporting to HTML**

**Step by step:**

1. **User clicks "Export as HTML"**
   - Sends GET request to backend

2. **Frontend request:**
   ```
   GET /api/export/blend/blend_xyz789/html
   ```

3. **Backend processes** (in export.js)
   ```javascript
   // 1. Load the CBlend
   const blend = await storage.getCBlend("blend_xyz789")
   
   // 2. For each block in the blend:
   //    - Load block from CBank
   //    - Render it as HTML
   
   // 3. Combine into one HTML document
   const html = `
     <html>
       <body>
         <h1>My Article Title</h1>
         <p>Article text...</p>
       </body>
     </html>
   `
   
   // 4. Send back as file
   res.set("Content-Type", "text/html")
   res.send(html)
   ```

4. **Frontend receives HTML file**
   - Browser downloads it
   - User can open it in any browser
   - Can share with anyone!

---

### **Example 4: XML Transformation**

**The journey of data:**

1. **At rest (storage):**
   ```xml
   <!-- storage/cbank.xml -->
   <?xml version="1.0"?>
   <cbank>
     <cblock id="b123" type="title" name="Homepage">
       <content>Welcome</content>
     </cblock>
   </cbank>
   ```

2. **In memory (backend):**
   ```javascript
   // xmlTransform.js converts XML to JSON
   const blocks = [
     {
       id: "b123",
       type: "title",
       name: "Homepage",
       content: "Welcome"
     }
   ]
   ```

3. **Over the wire (HTTP):**
   ```json
   {
     "ok": true,
     "data": [{
       "id": "b123",
       "type": "title",
       "name": "Homepage",
       "content": "Welcome"
     }]
   }
   ```

4. **In the frontend (React):**
   ```jsx
   const [blocks, setBlocks] = useState([
     {
       id: "b123",
       type: "title",
       name: "Homepage",
       content: "Welcome"
     }
   ])
   ```

5. **Displayed to user (HTML/CSS):**
   ```html
   <div class="block-title">
     <h1>Welcome</h1>
   </div>
   ```

---

## Communication Summary Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       USER'S BROWSER                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              FRONTEND (React)                           │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │  Composer    │  │   CBank      │  │   Blends     │ │ │
│  │  │   (Editor)   │  │  (Blocks)    │  │  (Docs)      │ │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │ │
│  │         └────────────┬────────────────┬────────┘       │ │
│  │                      │                │                │ │
│  │          ┌───────────▼────────────────▼─────────┐      │ │
│  │          │     CbankContext (Global State)       │      │ │
│  │          │   - blocks, create, update, delete   │      │ │
│  │          └───────────┬────────────────┬─────────┘      │ │
│  │                      │                │                │ │
│  │          ┌───────────▼────────────────▼─────────┐      │ │
│  │          │     api.js (Axios HTTP Client)       │      │ │
│  │          │  Makes requests to backend URLs      │      │ │
│  │          └───────────┬────────────────┬─────────┘      │ │
│  └──────────────────────┼────────────────┼────────────────┘ │
│                         │                │                  │
│                    HTTP GET/POST/PUT/DELETE                │
│                    JSON request/response                   │
│                         │                │                  │
└─────────────────────────┼────────────────┼──────────────────┘
                          │                │
                          ▼                ▼
┌────────────────────────────────────────────────────────────┐
│                   YOUR COMPUTER                            │
│                   (Running Node.js)                        │
│                                                            │
│  ┌────────────────────────────────────────────────────────┐│
│  │              BACKEND (Express)                         ││
│  │  ┌────────────┐  ┌────────────┐  ┌───────────────┐   ││
│  │  │  /api/     │  │  /api/     │  │  /api/        │   ││
│  │  │  cbank     │  │  cblend    │  │  export       │   ││
│  │  │ (Blocks)   │  │ (Documents)│  │ (XML/HTML)    │   ││
│  │  └────┬───────┘  └────┬───────┘  └───────┬───────┘   ││
│  │       │                │                 │            ││
│  │       └────────────────┼─────────────────┘            ││
│  │                        │                              ││
│  │      ┌─────────────────▼──────────────────┐           ││
│  │      │  xmlTransform.js                   │           ││
│  │      │  (Convert XML ↔ JSON)              │           ││
│  │      └─────────────────┬──────────────────┘           ││
│  │                        │                              ││
│  │      ┌─────────────────▼──────────────────┐           ││
│  │      │  storageAdapter.js                 │           ││
│  │      │  (Decides: File or Mongo?)         │           ││
│  │      └─┬──────────────────────────────┬──┘           ││
│  │        │                              │               ││
│  │    ┌───▼────────┐         ┌──────────▼────┐          ││
│  │    │ fileAdapter│         │ mongoAdapter   │          ││
│  │    │ (XML Files)│         │ (MongoDB)      │          ││
│  │    └────────────┘         └────────────────┘          ││
│  └────────────────────────────────────────────────────────┘│
│                                                            │
│  ┌────────────────────────────────────────────────────────┐│
│  │              STORAGE                                  ││
│  │  /storage/cbank.xml                                   ││
│  │  /storage/blends/blend-*.xml                          ││
│  │  (OR MongoDB in the cloud)                            ││
│  └────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────┘
```

---

## Summary: The Big Picture

**Content Blender is:**
1. A tool for managing reusable content **blocks**
2. A way to arrange blocks into **documents** (Blends)
3. A system that stores data in **XML** (reliable) but works with **JSON** (fast)
4. A **frontend/backend** system where:
   - **Backend** = server that manages data
   - **Frontend** = browser UI that lets you edit data
   - They talk via **HTTP requests** using **JSON**

**The flow:**
```
User interacts with UI
         ↓
Frontend sends HTTP request
         ↓
Backend processes request
         ↓
Backend reads/writes data
         ↓
Backend sends response
         ↓
Frontend updates display
         ↓
User sees result
```

**Key files to understand first:**
- `frontend/src/App.jsx` - Entry point of the UI
- `backend/server.js` - Entry point of the server
- `frontend/src/context/CbankContext.jsx` - How data is shared
- `frontend/src/utils/api.js` - How frontend talks to backend
- `backend/routes/cbank.js` - What backend does with requests
- `backend/utils/xmlTransform.js` - How data is transformed

---

## Common Questions

**Q: Why XML for storage?**
A: XML is human-readable, reliable, and survives software updates. It's the "source of truth."

**Q: Why JSON for communication?**
A: JSON is lightweight and fast. JavaScript understands it natively.

**Q: Why two storage options (file vs MongoDB)?**
A: File storage is simple (good for development). MongoDB is scalable (good for production). You can switch anytime!

**Q: What is "headless" CMS?**
A: It doesn't come with a built-in website display. You can use the content anywhere (website, app, email, etc.).

**Q: How does state management work?**
A: `CbankContext` stores the blocks list globally. Components access it without passing data through every level.

**Q: Why do we need Vite?**
A: It runs the frontend during development, proxies API requests, and bundles code for production.

---

## Next Steps

To fully understand, try this:

1. **Start the backend:** `cd backend && npm run dev`
2. **Start the frontend:** `cd frontend && npm run dev`
3. **Open browser:** `http://localhost:5173`
4. **Create a block:** Click CBank → Create a new block
5. **Open DevTools:** Press F12 → Network tab
6. **Watch the communication:** Create another block and watch the HTTP request/response in Network tab
7. **Look at the data:** Check `backend/storage/cbank.xml` to see the XML storage

This will make everything click!
