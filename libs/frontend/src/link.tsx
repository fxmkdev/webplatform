import { JSX } from "react";
import {
  Link as ReactRouterLink,
  LinkProps as ReactRouterLinkProps,
} from "react-router";

export type LinkProps = Omit<ReactRouterLinkProps, "to"> & {
  ref?: React.Ref<HTMLAnchorElement>;
  to: string;
};

export function Link({ to, children, ...props }: LinkProps): JSX.Element {
  const isExternal = to.startsWith("http://") || to.startsWith("https://");
  return (
    <ReactRouterLink
      to={to}
      {...props}
      {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {children}
    </ReactRouterLink>
  );
}
