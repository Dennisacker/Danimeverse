/* Danimeverse cookie consent and privacy preferences */
(function () {
  "use strict";

  if (window.__danimeverseCookieConsentLoaded) return;
  window.__danimeverseCookieConsentLoaded = true;

  const CONSENT_KEY = "danimeverse_cookie_consent";
  const CONSENT_CHOICES = new Set(["all", "reject", "custom"]);

  function readStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (_) {}
  }

  function getStoredConsent() {
    try {
      const stored = JSON.parse(readStorage(CONSENT_KEY) || "null");
      if (!stored || !stored.essential) return null;
      if (!CONSENT_CHOICES.has(stored.choice) && stored.preferences === undefined) return null;
      return stored;
    } catch (_) {
      return null;
    }
  }

  function saveConsent(choice, preferences) {
    const selectedChoice = CONSENT_CHOICES.has(choice) ? choice : "custom";
    writeStorage(CONSENT_KEY, JSON.stringify({
      essential: true,
      choice: selectedChoice,
      preferences: typeof preferences === "boolean"
        ? preferences
        : selectedChoice !== "reject",
      savedAt: new Date().toISOString()
    }));

    document.getElementById("dvConsentBanner")?.classList.remove("is-visible");
    closeCookieSettings();
  }

  function openCookieSettings() {
    const backdrop = document.getElementById("dvCookieSettingsBackdrop");
    if (!backdrop) return;

    const stored = getStoredConsent();
    const preferenceToggle = backdrop.querySelector("#dvOptionalPreferences");
    if (preferenceToggle) {
      preferenceToggle.checked = stored ? stored.preferences !== false : true;
    }

    backdrop.classList.add("is-open");
    document.body.classList.add("dv-cookie-settings-open");
    backdrop.querySelector("button")?.focus();
  }

  function closeCookieSettings() {
    document.getElementById("dvCookieSettingsBackdrop")?.classList.remove("is-open");
    document.body.classList.remove("dv-cookie-settings-open");
  }

  function createCookieSettings() {
    if (document.getElementById("dvCookieSettingsBackdrop")) return;

    const backdrop = document.createElement("div");
    backdrop.id = "dvCookieSettingsBackdrop";
    backdrop.className = "dv-cookie-backdrop";
    backdrop.innerHTML = `
      <section class="dv-cookie-settings" role="dialog" aria-modal="true" aria-labelledby="dvCookieSettingsTitle">
        <h2 id="dvCookieSettingsTitle">Cookie Settings</h2>
        <p class="dv-cookie-intro">Choose which optional storage Danimeverse may use on this device.</p>
        <div class="dv-cookie-section">
          <div class="dv-cookie-row">
            <div>
              <strong>Essential</strong>
              <span>Required for the website to function and cannot be disabled.</span>
            </div>
            <input type="checkbox" checked disabled aria-label="Essential storage is always enabled">
          </div>
          <div class="dv-cookie-row">
            <div>
              <strong>Preferences</strong>
              <span>Allows Danimeverse to remember optional choices on this device.</span>
            </div>
            <input id="dvOptionalPreferences" type="checkbox" aria-label="Allow optional preference storage">
          </div>
        </div>
        <div class="dv-cookie-actions">
          <button type="button" class="dv-cookie-btn" data-close-cookie-settings>Cancel</button>
          <button type="button" class="dv-cookie-btn dv-cookie-btn-primary" data-save-cookie-settings>Save Preferences</button>
        </div>
      </section>`;

    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) closeCookieSettings();
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
      <p>Danimeverse uses essential storage to keep the site working. You can allow or reject optional preferences on this device.</p>
      <div class="dv-consent-actions">
        <button type="button" class="dv-cookie-btn dv-cookie-btn-primary" data-consent="all">Accept All</button>
        <button type="button" class="dv-cookie-btn" data-consent="reject">Reject Non-Essential</button>
        <button type="button" class="dv-cookie-btn" data-open-cookie-settings>Cookie Settings</button>
      </div>`;

    document.body.appendChild(banner);
    if (!getStoredConsent()) banner.classList.add("is-visible");
  }

  function init() {
    createCookieSettings();
    createConsentBanner();

    document.addEventListener("click", (event) => {
      const consentButton = event.target.closest("[data-consent]");
      if (consentButton) saveConsent(consentButton.dataset.consent);
      if (event.target.closest("[data-open-cookie-settings]")) openCookieSettings();
      if (event.target.closest("[data-close-cookie-settings]")) closeCookieSettings();
      if (event.target.closest("[data-save-cookie-settings]")) {
        const preferenceToggle = document.getElementById("dvOptionalPreferences");
        saveConsent("custom", preferenceToggle ? preferenceToggle.checked : false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeCookieSettings();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.DanimeverseCookieConsent = {
    open: openCookieSettings,
    close: closeCookieSettings
  };
})();