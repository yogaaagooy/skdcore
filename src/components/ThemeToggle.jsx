import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("skdcore_theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    }
  }, []);

  function toggleTheme() {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      window.localStorage.setItem("skdcore_theme", "dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      window.localStorage.setItem("skdcore_theme", "light");
      setTheme("light");
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Aktifkan mode gelap" : "Aktifkan mode terang"}
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:border-slate-600 dark:text-slate-100 dark:hover:border-blue-500 dark:hover:bg-slate-800"
    >
      <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
      <span className="hidden sm:inline">{theme === "light" ? "Mode gelap" : "Mode terang"}</span>
    </button>
  );
}
