import { LoaderFunctionArgs } from "react-router";
import { getCanonicalRequestUrl } from "../routing.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const content = `User-Agent: *
Disallow: 
Allow: /

Sitemap: ${new URL("/sitemap.xml", getCanonicalRequestUrl(request)).href}`;

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      encoding: "UTF-8",
    },
  });
}
