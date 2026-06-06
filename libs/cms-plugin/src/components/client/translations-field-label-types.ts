import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

export type AllLocalesText = {
  value:
    | null
    | Record<string, null | SerializedEditorState | string | undefined>
    | undefined;
};
