import { ReactNode } from "react";
import { Page as PageItem } from "./cms-plugin-types";

export type PageProps = {
  content: PageItem;
};

export function Page({ content }: PageProps): ReactNode {
  return (
    <>
      hello, world
      {/* TODO */}
      {/* {content.hero && <HeroBlocks data={content.hero} />}
      {content.content && <ContentBlocks data={content.content} />} */}
    </>
  );
}
