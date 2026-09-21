"use strict";

(() => {
  const STORAGE_KEY = "asobi-theme-v1";
  const root = document.documentElement;
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

  function savedTheme() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value === "light" || value === "dark" ? value : null;
    } catch {
      return null;
    }
  }

  function preferredTheme() {
    return savedTheme() || (systemTheme.matches ? "dark" : "light");
  }

  function updateControls(theme) {
    const nextTheme = theme === "dark" ? "ライト" : "ダーク";
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.setAttribute("aria-label", `${nextTheme}テーマに切り替える`);
      button.setAttribute("title", `${nextTheme}テーマに切り替える`);
      const icon = button.querySelector("[data-theme-icon]");
      const label = button.querySelector("[data-theme-label]");
      if (icon) icon.textContent = theme === "dark" ? "☀" : "☾";
      if (label) label.textContent = nextTheme;
    });
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === "dark" ? "#0d1b2a" : "#eefbff";
    updateControls(theme);
  }

  applyTheme(preferredTheme());

  document.addEventListener("DOMContentLoaded", () => {
    updateControls(root.dataset.theme);
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const theme = root.dataset.theme === "dark" ? "light" : "dark";
        try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* Theme still changes for this page. */ }
        applyTheme(theme);
      });
    });
  });

  systemTheme.addEventListener("change", (event) => {
    if (!savedTheme()) applyTheme(event.matches ? "dark" : "light");
  });
})();
