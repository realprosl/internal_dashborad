import { JSX, Show, createSignal, createEffect, onCleanup } from "solid-js";
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
  let buttonRef: HTMLButtonElement | undefined;
  let menuRef: HTMLDivElement | undefined;

  const handleLogout = async () => {
    setMenuOpen(false);
    await store.logout();
    navigate("/login", { replace: true });
  };

  // Iniciales: usa el nombre si existe; si no, la parte local del email
  // (antes del @); si tampoco, "U". Nunca devuelve "--" ni vacío.
  const initials = () => {
    const name = (store.currentUser?.name || "").trim();
    const email = (store.currentUser?.email || "").trim();
    const local = email.includes("@") ? email.split("@")[0] : email;
    const source = name || local || "U";
    const parts = source
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2);
    const result = parts.map((p) => p[0]?.toUpperCase() || "").join("");
    return result || "?";
  };

  // Cerrar el dropdown cuando se hace click fuera del botón o del menú.
  // Se monta cuando menuOpen() es true y se limpia al cerrar.
  createEffect(() => {
    if (!menuOpen()) return;

    // setTimeout 0 → el click que abrió el menú no lo cierra inmediatamente
    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (buttonRef?.contains(target)) return; // click en el toggle, no cerrar
      if (menuRef?.contains(target)) return; // click dentro del menú, no cerrar
      setMenuOpen(false);
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    onCleanup(() => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    });
  });

  // Avatar reutilizable (botón + dropdown). Si picture_url carga bien se
  // muestra; si falla o está vacía → iniciales.
  const AvatarImg = () => {
    const [errored, setErrored] = createSignal(false);
    const url = () => store.currentUser?.picture_url;
    return (
      <Show
        when={url() && !errored()}
        fallback={
          <div
            data-fallback="initials"
            class="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0"
          >
            {initials()}
          </div>
        }
      >
        <img
          src={url()!}
          alt={store.currentUser?.name || store.currentUser?.email || "Usuario"}
          class="w-9 h-9 rounded-full object-cover flex-shrink-0"
          onError={() => setErrored(true)}
          referrerpolicy="no-referrer"
        />
      </Show>
    );
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

              {/* User menu — avatar + email visible, dropdown con detalles */}
              <div class="relative">
                <button
                  ref={buttonRef}
                  onClick={() => setMenuOpen(!menuOpen())}
                  class="flex items-center space-x-3 pl-2 pr-3 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Menú de usuario"
                >
                  <AvatarImg />
                  <span
                    class="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[200px] truncate"
                    title={store.currentUser?.email || ""}
                  >
                    {store.currentUser?.email}
                  </span>
                </button>

                <Show when={menuOpen()}>
                  <div
                    ref={menuRef}
                    class="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                  >
                    <div class="flex items-center space-x-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <AvatarImg />
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {store.currentUser?.name || "Usuario"}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {store.currentUser?.email}
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
      <main class="max-w-[1600px] mx-auto py-6 sm:px-6 lg:px-8">
        {props.children}
      </main>
    </div>
  );
}