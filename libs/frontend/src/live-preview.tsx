import { useLivePreview } from "@payloadcms/live-preview-react";
import { ReactNode } from "react";
import { useEnvironment } from "./environment";

export type OptInLivePreviewProps<TData> = {
  path: string;
  data: TData;
  depth: number;
  children: (data: TData) => ReactNode;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function OptInLivePreview<TData extends Record<string, any>>({
  children,
  path,
  data,
  depth,
}: OptInLivePreviewProps<TData>): ReactNode {
  const { preview } = useEnvironment();

  return preview === path ? (
    <LivePreview<TData> data={data} depth={depth}>
      {children}
    </LivePreview>
  ) : (
    children(data)
  );
}

type LivePreviewProps<TData> = {
  data: TData;
  depth: number;
  children: (data: TData) => ReactNode;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LivePreview<T extends Record<string, any>>({
  data,
  depth,
  children,
}: LivePreviewProps<T>) {
  const { payloadCmsBaseUrl } = useEnvironment();
  const { data: livePreviewData } = useLivePreview<T>({
    initialData: data,
    serverURL: payloadCmsBaseUrl,
    depth,
  });

  return children(livePreviewData);
}
