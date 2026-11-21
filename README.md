# Noah's Weather Service

A responsive static website for Manitoba weather alerts, ECCC observations, radar, independent outlooks, and weather media. The site is designed for GitHub Pages and does not bundle sample forecasts or alerts.

## Local preview

Serve this directory over HTTP (for example, `npx serve .`) and open the local address. The site uses the public Environment and Climate Change Canada / Meteorological Service of Canada GeoMet APIs for Winnipeg conditions, regional observations, and active Manitoba alerts. Some data products can be temporarily unavailable; the site reports that state rather than substituting sample data.

The radar image is served by MSC GeoMet. Attribution and official-source links are shown alongside live products. Official outlook graphics are linked directly to their source and are not edited.

## Publishing content

Content is stored in [`data/content.json`](./data/content.json). The administrator desk is available at `?page=admin` and publishes updates as commits to this repository using the GitHub Contents API. Uploads are stored under `content/uploads/`.

To enable administrator publishing:

1. In GitHub, create an OAuth App for the website's public URL and enable **Device Flow** for that app.
2. Set `githubOAuthClientId` in [`site-config.js`](./site-config.js) to the app's client ID. A client ID is public; do not put a client secret or personal access token in this file.
3. Set `adminUsers` to the exact GitHub usernames permitted to publish, for example `["trusted-maintainer"]`.
4. Ensure each approved account has write access to this repository and that the OAuth app permits the `public_repo` scope.
5. Deploy the site, open `?page=admin`, sign in to GitHub and approve the one-time device code.

The browser keeps the short-lived OAuth token in memory only. GitHub verifies repository write access for each publishing session; the allowlist is an additional UI restriction, not a substitute for repository permissions. Sign out or close the tab to discard the token. If the OAuth app is not configured, administrator publishing remains unavailable.

Noah's outlooks and updates are published independently and must not be presented as official ECCC products. Add official products only as links to the original ECCC source, preserving their source attribution. Do not publish invented conditions or alerts.

## Data sources and coverage

- Current conditions, forecasts, active alerts, and the radar layer: [Environment and Climate Change Canada](https://weather.gc.ca/) and [MSC GeoMet](https://api.weather.gc.ca/).
- The live alert feed is retrieved over Manitoba's full geographic bounding box and filtered to ECCC's Manitoba province code, so neighbouring provinces are not displayed. Alert expiry times are respected; source and update timestamps are displayed in Central Time.
- Initial coverage is Manitoba. Other provinces are not advertised as currently covered.
- YouTube videos and Noah Storm Scan bot information link to their existing official sites.

The website's public data source is the [MSC GeoMet API](https://api.weather.gc.ca/). Its city-page weather collection is experimental; consult the linked ECCC forecast for authoritative, time-sensitive decisions.
