import { JSX } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { useTheme } from "../contexts/ThemeContext";
import { SunIcon, MoonIcon, LogoRealpro } from "./Icons";

const navItems = [
  { href: "/obras", label: "Obras" },
  { href: "/operarios", label: "Operarios" },
  { href: "/planing", label: "Planing" },
];

export default function Layout(props: { children?: JSX.Element }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      class={`min-h-screen ${theme() === "dark" ? "dark bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}
    >
      <nav class="bg-white dark:bg-gray-800 shadow-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex">
              <div class="flex-shrink-0 flex items-center">
                <LogoRealpro class="text-blue-600 dark:text-blue-400 w-20 h-20" />
                <span class="text-xl font-bold text-blue-600 dark:text-blue-400">
                  ProApp
                </span>
              </div>
              <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <A
                    href={item.href}
                    class={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      location.pathname === item.href
                        ? "border-blue-500 text-gray-900 dark:text-white"
                        : "border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                  >
                    {item.label}
                  </A>
                ))}
              </div>
            </div>
            <div class="flex items-center">
              <button
                onClick={toggleTheme}
                class="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                aria-label="Toggle dark mode"
              >
                {theme() === "dark" ? (
                  <SunIcon class="w-5 h-5" />
                ) : (
                  <MoonIcon class="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {props.children}
      </main>
    </div>
  );
}
