import { Brand, Page } from "./cms-plugin-types";

export function getPageTitle(page: Page) {
  return getTitle(page.title ?? undefined, page.brand as Brand);
}

export function getTitle(title: string | undefined, brand: Brand | undefined) {
  const baseTitle = brand?.baseTitle;

  if (!baseTitle) {
    return title ?? "";
  }

  return title ? `${title} \u00B7 ${baseTitle}` : baseTitle;
}
