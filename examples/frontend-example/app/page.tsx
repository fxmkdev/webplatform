import type { ReactNode } from "react";
import { type Page as PageItem } from "@fxmk/frontend";
import { HeroBlocks } from "./blocks/hero-blocks";

export type PageProps = {
  content: PageItem;
};

export function Page({ content }: PageProps): ReactNode {
  return <>{content.hero && <HeroBlocks data={content.hero} />}</>;
}
