import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  // Landing page — outside the app layout (has its own AppShell)
  index("routes/landing.tsx"),

  // Content routes — wrapped in app layout (nav + footer)
  layout("routes/app-layout.tsx", [
    ...prefix("learn", [
      index("routes/course-overview.tsx"),
      route(":moduleCode", "routes/module-page.tsx"),
      // Static "assignment" must come before parameterized ":lessonIndex"
      route(":moduleCode/assignment", "routes/assignment-page.tsx"),
      route(":moduleCode/:lessonIndex", "routes/lesson-page.tsx"),
    ]),
  ]),

  // API proxy — resource route (no component)
  route("api/gateway/*", "routes/api/gateway-proxy.ts"),
] satisfies RouteConfig;
