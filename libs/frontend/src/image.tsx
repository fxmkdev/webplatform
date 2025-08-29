import {
  DetailedHTMLProps,
  ImgHTMLAttributes,
  ReactNode,
  Ref,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useEnvironment } from "./environment";
import { mergeRefs } from "./utils";

export type ImageProps = {
  src: string;
  alt?: string;
  className?: string;
  transformation?: ImageTransformation;
  onLoadingFinished?: () => void;
  layout: "fixed" | "responsive";
  srcMultiplier?: number;
  ref?: Ref<HTMLImageElement>;
} & Pick<
  DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>,
  "loading" | "sizes"
>;

export function Image({
  src,
  alt,
  layout = "responsive",
  srcMultiplier = 3,
  className,
  transformation,
  onLoadingFinished,
  ref,
  ...props
}: ImageProps): ReactNode {
  const { imagekitBaseUrl, useImageCacheBuster } = useEnvironment();
  const [isLoading, setIsLoading] = useState(true);
  const localRef = useRef<HTMLImageElement>(null);
  const cacheBusterId = useId();

  const onLoad = useCallback(
    function onLoad() {
      setIsLoading(false);
      onLoadingFinished?.();
    },
    [onLoadingFinished],
  );

  // Image might already be loaded, see https://stackoverflow.com/a/59153135
  useEffect(() => {
    if (isLoading && localRef.current!.complete) {
      onLoad();
    }
  }, [onLoad, isLoading, localRef]);

  let srcSet = undefined;
  if (layout === "fixed") {
    srcSet = `${getSrc()}, ${getSrc(2)} 2x, ${getSrc(3)} 3x`;
  } else if (layout === "responsive") {
    if (!transformation?.width) {
      throw new Error("transformation.width is required for responsive layout");
    }

    srcSet = Array.from({ length: srcMultiplier })
      .map((_, i) => `${getSrc(i + 1)} ${transformation.width! * (i + 1)}w`)
      .join(", ");
  }

  function getSrc(devicePixelRatio: number = 1) {
    const ratioAdjustedTransformation = transformation
      ? {
          ...transformation,
          width: transformation.width
            ? transformation.width * devicePixelRatio
            : undefined,
          height: transformation.height
            ? transformation.height * devicePixelRatio
            : undefined,
        }
      : undefined;

    const fullSrcUrl = new URL(
      `${imagekitBaseUrl}${ratioAdjustedTransformation ? `/${toImagekitTransformationString(ratioAdjustedTransformation)}` : ""}${src}`,
    );
    if (useImageCacheBuster) {
      // Add cache buster to avoid flaky Chromatic regression tests
      // See https://www.chromatic.com/docs/troubleshooting-snapshots/#why-am-i-seeing-inconsistent-snapshots-for-a-component-using-srcset
      fullSrcUrl.searchParams.set("cacheBuster", cacheBusterId);
    }

    return fullSrcUrl.toString();
  }

  return (
    <img
      {...props}
      srcSet={srcSet}
      className={className}
      alt={alt}
      ref={mergeRefs(ref, localRef)}
      onLoad={onLoad}
    />
  );
}

export type ImageTransformation = {
  width?: number;
  height?: number;
  aspectRatio?: { width: number; height: number };
  cropStrategy?: "maintain_ratio";
  focus?: "auto" | "custom";
  enhancement?: "grayscale";
  blur?: number;
};

export function toImagekitTransformationString(
  transformation: ImageTransformation,
) {
  const transformationItems = Object.entries(transformation)
    .filter(([, value]) => value != null)
    .map(([key]) =>
      toImagekitTransformationItemString(
        transformation,
        key as keyof ImageTransformation,
      ),
    );

  return `tr:${transformationItems.join(",")}`;
}

function toImagekitTransformationItemString(
  transformation: ImageTransformation,
  key: keyof ImageTransformation,
) {
  switch (key) {
    case "width":
      return `w-${transformation.width!}`;
    case "height":
      return `h-${transformation.height!}`;
    case "aspectRatio":
      return `ar-${transformation.aspectRatio!.width}-${transformation.aspectRatio!.height}`;
    case "cropStrategy":
      return `c-${transformation.cropStrategy!}`;
    case "focus":
      return `fo-${transformation.focus!}`;
    case "enhancement":
      return `e-${transformation.enhancement!}`;
    case "blur":
      return `bl-${transformation.blur!}`;
    default:
      throw new Error(`Unsupported key: ${key}`);
  }
}
