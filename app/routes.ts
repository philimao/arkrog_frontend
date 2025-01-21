import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  layout("routes/BasicLayout.tsx", [
    index("modules/PageNav/PageNavbar.tsx"),
    // route("/test", "modules/PageNav/PageNavbar.tsx"),
  ]),
] satisfies RouteConfig;
