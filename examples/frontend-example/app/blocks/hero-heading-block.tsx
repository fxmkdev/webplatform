import { type Page } from "@fxmk/frontend";

type HeroHeadingBlockProps = Partial<
  NonNullable<Page["hero"]>[number] & {
    blockType: "HeroHeading";
  }
>;

export function HeroHeadingBlock({ heading, image }: HeroHeadingBlockProps) {
  return image ? (
    <div className="relative min-h-72 shadow-md md:min-h-96">
      {/* <SlideImage media={image} withPreview={true} alignment="center" />
      <OverlayTitle
        headingLevel={2}
        position="center"
        text={
          heading
            ? (richTextRoot(
                paragraph(text(heading)),
              ) as unknown as OverlayTitleProps["text"])
            : undefined
        }
        overlay="intense"
      /> */}
      <div>some picture</div>
      <h2 className="text-4xl">{heading}</h2>
    </div>
  ) : (
    <div className="flex min-h-28 items-end justify-center px-8 py-4 text-neutral-700 md:min-h-40 md:py-8">
      <h2 className="text-4xl">{heading}</h2>
    </div>
  );
}
