(() => {
  "use strict";

  const API_ROOT = "https://api.weather.gc.ca/collections";
  const ECCC_HOME = "https://weather.gc.ca/";
  const YOUTUBE_CHANNEL = "https://www.youtube.com/@NoahsWeatherAlertTeam";
  const YOUTUBE_UPLOADS = "https://www.youtube.com/embed/videoseries?list=UUYaw0b7ezQL4vHC4Y6k3xqA";
  const BOT_SITE = "https://noah-s-weather-alerting-team.github.io/botinvite/";
  const NAV_ITEMS = [
    ["home", "Home"],
    ["alerts", "Weather Alerts"],
    ["outlooks", "Outlooks"],
    ["maps", "Weather Maps"],
    ["media", "Media"],
    ["about", "About"],
    ["bot", "Noah Storm Scan"]
  ];
  const EMPTY_CONTENT = {
    noahsOutlooks: [],
    ecccOutlooks: [],
    updates: [],
    announcements: [],
    media: []
  };
  const config = window.NOAH_WEATHER_CONFIG || {};
  const main = document.querySelector("#main-content");
  let content = structuredClone(EMPTY_CONTENT);
  let adminToken = "";
  let adminLogin = "";

  const esc = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const page = new URLSearchParams(location.search).get("page") || "home";
  const textValue = (obj) => obj?.en ?? obj?.value?.en ?? null;
  const localTime = (value, options = {}) => {
    if (!value) return "Not provided";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return esc(value);
    const timeZoneName = Object.hasOwn(options, "timeZoneName") ? options.timeZoneName : "short";
    const additionalOptions = { ...options };
    delete additionalOptions.timeZoneName;
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
      timeZone: "America/Winnipeg",
      ...additionalOptions, ...(timeZoneName ? { timeZoneName } : {})
    }).format(date);
  };
  const isoNowForInput = () => {
    const date = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    return date.toISOString().slice(0, 16);
  };
  const dateForInput = (value) => {
    const date = new Date(value || "");
    if (Number.isNaN(date.getTime())) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };
  const safeHttpUrl = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  };
  const safeEcccUrl = (value) => {
    const url = safeHttpUrl(value);
    if (!url) return "";
    const hostname = new URL(url).hostname.toLowerCase();
    return ["weather.gc.ca", "api.weather.gc.ca", "geo.weather.gc.ca", "ec.gc.ca", "canada.ca", "www.canada.ca"].includes(hostname) ? url : "";
  };
  const formatWind = (wind) => {
    const speed = textValue(wind?.speed);
    const direction = textValue(wind?.direction);
    if (speed == null) return "Not reported";
    return `${speed} km/h${direction ? ` ${direction}` : ""}`;
  };
  const fetchJson = async (url, options) => {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
  };
  const getContent = async () => {
    try {
      const loaded = await fetchJson("./data/content.json", { cache: "no-store" });
      content = { ...structuredClone(EMPTY_CONTENT), ...loaded };
      for (const key of Object.keys(EMPTY_CONTENT)) {
        if (!Array.isArray(content[key])) content[key] = [];
      }
    } catch (error) {
      console.error("Could not load published site content.", error);
      contentLoadError = true;
    }
  };
  let contentLoadError = false;

  function renderHeader() {
    document.querySelector("#site-header").innerHTML = `
      <div class="topline"><div class="shell topline-inner">
        <span><span class="live-dot"></span> WEATHER DESK <span class="topline-divider">/</span> MANITOBA, CANADA</span>
        <span class="topline-date">${esc(new Intl.DateTimeFormat("en-CA", {
          dateStyle: "full", timeZone: "America/Winnipeg"
        }).format(new Date()))}</span>
      </div></div>
      <header class="site-header"><div class="shell nav-wrap">
        <a class="brand" href="./" aria-label="Noah's Weather Service home">
          <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 52 52">
            <path d="M7 32a19 19 0 0 1 38 0" fill="none" stroke="currentColor" stroke-width="3"/>
            <path d="M12 32a14 14 0 0 1 28 0" fill="none" stroke="currentColor" stroke-width="2"/>
            <path d="M26 8v8M10 15l5 5m27-5-5 5M8 37h36" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2.5"/>
            <circle cx="26" cy="32" r="3.5" fill="#ff6b65"/>
          </svg></span>
          <span class="brand-copy"><strong>NOAH'S</strong><span>WEATHER SERVICE</span></span>
        </a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">
          <span></span><span></span><span class="sr-only">Open navigation menu</span>
        </button>
        <nav class="primary-nav" id="primary-nav" aria-label="Main navigation">
          ${NAV_ITEMS.map(([id, label]) => `<a href="${id === "home" ? "./" : `?page=${id}`}" class="${page === id ? "active" : ""}"${page === id ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
        </nav>
      </div></header>`;
    const toggle = document.querySelector(".menu-toggle");
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      toggle.querySelector(".sr-only").textContent = open ? "Close navigation menu" : "Open navigation menu";
      document.querySelector(".primary-nav").classList.toggle("open", open);
    });
  }

  function renderFooter() {
    document.querySelector("#site-footer").innerHTML = `
      <footer class="site-footer"><div class="shell footer-grid">
        <div class="footer-brand">
          <a class="brand brand-footer" href="./">
            <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 52 52">
              <path d="M7 32a19 19 0 0 1 38 0M12 32a14 14 0 0 1 28 0" fill="none" stroke="currentColor" stroke-width="3"/>
              <path d="M26 8v8M8 37h36" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2.5"/>
              <circle cx="26" cy="32" r="3.5" fill="#ff6b65"/>
            </svg></span>
            <span class="brand-copy"><strong>NOAH'S</strong><span>WEATHER SERVICE</span></span>
          </a>
          <p>Weather information and monitoring, with Manitoba as our starting point.</p>
        </div>
        <div><h2>Explore</h2><ul class="footer-links">
          ${NAV_ITEMS.map(([id, label]) => `<li><a href="${id === "home" ? "./" : `?page=${id}`}">${label}</a></li>`).join("")}
        </ul></div>
        <div><h2>Official sources</h2><ul class="footer-links">
          <li><a href="${ECCC_HOME}" target="_blank" rel="noopener noreferrer">Environment and Climate Change Canada</a></li>
          <li><a href="https://api.weather.gc.ca/" target="_blank" rel="noopener noreferrer">MSC GeoMet open data</a></li>
          <li><a href="${YOUTUBE_CHANNEL}" target="_blank" rel="noopener noreferrer">YouTube channel</a></li>
          <li><a href="${BOT_SITE}" target="_blank" rel="noopener noreferrer">Noah Storm Scan</a></li>
        </ul></div>
      </div><div class="shell footer-bottom">
        <span>Weather data is provided by Environment and Climate Change Canada. Source and update times are shown with each product.</span>
        <span>© ${new Date().getFullYear()} Noah's Weather Service</span>
      </div></footer>`;
  }

  function pageTitle(eyebrow, title, description) {
    return `<section class="page-heading shell"><span class="eyebrow">${eyebrow}</span>
      <h1>${title}</h1><p>${description}</p></section>`;
  }

  function alertKind(alert) {
    const type = `${alert.alert_type || alert.kind || ""} ${alert.alert_name_en || ""} ${alert.alert_short_name_en || ""}`.toLowerCase();
    if (type.includes("warning")) return ["warning", "Warning"];
    if (type.includes("watch")) return ["watch", "Watch"];
    if (type.includes("advisory")) return ["advisory", "Advisory"];
    return ["statement", alert.alert_name_en || "Statement"];
  }

  function renderAlertCard(feature, compact = false) {
    const alert = feature.properties || {};
    const [kind, label] = alertKind(alert);
    const area = alert.feature_name_en || alert.name_en || alert.province || "Manitoba area";
    return `<article class="alert-card alert-${kind}">
      <div class="alert-card-top"><span class="alert-type"><span class="alert-symbol" aria-hidden="true"></span>${esc(label)}</span><span class="source-tag">ECCC OFFICIAL</span></div>
      <h3>${esc(alert.alert_short_name_en || alert.alert_name_en || "Weather alert")}</h3>
      <p class="alert-area">${esc(area)}</p>
      <div class="alert-meta"><span>Issued ${esc(localTime(alert.publication_datetime))}</span>
        <span>Expires ${esc(localTime(alert.expiration_datetime))}</span></div>
      ${compact ? `<p class="alert-copy">${esc(alert.alert_text_en || "No additional description provided.")}</p>` : `<details class="alert-details">
        <summary>Read full alert</summary><p>${esc(alert.alert_text_en || "No additional description provided.").replace(/\n/g, "<br>")}</p></details>`}
      <a class="text-link" href="${ECCC_HOME}" target="_blank" rel="noopener noreferrer">View official ECCC weather information <span aria-hidden="true">↗</span></a>
    </article>`;
  }

  function renderIndependentUpdate(item, compact = false) {
    const [kind, label] = alertKind(item);
    return `<article class="alert-card alert-${kind}">
      <div class="alert-card-top"><span class="alert-type"><span class="alert-symbol" aria-hidden="true"></span>${esc(label)}</span><span class="source-tag source-independent">NOAH'S WEATHER SERVICE</span></div>
      <h3>${esc(item.title || "Weather update")}</h3>
      <p class="alert-area">${esc(item.area || "Manitoba")}</p>
      <div class="alert-meta"><span>Issued ${esc(localTime(item.issuedAt))}</span><span>Expires ${esc(localTime(item.expiresAt))}</span></div>
      <p class="alert-copy">${esc(item.body || "").replace(/\n/g, "<br>")}</p>
      ${compact ? "" : `<p class="independent-disclaimer">Independent Noah's Weather Service update · Not an official ECCC alert.</p>`}
    </article>`;
  }

  function renderIndependentUpdates(compact = false) {
    const now = Date.now();
    const updates = content.updates.filter((item) => {
      const expiry = Date.parse(item.expiresAt || "");
      return !Number.isFinite(expiry) || expiry > now;
    }).slice().sort((a, b) => Date.parse(b.issuedAt || 0) - Date.parse(a.issuedAt || 0));
    if (!updates.length) {
      return `<div class="empty-state empty-compact"><h3>No independent weather updates published</h3><p>There are no Noah's Weather Service alerts or updates to display.</p></div>`;
    }
    return `<div class="${compact ? "alert-list" : "update-list"}">${updates.map((item) => renderIndependentUpdate(item, compact)).join("")}</div>`;
  }

  async function loadAlerts(target, options = {}) {
    const container = document.querySelector(target);
    if (!container) return;
    try {
      const url = `${API_ROOT}/weather-alerts/items?f=json&lang=en&limit=100&bbox=-102,49,-88,60`;
      const result = await fetchJson(url);
      const now = Date.now();
      const alerts = (result.features || []).filter(({ properties = {} }) => {
        const expiry = Date.parse(properties.expiration_datetime || "");
        const issued = Date.parse(properties.publication_datetime || "");
        return properties.province === "MB"
          && (!Number.isFinite(expiry) || expiry > now)
          && (!Number.isFinite(issued) || issued <= now);
      });
      const updated = localTime(result.timeStamp || new Date().toISOString());
      const status = alerts.length
        ? `<span class="status-pill status-alert"><span class="status-dot"></span>${alerts.length} active ECCC alert${alerts.length === 1 ? "" : "s"}</span>`
        : `<span class="status-pill status-clear"><span class="status-dot"></span>No active ECCC alerts</span>`;
      if (options.full) {
        container.innerHTML = `${status}<p class="data-timestamp">ECCC alert feed checked ${esc(updated)}. Regions within Manitoba are covered.</p>
          ${alerts.length ? `<div class="alert-list">${alerts.map((feature) => renderAlertCard(feature)).join("")}</div>` : `<div class="empty-state"><span class="empty-icon">✓</span><h3>No active official alerts</h3><p>The ECCC feed currently reports no active alerts for the Manitoba coverage area. Conditions can change; consult the official source for urgent decisions.</p><a class="button button-outline" href="${ECCC_HOME}" target="_blank" rel="noopener noreferrer">Check ECCC weather</a></div>`}
          <div class="independent-alerts"><div class="independent-heading"><span class="source-tag source-independent">INDEPENDENT SOURCE</span><h2>Noah's Weather Service updates</h2><p>These updates are published independently and are not official ECCC alerts.</p></div>${renderIndependentUpdates(true)}</div>`;
      } else {
        container.innerHTML = `${status}<p class="data-timestamp">ECCC feed · checked ${esc(updated)}</p>
          ${alerts.length ? alerts.slice(0, 2).map((feature) => renderAlertCard(feature, true)).join("") : `<p class="inline-note">No active ECCC alerts are currently reported for Manitoba.</p>`}
          <div class="independent-alerts independent-alerts-compact"><div class="independent-heading"><span class="source-tag source-independent">NOAH'S WEATHER SERVICE</span><h3>Independent updates</h3></div>${renderIndependentUpdates(true)}</div>
          <a class="text-link" href="?page=alerts">View alert desk <span aria-hidden="true">→</span></a>`;
      }
    } catch (error) {
      console.error("ECCC alert feed could not be loaded.", error);
      container.innerHTML = `<div class="unavailable"><strong>Official alert feed unavailable</strong><p>We could not retrieve current ECCC alerts. No alert status is being assumed. Try again or check the official source.</p><a class="text-link" href="${ECCC_HOME}" target="_blank" rel="noopener noreferrer">Go to ECCC weather <span aria-hidden="true">↗</span></a></div>
        ${options.full ? "" : `<div class="independent-alerts independent-alerts-compact"><div class="independent-heading"><span class="source-tag source-independent">NOAH'S WEATHER SERVICE</span><h3>Independent updates</h3></div>${renderIndependentUpdates(true)}</div>`}`;
    }
  }

  async function getCity(name) {
    const url = `${API_ROOT}/citypageweather-realtime/items?f=json&lang=en&limit=1&name.en=${encodeURIComponent(name)}`;
    const result = await fetchJson(url);
    return result.features?.[0]?.properties || null;
  }

  function forecastSummary(city) {
    return city?.forecastGroup?.forecasts?.slice(0, 4) || [];
  }

  function weatherPanel(city) {
    if (!city) return `<div class="unavailable"><strong>Current conditions unavailable</strong><p>We could not retrieve current observations from ECCC.</p><a href="${ECCC_HOME}" target="_blank" rel="noopener noreferrer">Check Environment Canada</a></div>`;
    const current = city.currentConditions || {};
    const temp = textValue(current.temperature);
    const icon = safeHttpUrl(current.iconCode?.url || "");
    const forecast = forecastSummary(city);
    return `<div class="current-weather">
      <div class="weather-main">
        ${icon ? `<img class="weather-icon" src="${esc(icon)}" alt="" width="68" height="68">` : ""}
        <div><span class="weather-location">${esc(city.name?.en || "Manitoba")}</span>
          <div class="temperature">${temp == null ? "—" : `${esc(temp)}°`}<span>C</span></div>
          <p>${esc(textValue(current.condition) || "Condition not reported")}</p></div>
      </div>
      <div class="weather-metrics">
        <div><span>Wind</span><strong>${esc(formatWind(current.wind))}</strong></div>
        <div><span>Humidity</span><strong>${textValue(current.relativeHumidity) == null ? "—" : `${esc(textValue(current.relativeHumidity))}%`}</strong></div>
        <div><span>Observed</span><strong>${esc(localTime(textValue(current.timestamp)))}</strong></div>
      </div>
      ${forecast.length ? `<div class="forecast-strip">${forecast.map((item) => `<div class="forecast-day">
        <span>${esc(textValue(item.period?.textForecastName) || "Forecast")}</span>
        <strong>${esc(item.temperatures?.temperature?.map((t) => `${t.value?.en ?? t.value}°`).join(" / ") || "—")}</strong>
        <p>${esc(textValue(item.abbreviatedForecast?.textSummary) || textValue(item.textSummary) || "")}</p>
      </div>`).join("")}</div>` : ""}
      <div class="weather-source">Source: Environment and Climate Change Canada · Updated ${esc(localTime(city.lastUpdated))}
        <a href="${safeHttpUrl(city.url?.en) || ECCC_HOME}" target="_blank" rel="noopener noreferrer">Full forecast ↗</a></div>
    </div>`;
  }

  async function loadWeather(target) {
    const container = document.querySelector(target);
    if (!container) return;
    container.innerHTML = `<div class="loading-state"><span class="loader"></span>Loading current ECCC observations…</div>`;
    try {
      const city = await getCity("Winnipeg");
      container.innerHTML = weatherPanel(city);
    } catch (error) {
      console.error("ECCC Winnipeg weather could not be loaded.", error);
      container.innerHTML = weatherPanel(null);
    }
  }

  function renderOutlookCard(item, official = false) {
    const sourceUrl = official ? safeEcccUrl(item.sourceUrl) : "";
    const graphicUrl = official ? safeEcccUrl(item.graphic) : safeHttpUrl(item.graphic);
    const href = official ? sourceUrl : graphicUrl;
    const title = esc(item.title || (official ? "ECCC outlook" : "Noah's outlook"));
    return `<article class="outlook-card ${official ? "outlook-official" : ""}">
      ${href && !official && item.graphic ? `<a class="outlook-image" href="${esc(href)}" target="_blank" rel="noopener noreferrer"><img src="${esc(href)}" alt="${title} outlook graphic" loading="lazy"></a>` : ""}
      ${official && graphicUrl ? `<a class="outlook-image" href="${esc(graphicUrl)}" target="_blank" rel="noopener noreferrer"><img src="${esc(graphicUrl)}" alt="${title} original ECCC graphic" loading="lazy"></a>` : ""}
      <div class="outlook-body">
        <div class="outlook-card-top"><span class="source-tag ${official ? "" : "source-independent"}">${official ? "ECCC OFFICIAL" : "NOAH'S WEATHER SERVICE"}</span>
          ${item.risk ? `<span class="risk-label">${esc(item.risk)}</span>` : ""}</div>
        <h3>${title}</h3>
        <p class="outlook-area">${esc(item.area || "Manitoba")}${item.validPeriod ? ` · ${esc(item.validPeriod)}` : ""}</p>
        <p>${esc(item.discussion || item.description || "No written discussion was provided.")}</p>
        ${item.riskDescription ? `<p class="risk-description">${esc(item.riskDescription)}</p>` : ""}
        <div class="outlook-meta">Published ${esc(localTime(item.issuedAt || item.publishedAt))}</div>
        ${official && sourceUrl ? `<a class="text-link" href="${esc(sourceUrl)}" target="_blank" rel="noopener noreferrer">View original ECCC product ↗</a>` : ""}
      </div>
    </article>`;
  }

  function outlookGroup(items, official = false) {
    if (!items.length) return `<div class="empty-state empty-compact"><h3>No ${official ? "ECCC" : "Noah's Weather Service"} outlooks published</h3>
      <p>${official ? "Official products will appear here when an ECCC outlook is available. See the official forecast and alerts for current information." : "Independent outlooks will appear here when published. No placeholder forecasts are shown."}</p>
      ${official ? `<a class="text-link" href="${ECCC_HOME}" target="_blank" rel="noopener noreferrer">Official ECCC weather products ↗</a>` : ""}</div>`;
    return `<div class="outlook-grid">${items.slice().sort((a, b) => Date.parse(b.issuedAt || b.publishedAt || 0) - Date.parse(a.issuedAt || a.publishedAt || 0)).map((item) => renderOutlookCard(item, official)).join("")}</div>`;
  }

  function youtubeId(value) {
    try {
      const url = new URL(value);
      let id = "";
      if (["youtu.be", "www.youtu.be"].includes(url.hostname)) id = url.pathname.slice(1);
      if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) {
        id = url.searchParams.get("v") || url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1] || "";
      }
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
    } catch { return ""; }
  }

  function mediaCard(item) {
    const id = youtubeId(item.url || "");
    const href = safeHttpUrl(item.url);
    const thumbnail = id ? `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg` : safeHttpUrl(item.thumbnail || "");
    return `<article class="media-card">
      <a class="media-thumb" href="${esc(href || YOUTUBE_CHANNEL)}" target="_blank" rel="noopener noreferrer">
        ${thumbnail ? `<img src="${esc(thumbnail)}" alt="" loading="lazy">` : `<span class="thumb-placeholder">NWS <span>▶</span></span>`}
        <span class="play-badge" aria-hidden="true">▶</span>
      </a>
      <div class="media-card-body"><span class="eyebrow">${esc(item.category || "Weather update")}</span>
        <h3><a href="${esc(href || YOUTUBE_CHANNEL)}" target="_blank" rel="noopener noreferrer">${esc(item.title || "Watch on YouTube")}</a></h3>
        <p>${esc(item.publishedAt ? localTime(item.publishedAt, { timeZoneName: undefined }) : "No publication date provided")}</p>
      </div>
    </article>`;
  }

  function renderVideoFeed(limit) {
    const videos = content.media.slice().sort((a, b) => Date.parse(b.publishedAt || 0) - Date.parse(a.publishedAt || 0));
    if (videos.length) {
      const featured = videos[0];
      const id = youtubeId(featured.url || "");
      if (!id) return `<div class="media-grid">${videos.slice(0, limit).map(mediaCard).join("")}</div>`;
      return `<div class="youtube-feature"><div class="youtube-player"><iframe src="https://www.youtube.com/embed/${encodeURIComponent(id)}" title="${esc(featured.title || "Noah's Weather Alert Team video")}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
        <div class="youtube-copy"><span class="source-tag">${esc(featured.category || "WEATHER VIDEO")}</span><h3>${esc(featured.title)}</h3>
          <p>Published ${esc(localTime(featured.publishedAt))}. Watch this video on the official Noah's Weather Alert Team channel.</p>
          <a class="button button-light" href="${esc(safeHttpUrl(featured.url))}" target="_blank" rel="noopener noreferrer">Watch on YouTube <span aria-hidden="true">↗</span></a>
        </div></div>${videos.length > 1 ? `<div class="media-archive-grid">${videos.slice(1, limit).map(mediaCard).join("")}</div>` : ""}`;
    }
    return `<div class="youtube-feature">
      <div class="youtube-player"><iframe src="${YOUTUBE_UPLOADS}" title="Latest Noah's Weather Alert Team YouTube videos" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
      <div class="youtube-copy"><span class="source-tag">OFFICIAL CHANNEL</span><h3>Weather coverage, from the field to the forecast</h3>
        <p>Watch the latest uploads and browse the full video archive on the Noah's Weather Alert Team YouTube channel.</p>
        <a class="button button-light" href="${YOUTUBE_CHANNEL}/videos" target="_blank" rel="noopener noreferrer">Visit the YouTube channel <span aria-hidden="true">↗</span></a>
      </div>
    </div>`;
  }

  function renderHome() {
    main.innerHTML = `
      <section class="hero"><div class="hero-atmosphere" aria-hidden="true"><div class="radar-rings"></div><div class="radar-sweep"></div><span class="map-label label-one">MANITOBA</span><span class="map-label label-two">WINNIPEG</span><span class="map-cross">+</span></div>
        <div class="shell hero-content"><span class="eyebrow eyebrow-light"><span class="live-dot"></span> WEATHER INTELLIGENCE · MANITOBA</span>
          <h1>Weather information.<br><span>Built for where you are.</span></h1>
          <p>Independent weather outlooks, official Canadian alerts and real-time monitoring for Manitoba.</p>
          <div class="hero-actions"><a class="button button-light" href="?page=alerts">Explore weather alerts <span aria-hidden="true">→</span></a><a class="button button-ghost" href="?page=maps">Open weather monitoring</a></div>
          <div class="hero-region"><span class="region-mark">MB</span><span>ON THE GROUND IN MANITOBA</span><span class="region-line"></span><span>INITIAL REGION</span></div>
        </div><div class="hero-bottom"><div class="shell hero-bottom-inner"><span>FORECASTING</span><i></i><span>ALERTS</span><i></i><span>MONITORING</span><i></i><span>WEATHER MEDIA</span></div></div>
      </section>
      ${content.announcements.length ? `<section class="announcement-band"><div class="shell announcement-inner"><span class="announcement-label">SERVICE UPDATE</span><div>${content.announcements.slice(0, 2).map((item) => `<p><strong>${esc(item.title)}</strong> ${esc(item.body)}</p>`).join("")}</div></div></section>` : ""}
      <section class="section shell"><div class="section-heading"><div><span class="eyebrow">LOCAL CONDITIONS</span><h2>Manitoba, right now</h2><p>Current observations and forecast from Environment and Climate Change Canada.</p></div><a class="text-link" href="?page=maps">View monitoring desk <span aria-hidden="true">→</span></a></div>
        <div id="home-weather" class="weather-panel"></div></section>
      <section class="section section-dark"><div class="shell"><div class="section-heading"><div><span class="eyebrow eyebrow-light">OFFICIAL ALERTS</span><h2>Know when conditions change.</h2><p>Live severe weather information from Canada's official meteorological service.</p></div><a class="button button-outline-light" href="?page=alerts">Go to alert desk <span aria-hidden="true">→</span></a></div>
        <div id="home-alerts" class="home-alerts"><div class="loading-state"><span class="loader"></span>Checking official ECCC alerts…</div></div></div></section>
      <section class="section shell"><div class="section-heading"><div><span class="eyebrow">FORECAST PERSPECTIVES</span><h2>Weather outlooks</h2><p>Independent outlooks and links to official Canadian products, clearly attributed.</p></div><a class="text-link" href="?page=outlooks">All outlooks <span aria-hidden="true">→</span></a></div>
        <div class="dual-outlooks"><div><div class="subsection-title"><span class="source-mark source-mark-noah">N</span><h3>Noah's Weather Service</h3></div>${outlookGroup(content.noahsOutlooks)}</div>
        <div><div class="subsection-title"><span class="source-mark source-mark-eccc">E</span><h3>Environment Canada</h3></div>${outlookGroup(content.ecccOutlooks, true)}</div></div></section>
      <section class="section section-media"><div class="shell"><div class="section-heading"><div><span class="eyebrow">WEATHER MEDIA</span><h2>Coverage beyond the forecast.</h2><p>Weather updates and video coverage from our official YouTube channel.</p></div><a class="text-link" href="?page=media">Explore media <span aria-hidden="true">→</span></a></div>${renderVideoFeed(3)}</div></section>
      <section class="section shell"><div class="bot-banner"><div class="bot-icon" aria-hidden="true">⌁</div><div><span class="eyebrow eyebrow-light">WEATHER ALERTS FOR YOUR COMMUNITY</span><h2>Meet Noah Storm Scan.</h2><p>Bring weather alert notifications for monitored locations directly into your Discord server.</p></div><a class="button button-light" href="${BOT_SITE}" target="_blank" rel="noopener noreferrer">About &amp; Invite the Bot <span aria-hidden="true">↗</span></a></div></section>
      ${contentLoadError ? `<div class="shell"><p class="notice-inline">Published site content could not be loaded. Live data sections remain independent.</p></div>` : ""}`;
    loadWeather("#home-weather");
    loadAlerts("#home-alerts");
  }

  function renderAlertsPage() {
    main.innerHTML = `${pageTitle("LIVE ALERT DESK / MANITOBA", "Weather alerts", "Official Environment and Climate Change Canada alerts for Manitoba, alongside any updates published by Noah's Weather Service.")}
      <section class="section shell alert-desk"><div class="alert-source-heading"><div><span class="source-tag">OFFICIAL SOURCE</span><h2>Environment and Climate Change Canada</h2><p>Live alerts are retrieved directly from the MSC GeoMet public weather-alert feed.</p></div><a class="button button-outline" href="${ECCC_HOME}" target="_blank" rel="noopener noreferrer">Official ECCC weather ↗</a></div>
        <div id="alerts-live"><div class="loading-state"><span class="loader"></span>Retrieving Manitoba alert feed…</div></div>
        <div class="severity-legend"><span>Alert levels</span><i class="legend-warning"></i> Warning <i class="legend-watch"></i> Watch <i class="legend-advisory"></i> Advisory <i class="legend-statement"></i> Statement</div></section>
      <section class="section section-dark"><div class="shell"><div class="section-heading"><div><span class="eyebrow eyebrow-light">INDEPENDENT UPDATES</span><h2>Noah's Weather Service alerts</h2><p>Independent weather updates are distinct from official ECCC alerts.</p></div></div>
        ${renderIndependentUpdates()}</div></section>`;
    loadAlerts("#alerts-live", { full: true });
  }

  function renderOutlooksPage() {
    main.innerHTML = `${pageTitle("FORECAST DESK / MANITOBA", "Weather outlooks", "Compare independent outlooks from Noah's Weather Service with official Environment and Climate Change Canada products. Each source is clearly identified.")}
      <section class="section shell"><div class="outlook-section-heading"><div class="section-kicker"><span class="source-mark source-mark-noah">N</span><div><span class="eyebrow">INDEPENDENT ANALYSIS</span><h2>Noah's Weather Service outlooks</h2></div></div><p>Outlooks are published by Noah's Weather Service and are not official government forecasts.</p></div>
        ${outlookGroup(content.noahsOutlooks)}</section>
      <section class="section section-soft"><div class="shell"><div class="outlook-section-heading"><div class="section-kicker"><span class="source-mark source-mark-eccc">E</span><div><span class="eyebrow">OFFICIAL PRODUCTS</span><h2>Environment and Climate Change Canada</h2></div></div><p>Official products are shown as published and attributed to their original source. Follow the source link to verify the latest information.</p></div>
        ${outlookGroup(content.ecccOutlooks, true)}<div class="official-resource"><span>Official forecasts and active alerts</span><a class="button button-outline" href="${ECCC_HOME}" target="_blank" rel="noopener noreferrer">Visit Environment Canada ↗</a></div></div></section>`;
  }

  function renderMapPage() {
    const mapUrl = "https://geo.weather.gc.ca/geomet/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=RADAR_1KM_RRAI&STYLES=&CRS=EPSG:3857&BBOX=-11400000,6300000,-10300000,7600000&WIDTH=1200&HEIGHT=650&FORMAT=image/png";
    main.innerHTML = `${pageTitle("MONITORING DESK / MANITOBA", "Weather maps &amp; monitoring", "Live radar and observed conditions from Environment and Climate Change Canada. Every map and observation is attributed to its source.")}
      <section class="section shell"><div class="map-heading"><div><span class="eyebrow">PRECIPITATION RADAR</span><h2>Manitoba radar</h2><p>Canadian weather radar composite · MSC GeoMet</p></div><span class="status-pill status-source"><span class="status-dot"></span>LIVE DATA SOURCE</span></div>
        <figure class="radar-map"><img src="${mapUrl}" alt="Environment and Climate Change Canada composite precipitation radar covering Manitoba" loading="eager"><figcaption><span>Radar composite · Environment and Climate Change Canada<br><span id="radar-status">Retrieving current source image…</span></span><a href="${ECCC_HOME}" target="_blank" rel="noopener noreferrer">Open official weather map ↗</a></figcaption></figure>
        <p class="map-disclaimer">Radar imagery may be delayed or temporarily unavailable. For time-sensitive decisions, refer to official ECCC alerts and radar products.</p></section>
      <section class="section section-soft"><div class="shell"><div class="section-heading"><div><span class="eyebrow">REGIONAL OBSERVATIONS</span><h2>Across Manitoba</h2><p>Current city-page observations from ECCC. Values and timestamps are shown as supplied by the source.</p></div><span class="source-tag">ECCC · MSC GEOMET</span></div>
        <div id="regional-observations" class="observation-grid"><div class="loading-state"><span class="loader"></span>Loading regional observations…</div></div></div></section>
      <section class="section shell"><div class="section-heading"><div><span class="eyebrow">MORE WEATHER LAYERS</span><h2>Official monitoring resources</h2><p>Explore current satellite, storm and forecast products through ECCC.</p></div></div>
        <div class="resource-grid">
          <a class="resource-card" href="${ECCC_HOME}" target="_blank" rel="noopener noreferrer"><span class="resource-icon">◌</span><span class="eyebrow">ENVIRONMENT CANADA</span><h3>Satellite imagery</h3><p>Open the ECCC weather map to explore official satellite imagery.</p><span class="text-link">Explore ECCC maps ↗</span></a>
          <a class="resource-card" href="${ECCC_HOME}" target="_blank" rel="noopener noreferrer"><span class="resource-icon">⌁</span><span class="eyebrow">ENVIRONMENT CANADA</span><h3>Storm &amp; lightning information</h3><p>Consult official Canadian severe weather information and alerts.</p><span class="text-link">Explore ECCC weather ↗</span></a>
          <a class="resource-card" href="https://api.weather.gc.ca/" target="_blank" rel="noopener noreferrer"><span class="resource-icon">⌗</span><span class="eyebrow">MSC OPEN DATA</span><h3>Weather data services</h3><p>Discover the public GeoMet API and its available meteorological datasets.</p><span class="text-link">Browse GeoMet ↗</span></a>
        </div></section>`;
    const radarImage = document.querySelector(".radar-map img");
    const radarStatus = document.querySelector("#radar-status");
    const updateRadarStatus = () => {
      if (radarImage.naturalWidth) {
        radarStatus.textContent = `Image retrieved ${localTime(new Date().toISOString())} · source data may be delayed`;
      } else {
        radarImage.hidden = true;
        radarStatus.textContent = "Radar imagery is temporarily unavailable · check the official ECCC map";
      }
    };
    if (radarImage.complete) updateRadarStatus();
    else {
      radarImage.addEventListener("load", updateRadarStatus, { once: true });
      radarImage.addEventListener("error", updateRadarStatus, { once: true });
    }
    loadRegionalObservations();
  }

  async function loadRegionalObservations() {
    const container = document.querySelector("#regional-observations");
    if (!container) return;
    const cities = ["Winnipeg", "Brandon", "Thompson", "Churchill"];
    const results = await Promise.allSettled(cities.map(getCity));
    const available = results.flatMap((result) => result.status === "fulfilled" && result.value ? [result.value] : []);
    if (!available.length) {
      container.innerHTML = `<div class="unavailable"><strong>Regional observations unavailable</strong><p>Current conditions could not be retrieved from the ECCC city weather service.</p><a href="${ECCC_HOME}" target="_blank" rel="noopener noreferrer">Check Environment Canada ↗</a></div>`;
      return;
    }
    container.innerHTML = available.map((city) => {
      const current = city.currentConditions || {};
      const icon = safeHttpUrl(current.iconCode?.url || "");
      const temp = textValue(current.temperature);
      return `<article class="observation-card"><div class="observation-card-head"><span>${esc(city.region?.en || "MANITOBA")}</span>
        ${icon ? `<img src="${esc(icon)}" alt="" width="42" height="42" loading="lazy">` : ""}</div>
        <h3>${esc(city.name?.en || "Manitoba")}</h3><div class="observation-temp">${temp == null ? "—" : `${esc(temp)}°`}<span>C</span></div>
        <p>${esc(textValue(current.condition) || "Condition not reported")}</p>
        <div class="observation-details"><span>Wind</span><strong>${esc(formatWind(current.wind))}</strong><span>Humidity</span><strong>${textValue(current.relativeHumidity) == null ? "—" : `${esc(textValue(current.relativeHumidity))}%`}</strong></div>
        <p class="data-timestamp">Observed ${esc(localTime(textValue(current.timestamp)))}<br>Feed updated ${esc(localTime(city.lastUpdated))}</p>
        <a class="text-link" href="${safeHttpUrl(city.url?.en) || ECCC_HOME}" target="_blank" rel="noopener noreferrer">ECCC local forecast ↗</a></article>`;
    }).join("");
    if (available.length < cities.length) {
      container.insertAdjacentHTML("beforeend", `<p class="data-timestamp observation-note">Some city observations could not be loaded.</p>`);
    }
  }

  function renderMediaPage() {
    main.innerHTML = `${pageTitle("WEATHER MEDIA / VIDEO ARCHIVE", "Weather, in motion.", "Watch Noah's Weather Alert Team videos, explore published updates and visit the official channel for the full archive.")}
      <section class="section shell"><div class="channel-banner"><div><span class="eyebrow eyebrow-light">NOAH'S WEATHER ALERT TEAM</span><h2>The latest from our channel</h2><p>Browse recent forecasts, severe weather coverage, updates and educational videos.</p></div>
        <a class="button button-light" href="${YOUTUBE_CHANNEL}" target="_blank" rel="noopener noreferrer">Visit the YouTube channel ↗</a></div>
        <div class="media-feature">${renderVideoFeed(12)}</div>
        <div class="media-categories"><span class="category-chip">Forecasts</span><span class="category-chip">Severe weather coverage</span><span class="category-chip">Weather updates</span><span class="category-chip">Education</span></div>
        <div class="archive-note"><strong>Video archive</strong><p>Published video links are listed here when available. Browse the official channel for the complete and most current archive.</p><a class="text-link" href="${YOUTUBE_CHANNEL}/videos" target="_blank" rel="noopener noreferrer">Open YouTube video archive ↗</a></div></section>`;
  }

  function renderAboutPage() {
    main.innerHTML = `${pageTitle("ABOUT THE SERVICE", "Clear information for changing weather.", "Noah's Weather Service is an independent weather information and monitoring service, starting in Manitoba.")}
      <section class="section shell about-layout"><div class="about-main"><span class="eyebrow">OUR PURPOSE</span><h2>Weather information that helps people stay informed.</h2>
        <p>Noah's Weather Service brings together independent weather outlooks, official Canadian weather information, monitoring resources and weather-related media in one place.</p>
        <p>Our initial geographic focus is Manitoba. The service is structured to support future coverage in Saskatchewan, Alberta and other Canadian provinces as that coverage becomes available.</p>
        <p>Official alerts and observations are identified by source and linked to Environment and Climate Change Canada. Independent outlooks and updates are clearly distinguished from government products.</p>
        <p>Weather conditions can change quickly. Always consult official alerts and forecasts for time-sensitive decisions.</p></div>
        <aside class="about-aside"><span class="eyebrow eyebrow-light">COVERAGE AREA</span><div class="coverage-mark">MB<span>01 / 10 PROVINCES</span></div><h3>Manitoba first</h3><p>Our current geographic focus is Manitoba. Additional provincial coverage will be identified as it is introduced.</p><div class="coverage-rule"></div><span class="coverage-future">FUTURE EXPANSION</span><p>Saskatchewan · Alberta · Canada</p></aside></section>
      <section class="section section-soft"><div class="shell"><div class="section-heading"><div><span class="eyebrow">INDEPENDENT, WITH CLEAR SOURCES</span><h2>What you'll find here</h2></div></div>
        <div class="value-grid"><article><span>01</span><h3>Weather alerts</h3><p>Active ECCC alerts alongside separately identified Noah's Weather Service updates.</p></article>
        <article><span>02</span><h3>Outlooks</h3><p>Independent outlook publishing with source links to official products when available.</p></article>
        <article><span>03</span><h3>Monitoring &amp; media</h3><p>Official radar and observations, plus weather videos and updates.</p></article></div></div></section>`;
  }

  function renderBotPage() {
    main.innerHTML = `<section class="bot-page-hero"><div class="shell bot-page-layout"><div><span class="eyebrow eyebrow-light">NOAH STORM SCAN / DISCORD</span>
      <h1>Weather alerts,<br><span>where your community is.</span></h1><p>Noah Storm Scan is a Discord bot that delivers weather alerts into Discord servers, with support for monitored locations and alert notifications.</p>
      <a class="button button-light button-large" href="${BOT_SITE}" target="_blank" rel="noopener noreferrer">About &amp; Invite the Bot <span aria-hidden="true">↗</span></a>
      <p class="bot-note">You'll continue to the existing official Noah Storm Scan website.</p></div><div class="bot-orbit" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="bot-orbit-center">N<span>SS</span></div><span class="orbit-pin pin-one">ALERT</span><span class="orbit-pin pin-two">MB</span></div></div></section>
      <section class="section shell"><div class="bot-feature-grid"><article><span class="feature-number">01</span><h2>Alerts into Discord</h2><p>Bring weather alert notifications into your community's Discord server.</p></article><article><span class="feature-number">02</span><h2>Monitor locations</h2><p>Set monitored locations and receive notifications for relevant weather alerts.</p></article><article><span class="feature-number">03</span><h2>Official bot information</h2><p>Read about features and setup details on the existing official Noah Storm Scan site.</p></article></div></section>`;
  }

  function githubApi(path, method = "GET", body) {
    return fetch(`https://api.github.com${path}`, {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        Authorization: `Bearer ${adminToken}`,
        ...(body ? { "Content-Type": "application/json" } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `GitHub request failed (${response.status})`);
      return data;
    });
  }

  async function authorizeAdmin() {
    if (!config.githubOAuthClientId || !config.githubOwner || !config.githubRepository || !config.adminUsers?.length) {
      throw new Error("Administrator sign-in is not configured. Set the GitHub OAuth client ID and approved usernames in site-config.js.");
    }
    const response = await fetch("https://github.com/login/device/code", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: config.githubOAuthClientId, scope: "public_repo" })
    });
    const device = await response.json();
    if (!response.ok || device.error) throw new Error(device.error_description || device.error || "Could not start GitHub sign-in.");
    const loginStatus = document.querySelector("#admin-login-status");
    loginStatus.innerHTML = `<p>Enter this one-time code on GitHub: <strong class="device-code">${esc(device.user_code)}</strong></p><a href="${esc(device.verification_uri)}" target="_blank" rel="noopener noreferrer">Open GitHub device authorization ↗</a><p class="data-timestamp">Waiting for authorization. This code expires shortly.</p>`;
    const deadline = Date.now() + device.expires_in * 1000;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, Math.max(device.interval || 5, 5) * 1000));
      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ client_id: config.githubOAuthClientId, device_code: device.device_code, grant_type: "urn:ietf:params:oauth:grant-type:device_code" })
      });
      const tokenResult = await tokenResponse.json();
      if (tokenResult.access_token) {
        adminToken = tokenResult.access_token;
        const user = await githubApi("/user");
        const allowed = config.adminUsers.some((name) => name.toLowerCase() === user.login.toLowerCase());
        if (!allowed) {
          adminToken = "";
          throw new Error(`GitHub account @${user.login} is not on the administrator allowlist.`);
        }
        const repo = await githubApi(`/repos/${encodeURIComponent(config.githubOwner)}/${encodeURIComponent(config.githubRepository)}`);
        if (!repo.permissions?.push) {
          adminToken = "";
          throw new Error(`@${user.login} does not have write access to the configured repository.`);
        }
        adminLogin = user.login;
        return;
      }
      if (tokenResult.error === "authorization_pending" || tokenResult.error === "slow_down") continue;
      throw new Error(tokenResult.error_description || tokenResult.error || "GitHub authorization failed.");
    }
    throw new Error("GitHub device code expired. Please start again.");
  }

  function adminFormFields() {
    return `<label>Title<input name="title" required maxlength="140"></label>
      <label>Valid period / coverage<input name="validPeriod" maxlength="160" placeholder="e.g. Sunday afternoon · Southern Manitoba"></label>
      <label>Geographic coverage<input name="area" value="Manitoba" maxlength="120" required></label>
      <label>Risk category (optional)<input name="risk" maxlength="80" placeholder="e.g. Severe thunderstorm potential"></label>
      <label>Risk description (optional)<textarea name="riskDescription" rows="2" maxlength="1200"></textarea></label>
      <label>Written discussion<textarea name="discussion" rows="5" maxlength="8000" required></textarea></label>
      <label>Outlook graphic (optional image)<input name="graphic" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></label>`;
  }

  function renderAdmin() {
    main.innerHTML = `${pageTitle("RESTRICTED / CONTENT MANAGEMENT", "Publisher desk", "Administrator access is verified with GitHub. Published changes are committed directly to this website's repository.")}
      <section class="section shell admin-shell"><div id="admin-login-status" class="admin-status"><p>Sign in with an approved GitHub account to publish and manage website content.</p>
        <button class="button button-primary" id="admin-login" type="button">Sign in with GitHub</button>
        <p class="data-timestamp">Access requires an allowlisted GitHub username and write access to the website repository. No token is stored in this browser.</p></div>
        <div id="admin-workspace" hidden></div></section>`;
    document.querySelector("#admin-login").addEventListener("click", async () => {
      const button = document.querySelector("#admin-login");
      button.disabled = true;
      try {
        await authorizeAdmin();
        renderAdminWorkspace();
      } catch (error) {
        adminToken = "";
        adminLogin = "";
        document.querySelector("#admin-login-status").innerHTML = `<div class="unavailable"><strong>Sign-in unavailable</strong><p>${esc(error.message)}</p><button class="button button-outline" id="admin-retry" type="button">Try again</button></div>`;
        document.querySelector("#admin-retry").addEventListener("click", renderAdmin);
      }
    });
  }

  function renderAdminWorkspace() {
    const status = document.querySelector("#admin-login-status");
    status.innerHTML = `<span class="status-pill status-clear"><span class="status-dot"></span>Signed in as @${esc(adminLogin)}</span><button class="button button-outline admin-signout" id="admin-signout" type="button">Sign out</button><p class="data-timestamp">Publishing commits changes to ${esc(config.githubOwner)}/${esc(config.githubRepository)} (${esc(config.githubBranch || "main")}).</p>`;
    document.querySelector("#admin-signout").addEventListener("click", () => {
      adminToken = "";
      adminLogin = "";
      renderAdmin();
    });
    const workspace = document.querySelector("#admin-workspace");
    workspace.hidden = false;
    workspace.innerHTML = `<div id="admin-feedback" aria-live="polite"></div>
      <div class="admin-tabs" role="tablist" aria-label="Content type">
        <button class="admin-tab active" data-tab="outlook" type="button">Noah Outlook</button>
        <button class="admin-tab" data-tab="eccc" type="button">ECCC Link</button>
        <button class="admin-tab" data-tab="update" type="button">Weather Update</button>
        <button class="admin-tab" data-tab="announcement" type="button">Announcement</button>
        <button class="admin-tab" data-tab="media" type="button">Media</button>
      </div>
      <div id="admin-panel"></div>
      <section class="admin-existing"><h2>Published content</h2><div id="admin-content-list"></div></section>`;
    workspace.querySelectorAll(".admin-tab").forEach((tab) => tab.addEventListener("click", () => {
      workspace.querySelectorAll(".admin-tab").forEach((button) => button.classList.toggle("active", button === tab));
      renderAdminForm(tab.dataset.tab);
    }));
    renderAdminForm("outlook");
    renderAdminList();
  }

  function renderAdminForm(type, record, recordKey, recordIndex) {
    const panel = document.querySelector("#admin-panel");
    const forms = {
      outlook: `<h2>Publish an independent outlook</h2><p>This content is labelled Noah's Weather Service and is not an official forecast.</p><form data-kind="outlook" class="admin-form">${adminFormFields()}<button class="button button-primary" type="submit">Publish outlook</button></form>`,
      eccc: `<h2>Link an official ECCC outlook</h2><p>Link directly to the original official product. The source remains Environment and Climate Change Canada.</p><form data-kind="eccc" class="admin-form">
        <label>Product title<input name="title" required maxlength="140"></label><label>Official source URL<input name="sourceUrl" type="url" required placeholder="https://weather.gc.ca/…"></label>
        <label>Original graphic URL (optional)<input name="graphic" type="url" placeholder="https://…"></label><label>Publication date and time<input name="publishedAt" type="datetime-local"></label>
        <label>Valid period<input name="validPeriod" maxlength="160"></label><label>Geographic coverage<input name="area" value="Manitoba" maxlength="120"></label>
        <label>Summary / description<textarea name="discussion" rows="4" maxlength="4000"></textarea></label><p class="form-note">ECCC product material is linked as published and is not edited or rebranded.</p><button class="button button-primary" type="submit">Publish ECCC link</button></form>`,
      update: `<h2>Publish a weather update</h2><p>Independent update; it will be clearly separated from official ECCC alerts.</p><form data-kind="update" class="admin-form">
        <label>Title<input name="title" required maxlength="140"></label>
        <label>Alert type<select name="kind"><option value="statement">Statement / information</option><option value="advisory">Advisory</option><option value="watch">Watch</option><option value="warning">Warning</option></select></label>
        <label>Affected area<input name="area" value="Manitoba" maxlength="120"></label><label>Expiry date and time (optional)<input name="expiresAt" type="datetime-local"></label>
        <label>Update<textarea name="body" rows="5" required maxlength="5000"></textarea></label><button class="button button-primary" type="submit">Publish update</button></form>`,
      announcement: `<h2>Homepage announcement</h2><p>Short service information shown on the homepage.</p><form data-kind="announcement" class="admin-form">
        <label>Title<input name="title" required maxlength="120"></label><label>Announcement<textarea name="body" rows="3" required maxlength="1000"></textarea></label><button class="button button-primary" type="submit">Publish announcement</button></form>`,
      media: `<h2>Add a weather video</h2><p>Link to a video on the Noah's Weather Alert Team channel.</p><form data-kind="media" class="admin-form">
        <label>Video title<input name="title" required maxlength="140"></label><label>YouTube video URL<input name="url" type="url" required placeholder="https://www.youtube.com/watch?v=…"></label>
        <label>Category<select name="category"><option>Forecast</option><option>Severe weather coverage</option><option>Weather update</option><option>Education</option></select></label>
        <label>Publication date and time<input name="publishedAt" type="datetime-local" value="${isoNowForInput()}"></label><button class="button button-primary" type="submit">Publish video link</button></form>`
    };
    panel.innerHTML = forms[type] || forms.outlook;
    const form = panel.querySelector("form");
    if (record) {
      form.dataset.editKey = recordKey;
      form.dataset.editIndex = String(recordIndex);
      form.dataset.editId = record.id || "";
      for (const [name, value] of Object.entries(record)) {
        const field = form.elements.namedItem(name);
        if (!field || field.type === "file") continue;
        field.value = field.type === "datetime-local" ? dateForInput(value) : value ?? "";
      }
      form.querySelector('button[type="submit"]').textContent = "Save changes";
    }
    form.addEventListener("submit", (event) => submitAdminForm(event, type));
  }

  function renderAdminList() {
    const groups = [
      ["noahsOutlooks", "Noah outlook"], ["ecccOutlooks", "ECCC link"],
      ["updates", "Weather update"], ["announcements", "Announcement"], ["media", "Media"]
    ];
    const items = groups.flatMap(([key, label]) => content[key].map((item, index) => ({ key, label, index, item })));
    const container = document.querySelector("#admin-content-list");
    if (!items.length) {
      container.innerHTML = `<p class="inline-note">No administrator-managed content has been published yet.</p>`;
      return;
    }
    container.innerHTML = `<ul class="admin-list">${items.map(({ key, label, index, item }) => `<li><span><span class="source-tag">${esc(label)}</span><strong>${esc(item.title || item.url || label)}</strong><small>${esc(localTime(item.issuedAt || item.publishedAt))}</small></span>
      <div class="admin-list-actions"><button class="edit-button" type="button" data-key="${key}" data-index="${index}" aria-label="Edit ${esc(item.title || label)}">Edit</button>
      <button class="remove-button" type="button" data-key="${key}" data-index="${index}" data-id="${esc(item.id || "")}" aria-label="Delete ${esc(item.title || label)}">Remove</button></div></li>`).join("")}</ul>`;
    container.querySelectorAll(".edit-button").forEach((button) => button.addEventListener("click", () => {
      const { key, index } = button.dataset;
      const type = {
        noahsOutlooks: "outlook", ecccOutlooks: "eccc", updates: "update",
        announcements: "announcement", media: "media"
      }[key];
      if (!type) return;
      document.querySelectorAll(".admin-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === type));
      renderAdminForm(type, content[key][Number(index)], key, Number(index));
      document.querySelector("#admin-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    }));
    container.querySelectorAll(".remove-button").forEach((button) => button.addEventListener("click", async () => {
      if (!window.confirm("Remove this published item? This change will be committed to the website repository.")) return;
      const key = button.dataset.key;
      const index = Number(button.dataset.index);
      const id = button.dataset.id;
      await publishContent((latest) => {
        const itemIndex = id ? latest[key].findIndex((item) => item.id === id) : index;
        if (itemIndex < 0 || itemIndex >= latest[key].length) throw new Error("This content item changed or was removed by another publisher. Refresh the page and try again.");
        latest[key].splice(itemIndex, 1);
        return latest;
      }, `Remove ${key} item`);
    }));
  }

  async function fileToBase64(file) {
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      throw new Error("The outlook graphic must be a PNG, JPEG, WebP or GIF image.");
    }
    if (file.size > 5 * 1024 * 1024) throw new Error("The image must be smaller than 5 MB.");
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read the selected image."));
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.readAsDataURL(file);
    });
  }

  async function saveRepoFile(path, base64, message, sha) {
    const repoPath = `/repos/${encodeURIComponent(config.githubOwner)}/${encodeURIComponent(config.githubRepository)}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;
    return githubApi(repoPath, "PUT", {
      message, content: base64, branch: config.githubBranch || "main", ...(sha ? { sha } : {})
    });
  }

  function encodeBase64(bytes) {
    let binary = "";
    for (let start = 0; start < bytes.length; start += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
    }
    return btoa(binary);
  }

  async function publishContent(applyChange, message) {
    const feedback = document.querySelector("#admin-feedback");
    feedback.innerHTML = `<div class="loading-state"><span class="loader"></span>Publishing content to GitHub…</div>`;
    try {
      const path = "data/content.json";
      const current = await githubApi(`/repos/${encodeURIComponent(config.githubOwner)}/${encodeURIComponent(config.githubRepository)}/contents/${path}?ref=${encodeURIComponent(config.githubBranch || "main")}`);
      const bytes = Uint8Array.from(atob(current.content.replace(/\s/g, "")), (char) => char.charCodeAt(0));
      const latest = JSON.parse(new TextDecoder().decode(bytes));
      const normalized = { ...structuredClone(EMPTY_CONTENT), ...latest };
      for (const key of Object.keys(EMPTY_CONTENT)) if (!Array.isArray(normalized[key])) normalized[key] = [];
      const merged = applyChange(normalized);
      const encoded = encodeBase64(new TextEncoder().encode(`${JSON.stringify(merged, null, 2)}\n`));
      await saveRepoFile(path, encoded, message, current.sha);
      content = merged;
      feedback.innerHTML = `<div class="success-message">Published successfully. Your update is committed to the website repository and will appear after the site redeploys.</div>`;
      const editor = document.querySelector("#admin-panel form");
      if (editor?.dataset.editKey) renderAdminForm(editor.dataset.kind);
      else editor?.reset();
      renderAdminList();
      if (page === "home") renderHome();
    } catch (error) {
      console.error("Publishing site content failed.", error);
      feedback.innerHTML = `<div class="unavailable"><strong>Publish failed</strong><p>${esc(error.message)}. Your content has not been confirmed as published. Check repository permissions and try again.</p></div>`;
    }
  }

  async function submitAdminForm(event, type) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const item = Object.fromEntries(data.entries());
    const now = new Date().toISOString();
    const editKey = form.dataset.editKey || "";
    const editIndex = Number(form.dataset.editIndex);
    const editId = form.dataset.editId || "";
    const editing = Boolean(editKey);
    const previousItems = editing ? content[editKey] || [] : [];
    const previousItem = editing
      ? (editId ? previousItems.find((entry) => entry.id === editId) : previousItems[editIndex])
      : null;
    item.id = previousItem?.id || crypto.randomUUID();
    const saveEntry = (key, message) => publishContent((latest) => {
      if (!editing) {
        latest[key].push(item);
        return latest;
      }
      const index = editId ? latest[key].findIndex((entry) => entry.id === editId) : editIndex;
      if (index < 0 || index >= latest[key].length) {
        throw new Error("This content item changed or was removed by another publisher. Refresh the page and try again.");
      }
      latest[key][index] = { ...latest[key][index], ...item, id: item.id };
      return latest;
    }, message);
    if (type === "outlook") {
      item.issuedAt = previousItem?.issuedAt || now;
      const image = data.get("graphic");
      delete item.graphic;
      if (image instanceof File && image.size) {
        const safeName = image.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100) || "outlook-image";
        const path = `content/uploads/${Date.now()}-${safeName}`;
        const feedback = document.querySelector("#admin-feedback");
        feedback.innerHTML = `<div class="loading-state"><span class="loader"></span>Uploading outlook image…</div>`;
        try {
          await saveRepoFile(path, await fileToBase64(image), `Upload outlook graphic: ${safeName}`);
          item.graphic = `./${path}`;
        } catch (error) {
          console.error("Outlook image upload failed.", error);
          feedback.innerHTML = `<div class="unavailable"><strong>Image upload failed</strong><p>${esc(error.message)}. The outlook was not published.</p></div>`;
          return;
        }
      } else if (previousItem?.graphic) {
        item.graphic = previousItem.graphic;
      }
      await saveEntry("noahsOutlooks", `${editing ? "Update" : "Publish"} outlook: ${item.title}`);
    } else if (type === "eccc") {
      item.publishedAt = item.publishedAt ? new Date(item.publishedAt).toISOString() : now;
      item.sourceUrl = safeEcccUrl(item.sourceUrl);
      const graphicProvided = Boolean(item.graphic);
      item.graphic = safeEcccUrl(item.graphic);
      if (!item.sourceUrl) {
        document.querySelector("#admin-feedback").innerHTML = `<div class="unavailable"><strong>Invalid official URL</strong><p>Use an HTTPS link on weather.gc.ca, ec.gc.ca or canada.ca to the original ECCC product.</p></div>`;
        return;
      }
      if (graphicProvided && !item.graphic) {
        document.querySelector("#admin-feedback").innerHTML = `<div class="unavailable"><strong>Invalid official graphic URL</strong><p>Use an HTTPS link on an approved official ECCC or Canada.ca domain.</p></div>`;
        return;
      }
      await saveEntry("ecccOutlooks", `${editing ? "Update" : "Link"} official ECCC outlook: ${item.title}`);
    } else if (type === "update") {
      item.issuedAt = previousItem?.issuedAt || now;
      item.expiresAt = item.expiresAt ? new Date(item.expiresAt).toISOString() : "";
      await saveEntry("updates", `${editing ? "Update" : "Publish"} weather update: ${item.title}`);
    } else if (type === "announcement") {
      item.issuedAt = previousItem?.issuedAt || now;
      await saveEntry("announcements", `${editing ? "Update" : "Publish"} homepage announcement: ${item.title}`);
    } else if (type === "media") {
      item.publishedAt = item.publishedAt ? new Date(item.publishedAt).toISOString() : now;
      item.url = safeHttpUrl(item.url);
      if (!item.url || !youtubeId(item.url)) {
        document.querySelector("#admin-feedback").innerHTML = `<div class="unavailable"><strong>Invalid video URL</strong><p>Enter a valid HTTPS link to a YouTube video.</p></div>`;
        return;
      }
      await saveEntry("media", `${editing ? "Update" : "Add"} weather video: ${item.title}`);
    }
  }

  function renderPage() {
    renderHeader();
    renderFooter();
    const pages = {
      home: renderHome,
      alerts: renderAlertsPage,
      outlooks: renderOutlooksPage,
      maps: renderMapPage,
      media: renderMediaPage,
      about: renderAboutPage,
      bot: renderBotPage,
      admin: renderAdmin
    };
    (pages[page] || renderHome)();
    document.title = `${page === "home" ? "Manitoba Weather" : page === "bot" ? "Noah Storm Scan" : page === "admin" ? "Publisher Desk" : NAV_ITEMS.find(([id]) => id === page)?.[1] || "Weather"} | Noah's Weather Service`;
  }

  getContent().finally(renderPage);
})();
