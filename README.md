# Content Blender CMS

A headless CMS where XML is the single source of truth, JSON is the runtime format, and React drives the no-code UI.

---

## Project layout

```
content-blender/
├── backend/
│   ├── server.js                   # Express entry point
│   ├── .env.example                # Copy to .env and configure
│   ├── routes/
│   │   ├── cbank.js                # CBank CRUD API
│   │   ├── cblend.js               # CBlend CRUD API
│   │   ├── export.js               # XML / HTML export
│   │   └── health.js               # Health check
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── storage/
│   │   ├── storageAdapter.js       # Selects file vs basex adapter
│   │   ├── fileAdapter.js          # XML-on-disk
│   │   └── basexAdapter.js         # BaseX XML database
│   └── utils/
│       ├── basex.js                # BaseX client driver
│       └── xmlTransform.js         # XML ↔ JSON via fast-xml-parser
│
└── frontend/
    ├── vite.config.js
    ├── src/
    │   ├── App.jsx                 # Router + nav
    │   ├── main.jsx
    │   ├── pages/
    │   │   ├── ComposerPage.jsx    # 3-panel editor
    │   │   ├── CbankPage.jsx       # Block registry
    │   │   └── BlendListPage.jsx   # Saved documents
    │   ├── hooks/
    │   │   ├── useCBank.js
    │   │   └── useCBlend.js
    │   └── utils/
    │       ├── api.js              # Axios client
    │       ├── blocks.js           # Block constants + helpers
    │       └── xmlClient.js        # Client-side XML builder
```

---

## Quick start

### 1. Backend

```bash
cd backend
cp .env.example .env        # edit MONGO_URI and STORAGE_BACKEND
npm install
npm run dev                 # starts on http://localhost:4000
```

#### Storage backends

| `STORAGE_BACKEND` | Description |
|---|---|
| `file` (default) | Persists CBank as `storage/cbank.xml`, each CBlend as `storage/blends/<id>.xml` |
| `basex` | Stores everything in a local or remote BaseX native XML database |

Switch at any time by changing the env var — no code change needed.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # starts on http://localhost:5173
```

Vite proxies `/api/*` to `http://localhost:4000`.

---

## REST API reference

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Service info and storage backend |

---

### CBank  `/api/cbank`

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/api/cbank` | — | List all blocks (JSON) |
| GET | `/api/cbank/xml` | — | Full CBank as XML |
| GET | `/api/cbank/:id` | — | Single block |
| POST | `/api/cbank` | `{id, type, content, items, version}` | Create block |
| PUT | `/api/cbank/:id` | `{type, content, items, version}` | Update block |
| DELETE | `/api/cbank/:id` | — | Delete block |

Valid `type` values: `title` `section` `paragraph` `image` `quote` `list` `hero` `card`

#### Example — create a block

```bash
curl -X POST http://localhost:4000/api/cbank \
  -H "Content-Type: application/json" \
  -d '{"id":"b9","type":"paragraph","content":"Hello world","version":"1.0"}'
```

---

### CBlend  `/api/cblend`

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/api/cblend` | — | List all blends (summary) |
| GET | `/api/cblend/:id` | — | Single blend (JSON) |
| GET | `/api/cblend/:id/xml` | — | Single blend as XML |
| POST | `/api/cblend` | `{id?, meta, blocks}` | Create blend |
| PUT | `/api/cblend/:id` | `{meta?, blocks?}` | Update blend |
| DELETE | `/api/cblend/:id` | — | Delete blend |

#### Blend body shape

```json
{
  "meta": {
    "title": "My document",
    "layout": "article"
  },
  "blocks": [
    { "type": "title",     "content": "Hello", "uid": "u1a2b3" },
    { "type": "paragraph", "content": "World", "uid": "u4c5d6" },
    { "type": "list",      "items":  ["A","B","C"], "uid": "u7e8f9" }
  ]
}
```

---

### Export  `/api/export`

| Method | Path | Returns |
|--------|------|---------|
| GET | `/api/export/blend/:id/xml` | CBlend XML download |
| GET | `/api/export/blend/:id/html` | Fully rendered HTML page download |
| GET | `/api/export/cbank/xml` | Full CBank XML download |

---

## Data schemas

### CBank XSD

```xml
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="cbank">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="cblock" maxOccurs="unbounded">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="content" type="xs:string"/>
              <xs:element name="item" type="xs:string" minOccurs="0" maxOccurs="unbounded"/>
            </xs:sequence>
            <xs:attribute name="id"      type="xs:string" use="required"/>
            <xs:attribute name="type"    use="required">
              <xs:simpleType><xs:restriction base="xs:string">
                <xs:enumeration value="title"/>  <xs:enumeration value="section"/>
                <xs:enumeration value="paragraph"/> <xs:enumeration value="image"/>
                <xs:enumeration value="quote"/>  <xs:enumeration value="list"/>
                <xs:enumeration value="hero"/>   <xs:enumeration value="card"/>
              </xs:restriction></xs:simpleType>
            </xs:attribute>
            <xs:attribute name="version" type="xs:string" default="1.0"/>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>
```

### CBlend XSD

```xml
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="cblend">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="meta">
          <xs:complexType>
            <xs:attribute name="title"   type="xs:string"/>
            <xs:attribute name="layout"  type="xs:string"/>
            <xs:attribute name="created" type="xs:dateTime"/>
          </xs:complexType>
        </xs:element>
        <xs:element name="include" maxOccurs="unbounded">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="content" type="xs:string" minOccurs="0"/>
              <xs:element name="item"    type="xs:string" minOccurs="0" maxOccurs="unbounded"/>
            </xs:sequence>
            <xs:attribute name="ref"  type="xs:string"/>
            <xs:attribute name="type" type="xs:string"/>
            <xs:attribute name="uid"  type="xs:string"/>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
      <xs:attribute name="id" type="xs:string"/>
    </xs:complexType>
  </xs:element>
</xs:schema>
```

---

## Data flow

```
XML (CBank / CBlend)
  ↓  Parse on load (fast-xml-parser)
  ↓  Cache as JSON
  ↓  React UI — edit, drag-drop, compose
  ↓  Live HTML preview
  ↓  Save → JSON → XML → disk / MongoDB
  ↓  Export → XML download or HTML page
```

---

## Switching to BaseX

1. Ensure BaseX is running locally (`basexserver -S`) or via Docker.
2. In `backend/.env` set:
   ```
   STORAGE_BACKEND=basex
   BASEX_HOST=localhost
   BASEX_PORT=1984
   BASEX_USER=admin
   BASEX_PASSWORD=admin
   ```
3. Restart the backend — the `content_blender` database and initial seed blocks are created automatically on first startup.
