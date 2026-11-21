# Noah's Weather Service

A responsive static website for Manitoba weather alerts, ECCC observations, radar, independent outlooks, and weather media. The site is designed for GitHub Pages and does not bundle sample forecasts or alerts.

## Local preview

Serve this directory over HTTP (for example, `npx serve .`) and open the local address. The site uses the public Environment and Climate Change Canada / Meteorological Service of Canada GeoMet APIs for Winnipeg conditions, regional observations, and active Manitoba alerts. Some data products can be temporarily unavailable; the site reports that state rather than substituting sample data.

The radar image is served by MSC GeoMet. Attribution and official-source links are shown alongside live products. Official outlook graphics are linked directly to their source and are not edited.

## Publishing content

Content is stored in [`data/content.json`](./data/content.json). The local publisher desk is available at `?page=admin`, but it is not shown in the public navigation.

To publish content:

1. Open `?page=admin`.
2. Add or edit outlooks, ECCC links, weather updates, announcements, or video links.
3. Select **Download content.json**.
4. Replace [`data/content.json`](./data/content.json) in the repository with the downloaded file.
5. Commit and deploy the change.

The publisher desk does not request a GitHub login or OAuth credentials. It is a local content editor for site maintainers rather than an account-protected visitor system.

Noah's outlooks and updates are published independently and must not be presented as official ECCC products. Add official products only as links to the original ECCC source, preserving their source attribution. Do not publish invented conditions or alerts.

## Data sources and coverage

- Current conditions, forecasts, active alerts, and the radar layer: [Environment and Climate Change Canada](https://weather.gc.ca/) and [MSC GeoMet](https://api.weather.gc.ca/).
- The live alert feed is retrieved over Manitoba's full geographic bounding box and filtered to ECCC's Manitoba province code, so neighbouring provinces are not displayed. Alert expiry times are respected; source and update timestamps are displayed in Central Time.
- Initial coverage is Manitoba. Other provinces are not advertised as currently covered.
- YouTube videos and Noah Storm Scan bot information link to their existing official sites.

The website's public data source is the [MSC GeoMet API](https://api.weather.gc.ca/). Its city-page weather collection is experimental; consult the linked ECCC forecast for authoritative, time-sensitive decisions.
