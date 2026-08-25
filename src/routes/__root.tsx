import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Страница не найдена</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Запрашиваемая страница не существует или была перемещена.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-wash-sky px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-wash-sky-dark"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Страница не загрузилась
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Что-то пошло не так. Попробуйте обновить страницу или вернуться на главную.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-wash-sky px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-wash-sky-dark"
          >
            Попробовать снова
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            На главную
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "JAHAN — Мойка самообслуживания" },
      { name: "description", content: "Современная мойка самообслуживания в Таразе. Проверьте баланс и пополните клубную карту JAHAN по номеру телефона." },
      { name: "author", content: "JAHAN" },
      { property: "og:title", content: "JAHAN — Мойка самообслуживания" },
      { property: "og:description", content: "Современная мойка самообслуживания в Таразе. Проверьте баланс и пополните клубную карту JAHAN по номеру телефона." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@cars_wash_kz" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-wash-sky text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 17h-1c0-2.35-1.53-4.3-3.56-5.5C15.36 10.5 16 9.05 16 8c0-2.21-1.79-4-4-4S8 5.79 8 8c0 1.05.64 2.5 1.56 3.5C7.53 12.7 6 14.65 6 17H5" />
              <path d="M12 13v4" />
              <path d="M12 21h.01" />
            </svg>
          </span>
          JAHAN
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to="/"
            activeProps={{ className: "text-wash-sky font-semibold" }}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Главная
          </Link>
          <Link
            to="/balance"
            activeProps={{ className: "text-wash-sky font-semibold" }}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Баланс
          </Link>
          <Link
            to="/popolnenie"
            activeProps={{ className: "text-wash-sky font-semibold" }}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Пополнить
          </Link>
          <Link
            to="/admin"
            activeProps={{ className: "text-wash-sky font-semibold" }}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Админ
          </Link>
        </nav>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  );
}
