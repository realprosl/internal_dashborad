import { JSX, Show, createSignal } from "solid-js";
import { A, useNavigate, useLocation } from "@solidjs/router";
import { useTheme } from "../contexts/ThemeContext";
import { SunIcon, MoonIcon, LogoRealpro, LogoutIcon } from "./Icons";
import { useAppStore } from "../store";

const navItems = [
  { href: "/obras", label: "Obras" },
  { href: "/operarios", label: "Operarios" },
  { href: "/planing", label: "Planing" },
  { href: "/materiales", label: "Materiales" },
];

export default function Layout(props: { children?: JSX.Element }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const store = useAppStore();

  const [menuOpen, setMenuOpen] = createSignal(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await store.logout();
    navigate("/login", { replace: true });
  };

  // Iniciales para el fallback del avatar (la URL de Google puede caducar).
  const initials = () => {
    const name = store.currentUser?.name || store.currentUser?.email || "?";
    return name
      .split(/[\s@.]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
  };

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
            <div class="flex items-center space-x-3">
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

              {/* User menu */}
              <div class="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen())}
                  class="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Menú de usuario"
                >
                  <Show
                    when={store.currentUser?.picture_url}
                    fallback={
                      <div class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium">
                        {initials()}
                      </div>
                    }
                  >
                    <img
                      src={store.currentUser!.picture_url}
                      alt={store.currentUser!.name}
                      class="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        // Si la URL de Google caduca, fallback a iniciales
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                        (e.currentTarget as HTMLImageElement)
                          .parentElement!
                          .querySelector(".initials-fallback")!.classList.remove(
                          "hidden",
                        );
                      }}
                    />
                    <div class="initials-fallback hidden w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium">
                      {initials()}
                    </div>
                  </Show>
                </button>

                <Show when={menuOpen()}>
                  <div
                    class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <div class="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {store.currentUser?.email}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {store.currentUser?.name}
                      </div>
                      <span
                        class={`mt-1 inline-block px-2 py-0.5 text-xs rounded-full ${
                          store.currentUser?.role === "admin"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {store.currentUser?.role}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      class="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <LogoutIcon class="w-4 h-4" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </Show>
              </div>
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