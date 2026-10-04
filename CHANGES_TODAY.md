# Changes Made Today

## Website

- Enlarged the shared header and footer logos and adjusted the header layout for the larger mark.
- Added TikTok and X links to the shared footer. X continues to support `VITE_SOCIAL_TWITTER`, with the supplied account URL as its default.
- Replaced the homepage's duplicate strategic-pillar list with a large 1-to-9 counter card linking to `/about#pillars`. The counter advances quickly, pauses at nine for 10 seconds, then repeats; the hero metric now reports nine pillars.
- Expanded visible `DPO Conference` brand wording to `Data Protection Officers Conference`, including text returned through the shared CMS section accessor.
- Updated the homepage conference section with a Coming Soon state, a conference overview, and links to read more and view all conferences. Registration remains disabled until dates are announced; published conference data continues to come from the backend.
- Added the supplied conference image to the spotlight's right column, stretched to match the text column and scaled to show the complete image.
- Added a `/conference` Coming Soon page with a What to Expect section for when no conference has been published.
- Removed the seminar preview from the homepage. The separate Training page remains available.

## Build And Development

- Generated and refreshed the static upload package in `upload-ready-dev/`, including the Apache SPA fallback, favicon, logo, and bundled app assets. Generated upload folders and ZIP variants are ignored by Git.
- Embedded the configured API base, `https://backend-dpoconference.onrender.com/api/v1`, into the static bundle. No separate local development API URL was configured in this checkout.
- Excluded generated upload folders and ZIP archives from Vite's watcher to prevent Windows `EBUSY` file-watch errors, including duplicate archive names.
- Configured Git for the existing `main` branch and `origin` remote.

## Verification And Notes

- `npm run build` completed successfully.
- The local development site returned HTTP 200 after restarting Vite.
- Repository-wide ESLint reports extensive Prettier formatting errors; unrelated formatting was not changed.
- Newsletter submissions use `POST /public/newsletter`; the backend storage location could not be determined from this frontend repository.