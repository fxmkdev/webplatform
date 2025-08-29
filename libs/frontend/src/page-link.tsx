import { Link, LinkProps } from "./link";
import { JSX, PropsWithChildren } from "react";
import { gracefully, isObject } from "./utils";
import { buildLocalizedRelativeUrl } from "./routing";
import { useTranslation } from "react-i18next";
import { Brand, NewLink } from "./cms-plugin-types";

export type PageLinkProps = {
  link?: NonNullable<Brand["navLinks"]>[number]["link"] | null;
} & Omit<PropsWithChildren<LinkProps>, "to">;

export function PageLink({ link, ...props }: PageLinkProps): JSX.Element {
  const { i18n } = useTranslation();
  return (
    <Link
      {...props}
      to={isObject(link) ? getPageLinkHref(link, i18n.language) : "about:blank"}
    />
  );
}

type PageLinkData = Pick<
  NewLink,
  "linkType" | "doc" | "queryString" | "fragment" | "url"
>;

export function getPageLinkHref(linkData: PageLinkData, locale: string) {
  return linkData.linkType === "internal"
    ? buildLocalizedRelativeUrl(
        locale,
        `${gracefully(linkData.doc, "pathname") ?? ""}${linkData.queryString ? `?${linkData.queryString}` : ""}${linkData.fragment ? `#${linkData.fragment}` : ""}`,
      )
    : (linkData.url ?? "about:blank");
}
