import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  data,
} from "react-router";

import type { Route } from "./+types/root";
import { QueryProvider } from "~/components/providers/query-provider";
import { ErrorPage } from "~/components/error/error-boundary";
import { BRANDING } from "~/config/branding";
import type { PublicEnv } from "~/config/midnight";
import "~/styles/globals.css";

/**
 * Root loader — exposes public env vars to the client.
 * Secrets (ANDAMIO_API_KEY) are never included.
 */
export function loader() {
  const publicEnv: PublicEnv = {
    ANDAMIO_GATEWAY_URL: process.env.ANDAMIO_GATEWAY_URL ?? "",
    CARDANO_NETWORK: process.env.CARDANO_NETWORK ?? "preprod",
    COURSE_ID: process.env.COURSE_ID,
    ACCESS_TOKEN_POLICY_ID: process.env.VITE_ACCESS_TOKEN_POLICY_ID,
  };

  return data({
    publicEnv,
    brandName: BRANDING.name,
    brandDescription: BRANDING.description,
  });
}

/**
 * Links — Google Fonts for Outfit, Urbanist, and Newsreader.
 */
export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Outfit:wght@400;500;600;700&family=Urbanist:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap",
  },
];

/**
 * Root meta tags.
 */
export const meta: Route.MetaFunction = () => [
  { title: BRANDING.fullTitle },
  { name: "description", content: BRANDING.description },
  { name: "theme-color", content: BRANDING.colors.bgDark },
];

/**
 * Root Layout — wraps everything including ErrorBoundary.
 *
 * Renders the HTML shell: <html>, <head>, <body>, Scripts, ScrollRestoration.
 */
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-midnight text-mn-text font-body antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/**
 * App component — renders QueryClientProvider + Outlet.
 *
 * MeshProvider and AuthProvider are NOT here — they go in the
 * app-layout route (Unit 3) because they require browser APIs.
 */
export default function App() {
  return (
    <QueryProvider>
      <Outlet />
    </QueryProvider>
  );
}

/**
 * Root ErrorBoundary — styled error page for unhandled errors.
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorPage error={error} />;
}
