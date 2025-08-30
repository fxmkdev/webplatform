import { routes } from "@fxmk/frontend";
import { route, type RouteConfig } from "@react-router/dev/routes";

export default [
  ...routes,
  route("/*", "./routes/page.tsx"),
] satisfies RouteConfig;
