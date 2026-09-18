# Resume source and reconstruction

The UAT resume uses the two-page `public/resume-assets/Rico_Garcia_Resume.pdf` supplied by Rico Garcia. Each page is US Letter, 612 × 792 points. Source SHA-256:

```text
c649f0a08fa826fe6577f1f2bbf85739a3272773aafb0edeff630f4816b40a50
```

The SVGs preserve the PDF's embedded font outlines, all 5,623 character placements (4,892 visible glyphs and 731 spaces), 92 graphics, colors, page dimensions, line wrapping, and spacing. They require no runtime font substitution. Only the full-page fill and 57 background grid paths on each page are removed so the existing site background remains visible. All 14 badge background fills are preserved.

`resume-vectors.json` exposes those same glyph paths and placements for animation. `definitions` holds glyph-local path data and bounds. `glyphs` holds the source character, page placement, font metadata, source color, and absolute bounds. `graphics` preserves the original path attributes, including the PDF-to-SVG Y-axis transform. `lines` preserves each source text group's content and glyph range. Bounds are `[minX, minY, maxX, maxY]`; glyph bounds use page coordinates, while graphic bounds precede their preserved transform.

To regenerate with Python 3, `pdfplumber`, and Poppler's `pdftocairo` available:

```bash
python3 scripts/extract_resume.py
```

The script defaults to the source PDF and output directory above. It creates original SVGs in a temporary directory and writes only the transparent page SVGs, animation JSON, and extraction summary to the output directory. Override paths when needed:

```bash
python3 scripts/extract_resume.py path/to/resume.pdf \
  --output-dir path/to/output \
  --pdftocairo /path/to/pdftocairo
```

Both source PDF pages and the extracted SVGs were rendered and visually inspected. All character counts and baselines were checked against PDF extraction; Cairo's character X coordinates differ by less than 0.012 point. Font-outline rounding and browser antialiasing can produce small rasterization differences from a PDF viewer. The page geometry and source content remain preserved.
