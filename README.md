# Noah's Weather Service

A responsive static website for Manitoba weather alerts, ECCC observations, radar, independent outlooks, and weather media. The site is designed for GitHub Pages and does not bundle sample forecasts or alerts.

## Local preview

Serve this directory over HTTP (for example, `npx serve .`) and open the local address. The site uses the public Environment and Climate Change Canada / Meteorological Service of Canada GeoMet APIs for Winnipeg conditions, regional observations, and active Manitoba alerts. Some data products can be temporarily unavailable; the site reports that state rather than substituting sample data.

The radar image is served by MSC GeoMet. Attribution and official-source links are shown alongside live products. Official outlook graphics are linked directly to their source and are not edited.

## Bot status and administrator sign-in

The administrator dashboard is available at `?page=admin` and uses Firebase Authentication (email/password) and Cloud Firestore. The live status is shown on the Noah Storm Scan page and updates in connected browsers as soon as it is published.

1. In Firebase project `bot-website-6c156`, enable **Authentication → Email/Password** and create the administrator account `noahkonrad4@gmail.com`.
2. Create a Cloud Firestore database and enable the Firebase Storage bucket.
3. Apply [`firestore.rules`](./firestore.rules) in Firestore **Rules** and [`storage.rules`](./storage.rules) in Storage **Rules**. These allow public reads but restrict writes to the administrator email. If you change administrators, update both rules files and `adminEmails` in [`site-config.js`](./site-config.js).
4. The Firebase web app settings are in [`site-config.js`](./site-config.js). Firebase web config values are public; Firebase rules, not hidden client settings, protect publishing.
5. Open `?page=admin`, sign in, choose **Online**, **Maintenance**, or **Restarting**, optionally add a visitor-facing note, and select **Publish status**.

The initial status is intentionally unset until an administrator publishes one. Firebase Authentication accounts should be created in the Firebase console; this website does not provide public account registration.

## Publishing website content

The signed-in administrator dashboard publishes website content directly to Cloud Firestore. Public pages listen for changes and update without a download or redeployment. [`data/content.json`](./data/content.json) remains the initial fallback/seed content until the first Firestore content publish.

To publish or edit content:

1. Open `?page=admin`.
2. Sign in with the authorized Firebase administrator account.
3. Add or edit outlooks, ECCC links, weather updates, announcements, or video links.
4. Select the form's **Publish** button. Changes appear on the public site as soon as Firestore accepts them.

Outlook images are uploaded to Firebase Storage and their public URLs are saved with the published content.

Noah's outlooks and updates are published independently and must not be presented as official ECCC products. Add official products only as links to the original ECCC source, preserving their source attribution. Do not publish invented conditions or alerts.

## Data sources and coverage

- Current conditions, forecasts, active alerts, and the radar layer: [Environment and Climate Change Canada](https://weather.gc.ca/) and [MSC GeoMet](https://api.weather.gc.ca/).
- The live alert feed is retrieved over Manitoba's full geographic bounding box and filtered to ECCC's Manitoba province code, so neighbouring provinces are not displayed. Alert expiry times are respected; source and update timestamps are displayed in Central Time.
- Initial coverage is Manitoba. Other provinces are not advertised as currently covered.
- YouTube videos and Noah Storm Scan bot information link to their existing official sites.

The website's public data source is the [MSC GeoMet API](https://api.weather.gc.ca/). Its city-page weather collection is experimental; consult the linked ECCC forecast for authoritative, time-sensitive decisions.
