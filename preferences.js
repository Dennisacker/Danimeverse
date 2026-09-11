/* Danimeverse shared theme, cookie consent, and user preferences */
(function () {
  "use strict";

  if (window.__danimeversePreferencesLoaded) return;
  window.__danimeversePreferencesLoaded = true;

  const THEME_KEY = "danimeverse_theme";
  const CONSENT_KEY = "danimeverse_cookie_consent";
  const VALID_THEMES = new Set(["dark", "light", "system"]);
  const systemQuery = window.matchMedia("(prefers-color-scheme: light)");

  function readStorage(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function writeStorage(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }

  function getTheme() {
    const saved = readStorage(THEME_KEY);
    return VALID_THEMES.has(saved) ? saved : "dark";
  }

  function resolveTheme(mode) {
    return mode === "system"
      ? (systemQuery.matches ? "light" : "dark")
      : mode;
  }

  function applyTheme(mode) {
    const selected = VALID_THEMES.has(mode) ? mode : "dark";
    const effective = resolveTheme(selected);
    const root = document.documentElement;

    root.dataset.theme = effective;
    root.dataset.themePreference = selected;
    root.classList.toggle("theme-light", effective === "light");
    root.classList.toggle("theme-dark", effective === "dark");
    root.classList.toggle("dark", effective === "dark");
    if (document.body) {
      document.body.classList.toggle("light-mode", effective === "light");
      document.body.classList.toggle("dark", effective === "dark");
    }

    const trigger = document.getElementById("dvThemeTrigger");
    if (trigger) {
      const icon = trigger.querySelector(".dv-theme-icon");
      const label = trigger.querySelector(".dv-theme-label");
      if (icon) icon.textContent = effective === "light" ? "☀" : "☾";
      if (label) label.textContent = selected === "system" ? "System" : effective === "light" ? "Light" : "Dark";
      trigger.title = `Theme: ${selected}`;
      trigger.setAttribute("aria-label", `Theme: ${selected}. Open appearance settings`);
    }
  }

  function saveConsent(preferences) {
    writeStorage(CONSENT_KEY, JSON.stringify({
      essential: true,
      preferences: Boolean(preferences),
      savedAt: new Date().toISOString()
    }));
    const banner = document.getElementById("dvConsentBanner");
    if (banner) banner.classList.remove("is-visible");
  }

  function hasConsent() {
    try {
      const stored = JSON.parse(readStorage(CONSENT_KEY) || "null");
      return Boolean(stored && stored.essential);
    } catch (_) {
      return false;
    }
  }

  function openPreferences() {
    const backdrop = document.getElementById("dvPreferencesBackdrop");
    if (!backdrop) return;
    const current = getTheme();
    const radio = backdrop.querySelector(`input[name="dv-theme"][value="${current}"]`);
    if (radio) radio.checked = true;
    const consent = (() => {
      try { return JSON.parse(readStorage(CONSENT_KEY) || "null"); } catch (_) { return null; }
    })();
    const preferenceToggle = backdrop.querySelector("#dvPreferencesConsent");
    if (preferenceToggle) preferenceToggle.checked = consent ? consent.preferences !== false : true;
    backdrop.classList.add("is-open");
    document.body.classList.add("dv-preferences-open");
    backdrop.querySelector("button")?.focus();
  }

  function closePreferences() {
    const backdrop = document.getElementById("dvPreferencesBackdrop");
    if (backdrop) backdrop.classList.remove("is-open");
    document.body.classList.remove("dv-preferences-open");
  }

  function createThemeTrigger() {
    if (document.getElementById("dvThemeTrigger")) return;
    const trigger = document.createElement("button");
    trigger.id = "dvThemeTrigger";
    trigger.className = "dv-theme-trigger";
    trigger.type = "button";
    trigger.innerHTML = '<span class="dv-theme-icon" aria-hidden="true">☾</span><span class="dv-theme-label">Dark</span>';
    trigger.addEventListener("click", openPreferences);
    document.body.appendChild(trigger);
  }

  function createPreferencesModal() {
    if (document.getElementById("dvPreferencesBackdrop")) return;
    const backdrop = document.createElement("div");
    backdrop.id = "dvPreferencesBackdrop";
    backdrop.className = "dv-theme-backdrop";
    backdrop.innerHTML = `
      <section class="dv-preferences" role="dialog" aria-modal="true" aria-labelledby="dvPreferencesTitle">
        <h2 id="dvPreferencesTitle">Danimeverse settings</h2>
        <p class="dv-preferences-intro">Choose how Danimeverse looks and how optional storage is used on this device.</p>
        <div class="dv-preferences-section">
          <h3>Appearance</h3>
          <div class="dv-theme-options" role="radiogroup" aria-label="Theme">
            <label class="dv-theme-option"><input type="radio" name="dv-theme" value="dark"> <span>☾ Dark</span><small>Danimeverse default</small></label>
            <label class="dv-theme-option"><input type="radio" name="dv-theme" value="light"> <span>☀ Light</span><small>Bright and clean</small></label>
            <label class="dv-theme-option"><input type="radio" name="dv-theme" value="system"> <span>◐ System</span><small>Follow your device</small></label>
          </div>
        </div>
        <div class="dv-preferences-section">
          <h3>Privacy</h3>
          <div class="dv-consent-row">
            <div><strong>Essential</strong><span>Required for the website to function and cannot be disabled.</span></div>
            <input type="checkbox" checked disabled aria-label="Essential storage is always enabled">
          </div>
          <div class="dv-consent-row">
            <div><strong>Preferences</strong><span>Used to remember theme and other choices on this device.</span></div>
            <input id="dvPreferencesConsent" type="checkbox" aria-label="Allow preference storage">
          </div>
        </div>
        <div class="dv-preferences-actions">
          <button type="button" class="dv-btn" data-close-preferences>Cancel</button>
          <button type="button" class="dv-btn dv-btn-primary" data-save-preferences>Save preferences</button>
        </div>
      </section>`;
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) closePreferences();
    });
    document.body.appendChild(backdrop);
  }

  function createConsentBanner() {
    if (document.getElementById("dvConsentBanner")) return;
    const banner = document.createElement("aside");
    banner.id = "dvConsentBanner";
    banner.className = "dv-consent";
    banner.setAttribute("aria-live", "polite");
    banner.innerHTML = `
      <h2>Your privacy matters</h2>
      <p>Danimeverse uses cookies and similar storage technologies to keep the site working, remember your preferences, and improve your experience.</p>
      <div class="dv-consent-actions">
        <button type="button" class="dv-btn dv-btn-primary" data-consent="all">Accept All</button>
        <button type="button" class="dv-btn" data-consent="reject">Reject Non-Essential</button>
        <button type="button" class="dv-btn" data-open-cookie-settings>Cookie Settings</button>
      </div>`;
    document.body.appendChild(banner);
    if (!hasConsent()) banner.classList.add("is-visible");
  }

  function init() {
    applyTheme(getTheme());
    createThemeTrigger();
    createPreferencesModal();
    createConsentBanner();

    document.addEventListener("click", (event) => {
      const consentButton = event.target.closest("[data-consent]");
      if (consentButton) saveConsent(consentButton.dataset.consent === "all");
      if (event.target.closest("[data-open-cookie-settings]")) openPreferences();
      if (event.target.closest("[data-close-preferences]")) closePreferences();
      if (event.target.closest("[data-save-preferences]")) {
        const mode = document.querySelector('input[name="dv-theme"]:checked')?.value || "dark";
        const preferenceToggle = document.getElementById("dvPreferencesConsent");
        writeStorage(THEME_KEY, mode);
        applyTheme(mode);
        saveConsent(preferenceToggle ? preferenceToggle.checked : true);
        closePreferences();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closePreferences();
    });

    systemQuery.addEventListener?.("change", () => {
      if (getTheme() === "system") applyTheme("system");
    });
  }

  /* Apply the saved mode before the page is interactive. */
  applyTheme(getTheme());
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.DanimeversePreferences = {
    getTheme,
    applyTheme,
    openPreferences,
    closePreferences
  };
})();