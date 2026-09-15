import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useHref,
  useNavigate,
} from "react-router";

import type { Route } from "./+types/root";
import app from "./styles/app.css?url";
import variable from "./styles/variable.css?url";
import basic from "./styles/basic.css?url";
import githubMarkdown from "./styles/github-markdown.css?url";
import React from "react";
import { HeroUIProvider } from "@heroui/react";

const siteSeo = {
  siteName: "影语集",
  title: "影语集 - 集成战略攻略分享",
  description:
    "影语集为明日方舟集成战略玩家提供优质的攻略参考与学习资源。网站功能包含无藏收录、伤害计算、赛事整理和地图记录，帮助玩家快速规划阵容、学习经验。",
  keywords:
    "明日方舟, 集成战略, 影语集, 集成战略攻略, 伤害计算, 无藏收录, 赛事整理, 地图记录",
  canonical: "https://arkrog.com/",
  ogImage: "https://arkrog.com/favicon.ico",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteSeo.siteName,
  url: siteSeo.canonical,
  description: siteSeo.description,
  inLanguage: "zh-CN",
};

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  // Preload CSS
  { rel: "preload", href: app, as: "style" },
  { rel: "stylesheet", href: app },
  { rel: "preload", href: variable, as: "style" },
  { rel: "stylesheet", href: variable },
  { rel: "preload", href: basic, as: "style" },
  { rel: "stylesheet", href: basic },
  { rel: "stylesheet", href: githubMarkdown },
];

export function Layout({ children }: { children: React.ReactNode }) {
  // const isDev = import.meta.env.MODE === "development";
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="description" content={siteSeo.description} />
        <meta name="keywords" content={siteSeo.keywords} />
        <meta name="robots" content="index,follow" />
        <meta name="author" content={siteSeo.siteName} />
        <meta property="og:title" content={siteSeo.title} />
        <meta property="og:description" content={siteSeo.description} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={siteSeo.siteName} />
        <meta property="og:url" content={siteSeo.canonical} />
        <meta property="og:locale" content="zh_CN" />
        <meta property="og:image" content={siteSeo.ogImage} />
        <link rel="canonical" href={siteSeo.canonical} />
        <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
        {/*{isDev && <script src="http://localhost:8097"></script>}*/}
        <title>{siteSeo.title}</title>
        <Meta />
        <Links />
      </head>
      <body className="dark">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const navigate = useNavigate();

  return (
    <React.StrictMode>
      <HeroUIProvider navigate={navigate} useHref={useHref}>
        <Outlet />
      </HeroUIProvider>
    </React.StrictMode>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "应用遇到了一些问题，请刷新页面";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : message;
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container">
      <h1 className="text-lg font-bold m3-4">{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

export function HydrateFallback() {
  return <div />;
}
