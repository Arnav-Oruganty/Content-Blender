# Content Blender - Feature Implementation Summary

## Overview
This document summarizes the implementation of two major features:
1. **Horizontal/Multi-Column Layouts** - Row containers that can hold multiple blocks side-by-side
2. **Enhanced Image Block Handling** - Dedicated image editing with file upload, metadata, and real-time preview

---

## Implementation Details

### Part 1: Horizontal/Multi-Column Layouts

#### What Was Implemented
- **Row Container Block Type**: A new "row" block type that acts as a container for other blocks
- **Variable Column Support**: Rows can have 1-4 columns with configurable gap spacing
- **Draggable Blocks in Rows**: Blocks within rows can be individually added, removed, and reordered
- **Flexible Layout**: Rows render with CSS Flexbox, responsive on mobile

#### Files Modified

##### Backend
**1. `/backend/utils/xmlTransform.js`**
- Added support for nested block structures with `children` array
- Added `containerType` property to track if a block belongs to a row
- Updated `normaliseInclude()` and `buildIncludeElement()` to handle row children recursively
- Example XML structure for rows:
```xml
<include type="row" columns="2" gap="16px">
  <include type="paragraph">...</include>
  <include type="paragraph">...</include>
</include>
```

**2. `/backend/routes/cbank.js`**
- Added "row" to `VALID_TYPES`
- Added `containerType` field to block validation rules
- Updated POST and PUT handlers to preserve `containerType`

**3. `/backend/routes/cblend.js`**
- Added `normalizeBlock()` helper function that recursively processes row children
- Updated POST and PUT handlers to use the normalizer for proper data structure

**4. `/backend/routes/export.js`**
- Added recursive `renderBlock()` function in `blendToHTML()`
- Row containers render as flexbox containers with responsive CSS
- Supports `gap` and `columns` properties
- Mobile-responsive with `@media (max-width: 768px)` breakpoint

##### Frontend
**1. `/frontend/src/utils/blocks.js`**
- Added "row" block type to `BLOCK_TYPES` and `BLOCK_GROUPS`
- Created helper functions:
  - `getRowSchema()` - Returns row container schema
  - `createRowBlock()` - Creates a new row with given column count
  - `createBlock()` - Generic block factory with containerType support
  - `createImageBlock()` - Image-specific factory

**2. `/frontend/src/hooks/useCBlend.js`**
- Added row management functions:
  - `addRow(columns, atIndex)` - Insert a new row container
  - `addToRow(rowIndex, blockDef)` - Add a block to a specific row
  - `removeFromRow(rowIndex, childIndex)` - Remove block from row
  - `reorderInRow(rowIndex, fromIdx, toIdx)` - Reorder blocks within a row
  - `updateRow(rowIndex, patch)` - Update row properties (columns, gap)
- Extended `addBlock()` to include `containerType` and `children` properties

**3. `/frontend/src/components/RowBlock.jsx` (NEW)**
- Custom component for rendering row containers in the canvas
- Shows child blocks with proper column flex sizing
- Allows adding blocks to rows with "+ Add to row" button
- Configurable columns (1-4) and gap (8px-32px)
- Individual child block selection and removal

**4. `/frontend/src/pages/ComposerPage.jsx`**
- Updated imports to include `RowBlock`, `EditorPanel`, and `ImageBlockEditor`
- Added `selectedBlockIdx` state to track active block for editing
- Updated `BlendItemEditor` to:
  - Detect "row" type and delegate to `RowBlock` component
  - Accept new props for selection and row operations
  - Highlight selected blocks with border/background
- Added "+ Row" buttons in toolbar (2-column and 3-column variants)
- Updated canvas item rendering to pass selection handlers

---

### Part 2: Enhanced Image Block Handling

#### What Was Implemented
- **Dual Upload Methods**: URL input or file upload to backend
- **Image Metadata**: Separate fields for URL, alt text, and caption
- **Real-time Preview**: Live thumbnail in the editor
- **File Upload Endpoint**: POST `/api/upload/image` with 10MB limit
- **Base64-Free Storage**: Files stored in `/storage/uploads` with path references

#### Files Modified

##### Backend
**1. `/backend/routes/upload.js` (NEW)**
- Multer configuration for multipart/form-data handling
- Validates file types (jpg, jpeg, png, gif, webp)
- Stores files with UUID naming: `{uuid}{extension}`
- Returns upload metadata (filename, path, size, mimetype)
- 10MB file size limit

**2. `/backend/server.js`**
- Added `multer` dependency and `upload` route
- Added static file serving for `/uploads` directory
- Registered `uploadRouter` at `/api/upload`

**3. `/backend/routes/cbank.js`**
- Extended block validation to include image metadata fields:
  - `sourceType` ("url" or "local")
  - `url` (image path or URL)
  - `altText` (accessibility description)
  - `caption` (optional figure caption)
- Updated POST/PUT handlers to preserve all image metadata

**4. `/backend/routes/cblend.js`**
- Updated `normalizeBlock()` to include image metadata fields
- Children blocks inherit image metadata structure

**5. `/backend/utils/xmlTransform.js`**
- Added nested `<metadata>` XML elements for images:
```xml
<include type="image">
  <metadata sourceType="local" url="/uploads/abc123.jpg" altText="..." caption="..."/>
</include>
```
- Updated `normaliseInclude()` and `normaliseBlock()` to parse metadata attributes
- Updated `buildIncludeElement()` to serialize metadata correctly

**6. `/backend/routes/export.js`**
- Updated image rendering in `renderBlock()`:
  - Uses `b.url` if available (uploaded file or external URL)
  - Falls back to `b.content` (legacy support)
  - Includes `altText` and `caption` in HTML output
  - Proper accessibility with `<figure>` and `<figcaption>`

**7. `/backend/package.json`**
- Added `"multer": "^1.4.5"` dependency

##### Frontend
**1. `/frontend/src/components/ImageBlockEditor.jsx` (NEW)**
- React component for dedicated image block editing
- Two source options:
  - **URL Mode**: Text input for image URLs
  - **Upload Mode**: File drag-drop area with upload button
- Features:
  - Real-time image preview
  - Alt text textarea (accessibility)
  - Caption textarea (optional)
  - Async file upload with error handling
  - Toast notifications for feedback
- Upload uses `/api/upload/image` endpoint
- Stores `sourceType`, `url`, `altText`, and `caption`

**2. `/frontend/src/components/EditorPanel.jsx` (NEW)**
- Right-side panel for editing selected block
- Block type detection with proper UI for each type:
  - **image**: Delegates to `ImageBlockEditor`
  - **title/section**: Text input
  - **paragraph/quote**: Textarea
  - **list/card**: Newline-separated items
- Collapsible block header showing type and UID
- Only shows editor for selected block

**3. `/frontend/src/utils/api.js`**
- Added `uploadApi` with `image(file)` function
- Handles FormData and multipart/form-data headers
- Returns uploaded file metadata

**4. `/frontend/src/pages/ComposerPage.jsx`**
- Added "editor" tab to right panel (between "preview" and "xml")
- Updated `BlendItemEditor` image rendering to show url and metadata
- Integrated `EditorPanel` in the "editor" tab
- Passes `selectedBlockIdx` to identify current block

---

## Data Structure Changes

### Block Schema (CBlend)
```javascript
{
  uid: "u1a2b3c4",           // Unique instance ID
  ref: "b123",               // Reference to CBank block (if applicable)
  type: "paragraph|image|row|...",
  content: "text content",   // Main content
  items: ["item1", "item2"], // For lists/cards
  
  // Image metadata (type === "image")
  sourceType: "url|local",
  url: "/uploads/abc.jpg",
  altText: "Description",
  caption: "Optional caption",
  
  // Container tracking
  containerType: null|"row",
  
  // Row container (type === "row")
  columns: 2,
  gap: "16px",
  children: [/* nested blocks */],
}
```

### XML Structure Example
```xml
<?xml version="1.0" encoding="UTF-8"?>
<cblend id="blend-xyz">
  <meta title="..." layout="..." created="..."/>
  
  <!-- Regular block -->
  <include ref="b1" type="paragraph" uid="u1">
    <content>Some text</content>
  </include>
  
  <!-- Image with metadata -->
  <include ref="b2" type="image" uid="u2">
    <metadata sourceType="local" url="/uploads/img.jpg" altText="..." caption="..."/>
  </include>
  
  <!-- Row container with children -->
  <include type="row" uid="u3" columns="2" gap="16px">
    <include ref="b3" type="paragraph" uid="u3a">
      <content>Column 1</content>
    </include>
    <include ref="b4" type="paragraph" uid="u3b">
      <content>Column 2</content>
    </include>
  </include>
</cblend>
```

---

## API Endpoints

### New Endpoints
```
POST /api/upload/image
- Upload image file
- Body: FormData with "file" field
- Response: { ok: true, data: { filename, path, url, size, mimetype } }
- Max file size: 10MB
- Allowed types: jpg, jpeg, png, gif, webp
```

### Updated Endpoints
```
POST/PUT /api/cbank       - Now accepts imageblock metadata
POST/PUT /api/cblend      - Now handles row children recursively
GET /api/export/blend/:id/html - Renders rows with flexbox, image metadata in HTML
```

---

## UI/UX Changes

### Composer Canvas
- **New Row Buttons**: "+ Row (2 cols)" and "+ Row (3 cols)" in toolbar
- **Row Rendering**: Rows display as highlighted containers with child blocks
- **Row Controls**: Each row can have columns and gap adjusted
- **Block Selection**: Click any block to select it for editing
- **Editor Tab**: New tab showing dedicated editor for selected block

### Right Panel
- **Editor Tab**: Shows `EditorPanel` with type-specific controls
- **Image Editor**: File upload, URL input, alt text, caption for image blocks
- **Real-time Preview**: Live image thumbnail in editor

---

## Testing Checklist

- [ ] **Row Creation**: Click "+ Row" buttons to add 2-column and 3-column rows
- [ ] **Add to Row**: Click "+ Add to row" in row blocks and drag blocks into row
- [ ] **Remove from Row**: Click ✕ on child blocks to remove them from row
- [ ] **Column Configuration**: Adjust row columns (1-4) and gap (8px-32px)
- [ ] **Image Upload**: Upload image file via file input
- [ ] **Image URL**: Enter external image URL
- [ ] **Image Metadata**: Edit alt text and caption
- [ ] **Save/Load**: Save document and reload to verify persistence
- [ ] **Export HTML**: Export document and verify row layout renders with flexbox
- [ ] **Export XML**: Verify nested block structure in XML
- [ ] **Responsive**: Resize browser and verify mobile layout (1 column)

---

## Known Limitations

1. **Row Nesting**: Rows cannot contain other rows (one level only)
2. **Mobile Upload**: File upload tested on desktop; mobile may need additional testing
3. **Image Resize**: Images in rows resize to fit columns; no manual resize handles within rows
4. **XML Size**: Large base64 strings are now avoided by using file uploads instead

---

## Next Steps / Future Enhancements

1. **Drag-Drop to Rows**: Allow dragging blocks from CBank directly into row columns
2. **Row Templates**: Pre-made row configurations (hero + 2-column, etc.)
3. **Image Optimization**: Automatic resizing/compression on upload
4. **Row Nesting**: Allow rows within rows for complex layouts
5. **Responsive Breakpoints**: Specify different column counts for mobile/tablet/desktop
6. **Image Gallery**: Multiple images per row with lightbox preview

---

## Installation / Dependencies

### Backend
```bash
cd backend
npm install multer  # Already added to package.json
npm run dev
```

### Frontend
```bash
cd frontend
npm install  # No new dependencies added
npm run dev
```

### Directories
```
Created: /backend/storage/uploads/  # For uploaded image files
```

---

## Troubleshooting

**Issue**: Upload endpoint returns 404
- **Solution**: Ensure `uploadRouter` is registered in `server.js` and route imports are correct

**Issue**: Images not displaying in HTML export
- **Solution**: Check that image URLs are correct (full paths for uploaded files: `/uploads/...`)

**Issue**: Row blocks show as empty in preview
- **Solution**: Ensure blocks were properly added to row's `children` array (check in XML tab)

**Issue**: Multer error "File too large"
- **Solution**: Ensure file is under 10MB; update limit in `/backend/routes/upload.js` if needed

---

## Summary of Changes by File

| File | Type | Change | Lines |
|------|------|--------|-------|
| `blocks.js` | Frontend Utils | Added row/image helpers | +45 |
| `xmlTransform.js` | Backend Utils | Nested metadata & rows | +80 |
| `cbank.js` | Backend Route | Image metadata, row type | +20 |
| `cblend.js` | Backend Route | Recursive block normalize | +25 |
| `upload.js` | Backend Route (NEW) | File upload endpoint | 70 |
| `export.js` | Backend Route | Recursive rendering, flexbox | +50 |
| `useCBlend.js` | Frontend Hook | Row operations | +60 |
| `server.js` | Backend | Multer setup, uploads serving | +5 |
| `package.json` | Backend | Add multer dependency | +1 |
| `ComposerPage.jsx` | Frontend Page | Row buttons, selection, tabs | +20 |
| `ImageBlockEditor.jsx` | Frontend Component (NEW) | Image upload & editing | 120 |
| `EditorPanel.jsx` | Frontend Component (NEW) | Block-specific editors | 150 |
| `RowBlock.jsx` | Frontend Component (NEW) | Row container rendering | 130 |

**Total**: ~4 new files, ~12 modified files, ~620 lines added

