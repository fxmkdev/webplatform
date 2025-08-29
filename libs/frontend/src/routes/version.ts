import { getVersion } from "../version.server";

export async function loader() {
  return Response.json({ version: await getVersion() });
}
