import { LocaleConfig } from "../cms-plugin-types";
import { buildLocalizedRelativeUrl } from "../routing";
import { LoaderFunctionArgs } from "react-router";
import { isAuthenticated } from "../auth.server";
import { cms } from "../cms.server";
import { getCanonicalRequestUrl } from "../routing.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const settings = await cms().getSettings(request);
  if (settings.maintenanceScreen?.show && !(await isAuthenticated(request))) {
    throw new Response(null, {
      status: 401,
      statusText: "Unauthorized",
    });
  }

  const [pages] = await Promise.all([getAllPages()]);

  const content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${(settings.publishedLocales.publishedLocales as LocaleConfig[])
      .flatMap((l) =>
        pages.map(
          (p) => `  <url>
    <loc>${getCanonicalRequestUrl(request).origin}${buildLocalizedRelativeUrl(l.id, p.pathname[l.id])}</loc>
    <lastmod>${p.updatedAt.split("T")[0]}</lastmod>
  </url>`,
        ),
      )
      .join("\n")}
</urlset>`;

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      encoding: "UTF-8",
    },
  });
}

async function getAllPages() {
  return (await cms().loadData(`pages`, "all", 0, {})).docs as {
    pathname: Record<string, string>;
    updatedAt: string;
  }[];
}
