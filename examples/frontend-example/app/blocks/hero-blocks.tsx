import type { Page } from "@fxmk/frontend";
import { HeroHeadingBlock } from "./hero-heading-block";

export type HeroBlocksProps = {
  data: NonNullable<Page["hero"]>;
};

export function HeroBlocks({ data }: HeroBlocksProps) {
  return data.map((block) => {
    switch (block.blockType) {
      case "HeroHeading":
        return <HeroHeadingBlock key={block.id} {...block} />;
      // case "HeroVideo":
      //   return <HeroVideoBlock key={block.id} {...block} />;
      // case "HeroSlides":
      //   return <HeroSlidesBlock key={block.id} {...block} />;
    }
  });
}
