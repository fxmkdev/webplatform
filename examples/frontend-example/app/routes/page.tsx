import { useLoaderData } from "react-router";
import type { ReactNode } from "react";
import { OptInLivePreview, PAGE_DEPTH, type pageLoader } from "@fxmk/frontend";
import { Page } from "~/page";

export { pageLoader as loader, pageMeta as meta } from "@fxmk/frontend";

export default function Route(): ReactNode {
  const { dataPath, content } = useLoaderData<typeof pageLoader>();

  return (
    <OptInLivePreview path={dataPath} data={content} depth={PAGE_DEPTH}>
      {(data) => <Page content={data} />}
    </OptInLivePreview>
  );
}
