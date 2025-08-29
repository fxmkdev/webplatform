import { LoaderFunctionArgs } from "react-router";
import { handleIncomingRequest } from "../routing.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await handleIncomingRequest(request);

  throw new Error("Redirection to localized route failed");
}

// This will never be rendered, but having a default export enables the ErrorBoundary to be used in case of an error
export default function Route() {
  return null;
}
