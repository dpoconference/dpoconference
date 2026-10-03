# Changes Made Today

## Website

- Enlarged the shared header and footer logos and adjusted the header layout for the larger mark.
- Added TikTok and X links to the shared footer. X continues to support `VITE_SOCIAL_TWITTER`, with the supplied account URL as its default.
- Replaced the homepage's strategic-pillar card with the nine programme areas.
- Updated the homepage conference section with a Coming Soon state, a conference overview, and links to read more and view all conferences. Registration remains disabled until dates are announced; published conference data continues to come from the backend.
- Added a `/conference` Coming Soon page with a What to Expect section for when no conference has been published.
- Removed the seminar preview from the homepage. The separate Training page remains available.

## Build And Development

- Generated the static upload package in `upload-ready-dev/`, including the Apache SPA fallback, favicon, logo, and bundled app assets. The generated folder and `upload-ready-dev.zip` are ignored by Git.
- Embedded the configured API base, `https://backend-dpoconference.onrender.com/api/v1`, into the static bundle. No separate local development API URL was configured in this checkout.
- Excluded the generated upload folder and ZIP from Vite's watcher to prevent Windows `EBUSY` file-watch errors.
- Configured Git for the existing `main` branch and `origin` remote.

## Verification And Notes

- `npm run build` completed successfully.
- The local development site returned HTTP 200 after restarting Vite.
- Repository-wide ESLint reports extensive Prettier formatting errors; unrelated formatting was not changed.
- Newsletter submissions use `POST /public/newsletter`; the backend storage location could not be determined from this frontend repository.