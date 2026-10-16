(() => {
  "use strict";

  const DATA_FILE = "Profiles.txt";
  const profileList = document.getElementById("profileList");
  const profileCount = document.getElementById("profileCount");
  const searchInput = document.getElementById("profileSearch");
  const resultLabel = document.getElementById("resultLabel");
  const emptyState = document.getElementById("emptyState");
  const errorState = document.getElementById("errorState");

  let profiles = [];
  let renderToken = 0;

  function parseProfiles(raw) {
    // Each profile record is separated by a line containing only "$".
    // Within each record, the lines are: profile name, photo URL, profile URL.
    const records = raw.replace(/^\uFEFF/, "").split(/^\s*\$\s*$/m);
    const parsed = [];

    for (const record of records) {
      const lines = record.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      if (lines.length < 3) continue;
      const [name, photo, url] = lines;
      if (!name || !url) continue;
      parsed.push({ name, photo, url, index: parsed.length + 1 });
    }
    return parsed;
  }

  function safeHttpUrl(value) {
    try {
      const parsed = new URL(value, window.location.href);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.href;
    } catch (_) {}
    return "";
  }

  function initials(name) {
    const words = name.trim().split(/\s+/).filter(Boolean);
    return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] || "A").slice(0, 2)).toUpperCase();
  }

  function makeCard(profile, position) {
    const card = document.createElement("a");
    card.className = "profile-card";
    card.href = safeHttpUrl(profile.url) || "#";
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.style.animationDelay = `${Math.min(position, 12) * 18}ms`;
    card.setAttribute("aria-label", `${profile.name} profile, opens in a new tab`);

    const avatarWrap = document.createElement("div");
    avatarWrap.className = "avatar-wrap";

    const photoUrl = safeHttpUrl(profile.photo);
    if (photoUrl) {
      const img = document.createElement("img");
      img.className = "avatar";
      img.src = photoUrl;
      img.alt = `${profile.name} profile photo`;
      img.loading = "lazy";
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      img.addEventListener("error", () => {
        avatarWrap.replaceChildren();
        const fallback = document.createElement("div");
        fallback.className = "avatar-fallback";
        fallback.textContent = initials(profile.name);
        avatarWrap.appendChild(fallback);
      }, { once: true });
      avatarWrap.appendChild(img);
    } else {
      const fallback = document.createElement("div");
      fallback.className = "avatar-fallback";
      fallback.textContent = initials(profile.name);
      avatarWrap.appendChild(fallback);
    }

    const info = document.createElement("div");
    info.className = "profile-info";
    const index = document.createElement("span");
    index.className = "profile-index";
    index.textContent = `PROFILE / ${String(profile.index).padStart(3, "0")}`;
    const name = document.createElement("span");
    name.className = "profile-name";
    name.textContent = profile.name;
    const url = document.createElement("span");
    url.className = "profile-url";
    url.textContent = profile.url;
    info.append(index, name, url);

    const arrow = document.createElement("span");
    arrow.className = "profile-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";

    card.append(avatarWrap, info, arrow);
    return card;
  }

  function render(query = "") {
    const token = ++renderToken;
    const normalized = query.trim().toLocaleLowerCase();
    const matches = profiles.filter(profile =>
      profile.name.toLocaleLowerCase().includes(normalized) ||
      profile.url.toLocaleLowerCase().includes(normalized)
    );

    profileList.replaceChildren();
    emptyState.hidden = matches.length !== 0;
    errorState.hidden = true;
    resultLabel.textContent = `${matches.length} ${matches.length === 1 ? "PROFILE" : "PROFILES"} FOUND`;

    // Render in small batches so a very large text file does not freeze the page.
    let cursor = 0;
    const batchSize = 40;
    function appendBatch() {
      if (token !== renderToken) return;
      const fragment = document.createDocumentFragment();
      const end = Math.min(cursor + batchSize, matches.length);
      for (; cursor < end; cursor++) fragment.appendChild(makeCard(matches[cursor], cursor));
      profileList.appendChild(fragment);
      if (cursor < matches.length) {
        if ("requestIdleCallback" in window) requestIdleCallback(appendBatch, { timeout: 100 });
        else setTimeout(appendBatch, 0);
      }
    }
    if (matches.length) appendBatch();
  }

  async function loadProfiles() {
    try {
      const response = await fetch(DATA_FILE, { cache: "no-store" });
      if (!response.ok) throw new Error(`Could not load ${DATA_FILE}: ${response.status}`);
      const raw = await response.text();
      profiles = parseProfiles(raw);
      profileCount.textContent = profiles.length.toLocaleString();
      render(searchInput.value);
      if (!profiles.length) {
        resultLabel.textContent = "NO VALID PROFILES";
        emptyState.hidden = false;
        emptyState.querySelector("h3").textContent = "Your directory is empty";
        emptyState.querySelector("p").textContent = "Add profiles to Profiles.txt using the format shown in the README.";
      }
    } catch (error) {
      profileList.replaceChildren();
      profileCount.textContent = "0";
      resultLabel.textContent = "COULD NOT LOAD DIRECTORY";
      errorState.hidden = false;
      console.error(error);
    }
  }

  searchInput.addEventListener("input", () => render(searchInput.value));
  document.addEventListener("keydown", event => {
    if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey &&
        !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      searchInput.focus();
    }
    if (event.key === "Escape" && document.activeElement === searchInput) {
      searchInput.value = "";
      render("");
      searchInput.blur();
    }
  });

  loadProfiles();
})();
