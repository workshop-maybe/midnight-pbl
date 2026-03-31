import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  // Content routes — wrapped in app layout (nav + footer)
  layout("routes/app-layout.tsx", [
    // Course overview is the front door
    index("routes/course-overview.tsx"),

    ...prefix("learn", [
      // /learn redirects to / for backward compat
      index("routes/learn-redirect.ts"),
      // /learn/:moduleCode redirects to first lesson
      route(":moduleCode", "routes/module-redirect.tsx"),
      // Sidebar layout wraps lesson + assignment pages
      layout("routes/learn-layout.tsx", [
        // Static "assignment" must come before parameterized ":lessonIndex"
        route(":moduleCode/assignment", "routes/assignment-page.tsx"),
        route(":moduleCode/:lessonIndex", "routes/lesson-page.tsx"),
      ]),
    ]),
    route("dashboard", "./routes/dashboard.tsx"),
  ]),

  // API proxy — resource route (no component)
  route("api/gateway/*", "routes/api/gateway-proxy.ts"),

  // Transaction resource routes
  route("api/tx/build", "routes/api/tx-build.ts"),
  route("api/tx/register", "routes/api/tx-register.ts"),
  route("api/tx/stream/:txHash", "routes/api/tx-stream.ts"),
] satisfies RouteConfig;
