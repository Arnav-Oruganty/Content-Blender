# Content Blender - Feature Quick Start Guide

## Installation & Setup

### 1. Install Backend Dependencies
```bash
cd backend
npm install  # Installs new 'multer' package for file uploads
npm run dev  # Start backend on http://localhost:4000
```

### 2. Start Frontend
```bash
cd frontend
npm install  # No new dependencies needed
npm run dev  # Start on http://localhost:5173
```

### 3. Verify Setup
- Backend: Check console shows "✅ Content Blender API running on http://localhost:4000"
- Frontend: Opens http://localhost:5173 in your browser
- Uploads directory created: `/backend/storage/uploads/`

---

## Feature 1: Row Containers (Horizontal Layouts)

### Creating Rows

1. **In the Composer Canvas:**
   - Scroll down to the toolbar
   - Click **"+ Row (2 cols)"** to add a 2-column row
   - Click **"+ Row (3 cols)"** to add a 3-column row
   - Rows appear as highlighted containers in the canvas

### Adding Blocks to Rows

**Method 1: Click "+ Add to row"**
1. Inside a row, click the **"+ Add to row"** button
2. This adds an empty block to the row
3. Select the block and edit it in the Editor tab

**Method 2: Drag & Drop** (After row is created)
1. Drag a block from CBank
2. Drop it onto a row
3. Block is added to the row's children

### Configuring Rows

Each row has two controls at the bottom:

1. **Columns**: Select 1, 2, 3, or 4 columns
   - Blocks automatically resize to fit the column width
   - Responsive: On mobile, becomes 1 column

2. **Gap**: Select spacing between columns
   - Small (8px)
   - Medium (16px) - default
   - Large (24px)
   - XLarge (32px)

### Deleting from Rows

- Click the **✕** button on any block inside a row to remove just that block
- Click the **✕** on the row header to delete the entire row

### Example Layouts

**3-Column Feature Grid:**
1. Create a row with 3 columns
2. Add 3 cards/paragraphs to it
3. Set gap to "Large" for spacing

**2-Column Text + Image:**
1. Create a row with 2 columns
2. Add paragraph block to column 1
3. Add image block to column 2
4. Adjust gap and save

---

## Feature 2: Enhanced Image Blocks

### Method 1: Upload Image File

1. In the Composer Canvas, click **"Image"** block in CBank or add one to a row
2. Click the block to select it
3. Go to **"Editor"** tab in the right panel
4. Under "Image Source", select **"Upload"**
5. Click the dashed area to choose a file (or drag & drop)
6. Supported formats: JPG, PNG, GIF, WebP (max 10MB)
7. Image preview appears automatically

### Method 2: Link to External URL

1. Select an image block (or add one)
2. Go to **"Editor"** tab
3. Under "Image Source", select **"URL"**
4. Paste the image URL: `https://example.com/image.jpg`
5. Preview updates in real-time

### Adding Image Metadata

In the Editor tab (right panel), fill in:

1. **Alt Text** (Required for accessibility)
   - Describes the image for screen readers
   - Example: "Sarah presenting at the conference"

2. **Caption** (Optional)
   - Visible text below the image in HTML export
   - Example: "Sarah Johnson, CEO (Photo: Jan Smith)"

### Image Behavior

- **In Canvas**: Shows thumbnail and filename
- **In Preview Tab**: Displays actual image
- **In HTML Export**: Full HTML5 `<figure>` with `<figcaption>`
- **In XML**: Image metadata stored in nested `<metadata>` element

### Image in Rows

You can place image blocks in rows:
```
Row (2 columns)
├─ Image (left)
└─ Paragraph (right)
```

This creates responsive 2-column layouts!

---

## Workflow Example: Magazine Layout

### Goal
Create a 3-row article with:
1. Hero image + headline
2. 2-column section (text + sidebar)
3. Full-width conclusion

### Steps

1. **Row 1 - Hero**
   - Create a row with 1 column
   - Add: Hero block + Paragraph
   - Set hero as left column background

2. **Row 2 - Content**
   - Create a row with 2 columns
   - Column 1: Paragraph (article text)
   - Column 2: Image + Quote (sidebar)
   - Gap: "Large"

3. **Row 3 - Closing**
   - Create a row with 1 column
   - Add: Paragraph + Call-to-action

4. **Save & Export**
   - Click **"Save"** to store in database
   - Click **"Export HTML"** to download responsive HTML
   - Open in browser to see responsive layout

---

## Data Persistence

### Where Data is Stored

**CBank (Block Library)**
- File: `/backend/storage/cbank.xml`
- Database: MongoDB collection (if using mongo backend)

**CBlends (Documents)**
- Files: `/backend/storage/blends/blend-*.xml`
- Database: MongoDB collection (if using mongo backend)

**Uploaded Images**
- Directory: `/backend/storage/uploads/`
- Naming: `{uuid}.{extension}` (e.g., `abc123def456.jpg`)
- Reference in XML: `/uploads/abc123def456.jpg`

### Switching Storage Backends
```bash
# Edit backend/.env
STORAGE_BACKEND=file    # Default: XML files on disk
STORAGE_BACKEND=mongo   # Use MongoDB instead
```

No code changes needed! Same API works with both.

---

## Troubleshooting

### Issue: Row buttons not showing in toolbar
**Solution:**
- Make sure you're on the Composer page
- Scroll down to see the toolbar
- Check browser console for errors (F12 → Console tab)

### Issue: Can't upload image - "Upload failed" message
**Possible causes & fixes:**
- **File too large (>10MB)**: Compress image first
- **Wrong format**: Use JPG, PNG, GIF, or WebP only
- **Backend not running**: Check `npm run dev` in backend folder
- **Check backend logs**: Look for error messages in backend console

### Issue: Row blocks lose their children when saving
**Likely cause**: Browser cache issue
- Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
- Clear browser cache: DevTools → Application → Clear Storage

### Issue: Image doesn't show in HTML export
**Possible causes:**
- **Uploaded file path wrong**: Check that URL starts with `/uploads/`
- **Backend not serving uploads**: Verify `/backend/storage/uploads` is readable
- **Image deleted**: Re-upload the image
- **External URL broken**: Test URL in browser first

### Issue: Row children not rendering in exported HTML
**Solution:**
- Check "XML" tab to verify `<include>` elements are nested correctly
- If empty, re-add blocks to the row
- Make sure to **Save** before exporting

---

## Advanced Usage

### Creating Responsive Multi-Section Pages

**Page with Grid + Sidebar:**
```
Header (1 column, full-width)
Main Content Row (3 columns):
  ├─ Content (2 column span via narrower blocks)
  ├─ Sidebar (1 column)
Footer (1 column, full-width)
```

**Masonry-Style Layout:**
```
Row 1: 3 cards (3 columns)
Row 2: 2 images + 1 text (3 columns)
Row 3: Quote (1 column, centered)
```

### Bulk Image Updates

To update many images at once:
1. Export as XML
2. Find & replace URLs: `/uploads/old-server.com/` → `/uploads/new-server.com/`
3. Import the modified XML (if supported)

---

## API Reference (For Developers)

### Upload Image
```javascript
POST /api/upload/image
Content-Type: multipart/form-data

FormData {
  file: <File object>
}

Response:
{
  ok: true,
  data: {
    filename: "abc123def.jpg",
    path: "/uploads/abc123def.jpg",
    url: "/uploads/abc123def.jpg",
    size: 45200,
    mimetype: "image/jpeg"
  }
}
```

### Create Block with Image Metadata
```javascript
POST /api/cbank
Content-Type: application/json

{
  "type": "image",
  "name": "Hero Image",
  "sourceType": "local",
  "url": "/uploads/abc123.jpg",
  "altText": "Company building exterior",
  "caption": "Our headquarters in San Francisco"
}
```

### Create Blend with Row
```javascript
POST /api/cblend
Content-Type: application/json

{
  "meta": {
    "title": "Magazine Article",
    "layout": "custom"
  },
  "blocks": [
    {
      "type": "row",
      "columns": 2,
      "gap": "16px",
      "children": [
        {
          "type": "paragraph",
          "content": "Left column text"
        },
        {
          "type": "image",
          "url": "/uploads/image.jpg",
          "altText": "Image description"
        }
      ]
    }
  ]
}
```

---

## Performance Tips

### Image Optimization
- Upload images at web-friendly size (max 2000px width)
- Use compression tools like TinyPNG before uploading
- Formats ranked by quality: WebP > JPEG > PNG

### XML Payload Size
- Each row child adds ~200 bytes to XML
- Nested metadata adds ~100 bytes per image
- For 100+ blocks, file size ~50-100KB (acceptable)

### Database Performance (Mongo)
- Create index on `cblend.meta.title` for fast searching
- Archive old blends periodically (move to backup collection)

---

## FAQ

**Q: Can I nest rows inside rows?**
A: Not yet. Maximum nesting depth is 1 level (blocks inside rows). This is a future enhancement.

**Q: How do I make a 3-row layout with varying columns?**
A: Create 3 separate row blocks:
   - Row 1: 3 columns
   - Row 2: 2 columns
   - Row 3: 1 column (full-width)

**Q: Can I reuse the same image in multiple blocks?**
A: Yes! Upload once, then reference `/uploads/{filename}` in multiple image blocks.

**Q: What happens if I delete an uploaded image file directly?**
A: All blocks referencing that URL will show broken image. Always delete through UI or update URLs first.

**Q: How do I export as a mobile-responsive HTML file?**
A: Use **"Export HTML"** button. It includes `@media` queries that make rows stack on mobile (1 column).

---

## Getting Help

1. **Check the logs:**
   - Backend: `npm run dev` console output
   - Frontend: F12 → Console tab

2. **Review XML:**
   - Click **"XML"** tab in right panel
   - Verify block structure is correct
   - Look for nested `<include>` elements for rows

3. **Test endpoints:**
   ```bash
   # Check if backend is running
   curl http://localhost:4000/api/health
   
   # List all blocks
   curl http://localhost:4000/api/cbank
   ```

4. **Read implementation details:**
   - See `/IMPLEMENTATION_SUMMARY.md` for technical details
   - See `/PROJECT_EXPLANATION.md` for conceptual overview

---

## Summary

| Feature | Access | Icon | Notes |
|---------|--------|------|-------|
| Add Row (2 col) | Toolbar | + | Creates 2-column layout |
| Add Row (3 col) | Toolbar | + | Creates 3-column layout |
| Edit Block | Editor tab | ✎ | Select block first |
| Upload Image | Editor tab | ↑ | Max 10MB, drag-drop |
| Image URL | Editor tab | 🔗 | External URLs supported |
| Configure Row | Row header | ⚙ | Columns & gap controls |
| Remove from Row | Row child | ✕ | Removes single block |
| Save Document | Toolbar | 💾 | Persists to storage |
| Export HTML | Toolbar | ↓ | Responsive web page |

---

**Last Updated**: April 22, 2026
**Version**: 1.0 - Initial Release
