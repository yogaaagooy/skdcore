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
      className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
    >
      {theme === "light" ? "Dark mode" : "Light mode"}
    </button>
  );
}
