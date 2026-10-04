(() => {
  const STORAGE_KEY = "kalkulator-theme-v1";
  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");
  const themeColor = document.querySelector('meta[name="theme-color"]');

  if (!toggle) {
    console.error("Tombol tema tidak ditemukan.");
    return;
  }

  function applyTheme(theme, save = true) {
    root.dataset.theme = theme;

    const isDark = theme === "dark";
    toggle.textContent = isDark ? "☀" : "☾";
    toggle.setAttribute(
      "aria-label",
      isDark ? "Aktifkan tema terang" : "Aktifkan tema gelap"
    );
    toggle.title = isDark ? "Aktifkan tema terang" : "Aktifkan tema gelap";

    if (themeColor) {
      themeColor.content = isDark ? "#101114" : "#f4f7fb";
    }

    if (save) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (error) {
        console.warn("Preferensi tema tidak dapat disimpan di perangkat ini:", error);
      }
    }
  }

  let savedTheme = null;

  try {
    savedTheme = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Preferensi tema tidak dapat dibaca dari perangkat ini:", error);
  }

  applyTheme(savedTheme === "light" ? "light" : "dark", false);

  toggle.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  });
})();