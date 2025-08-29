import { relative, RouteConfigEntry } from "@react-router/dev/routes";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const filename = fileURLToPath(import.meta.url);
const directory = dirname(filename);

const { index, route } = relative(join(directory, "routes"));

export const routes = [
  index("./home.js"),
  route("/*", "./page.js"),
  route("/api/version", "./version.js"),
  route("/sitemap.xml", "./sitemap.js"),
  route("/robots.txt", "./robots.js"),
  route("/logout", "./logout.js"),
  route("/api/purge-cache", "./api.purge-cache.js"),
  route("/api/ui-labels", "./api.ui-labels.js"),
] satisfies RouteConfigEntry[];
