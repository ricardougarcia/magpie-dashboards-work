# Media upload and GIF rendering findings

## Confirmed causes

The previous editor sent complete media files through the Next.js `/api/media` Vercel Function. Vercel documents a 4.5 MB request and response body limit for Functions and recommends direct-to-source uploads for larger payloads. Production observability confirmed HTTP 413 responses on `/api/media` during the reported upload attempts.

The existing GIFs are served directly from public Vercel Blob URLs with their original `image/gif` content type and are not routed through Next.js image optimization. Their intrinsic dimensions are small: 170×136, 148×152, and 162×166 pixels. The former fill-based preview could enlarge them by approximately 4.3× to 5.3×, which exposed source-resolution limits.

## Selected implementation

The editor requests a short-lived client upload token from the authenticated `/api/media` route, then uploads the file directly from the browser to the existing public Vercel Blob store. The route limits uploads to JPEG, PNG, WebP, GIF, MP4, and WebM files at 25 MB maximum. The editor stores optional intrinsic width and height metadata, shows upload progress and low-resolution GIF guidance, and renders GIFs with `object-fit: scale-down` so they are never enlarged.

## Official references

- Vercel, “How can I bypass the 4.5MB body size limit of Vercel Serverless Functions?”: https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions
- Vercel Blob, “Client Uploads”: https://vercel.com/docs/vercel-blob/client-upload
- Vercel, “Best practices for hosting videos on Vercel and Next.js”: https://vercel.com/kb/guide/best-practices-for-hosting-videos-on-vercel-nextjs-mp4-gif
- Next.js Image, `unoptimized`: https://nextjs.org/docs/app/api-reference/components/image#unoptimized
