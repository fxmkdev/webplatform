import type {
  SerializedEditorState,
  SerializedLexicalNode,
} from "@payloadcms/richtext-lexical/lexical";
import type { CollectionSlug, Field, Payload, TypedLocale } from "payload";

import type {
  LinkElementNode,
  RelationshipFieldType,
  Usage,
  UsagesConfig,
} from "./types.js";

import { localization } from "../../common/localization.js";

export async function findUsages(
  config: UsagesConfig,
  id: string,
  payload: Payload,
  locale: TypedLocale | undefined,
) {
  const {
    collections = [],
    collectionToFind,
    fieldType,
    globals = [],
  } = config;
  return (
    await Promise.all([
      ...collections.map(async (collectionSlug) => {
        const items = await payload.find({
          collection: collectionSlug,
          depth: 0,
          locale: "all",
          pagination: false,
        });

        const collectionConfig = payload.collections[collectionSlug].config;
        if (!collectionConfig.admin.useAsTitle) {
          throw new Error("Collection does not have useAsTitle configured");
        }

        const titleField = collectionConfig.admin.useAsTitle;

        return items.docs.flatMap((item) => {
          const title = (item as unknown as Record<string, unknown>)[
            titleField
          ] as Record<string, string> | string;
          return findItemUsagesOnCollection(
            fieldType,
            collectionToFind,
            id,
            item,
            collectionConfig.fields,
          ).map<Usage>((path) => ({
            id: item.id,
            type: "collection",
            collection: collectionSlug,
            fieldPath: path,
            label: collectionConfig.labels.singular,
            title:
              typeof title === "object"
                ? title[locale ?? localization.defaultLocale]
                : title,
          }));
        });
      }),
      ...globals.map(async (globalSlug) => {
        const global = await payload.findGlobal({
          slug: globalSlug,
          depth: 0,
          locale: "all",
        });

        const globalConfig = payload.globals.config.find(
          (c) => c.slug === globalSlug,
        );
        if (!globalConfig) {
          throw new Error("Global config not found");
        }

        return findItemUsagesOnCollection(
          fieldType,
          collectionToFind,
          id,
          global,
          globalConfig.fields,
        ).map<Usage>((path) => ({
          type: "global",
          fieldPath: path,
          global: globalSlug,
          label: globalConfig.label,
        }));
      }),
    ])
  ).flat();
}

function findItemUsagesOnCollection(
  fieldType: RelationshipFieldType,
  collectionToFind: CollectionSlug,
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>,
  fields: Field[],
) {
  const usagePaths: string[] = [];

  for (const field of fields) {
    if (field.type === fieldType && field.relationTo === collectionToFind) {
      if (data[field.name] === id) {
        addUsage(field.name);
      }
    } else if (field.type === "blocks") {
      for (let i = 0; i < data[field.name].length; i++) {
        const blockItem = data[field.name][i];
        const block = field.blocks.find(
          (block) => block.slug === blockItem.blockType,
        );
        if (!block) {
          console.warn("Block not found", blockItem.blockType);
          continue;
        }

        usagePaths.push(
          ...findItemUsagesOnCollection(
            fieldType,
            collectionToFind,
            id,
            blockItem,
            block.fields,
          ).map((path) => `${field.name}.${i}.${path}`),
        );
      }
    } else if (field.type === "array") {
      for (let i = 0; i < data[field.name].length; i++) {
        const arrayItem = data[field.name][i];
        usagePaths.push(
          ...findItemUsagesOnCollection(
            fieldType,
            collectionToFind,
            id,
            arrayItem,
            field.fields,
          ).map((path) => `${field.name}.${i}.${path}`),
        );
      }
    } else if (field.type === "group" && "name" in field) {
      usagePaths.push(
        ...findItemUsagesOnCollection(
          fieldType,
          collectionToFind,
          id,
          data[field.name],
          field.fields,
        ).map((path) => `${field.name}.${path}`),
      );
    } else if (field.type === "collapsible" || field.type === "row") {
      usagePaths.push(
        ...findItemUsagesOnCollection(
          fieldType,
          collectionToFind,
          id,
          data,
          field.fields,
        ),
      );
    } else if (field.type === "tabs") {
      for (let i = 0; i < field.tabs.length; i++) {
        const tab = field.tabs[i];
        const isNamedTab = "name" in tab && !!tab.name;

        usagePaths.push(
          ...findItemUsagesOnCollection(
            fieldType,
            collectionToFind,
            id,
            isNamedTab ? data[tab.name] : data,
            tab.fields,
          ).map((path) => (isNamedTab ? `${tab.name}.${path}` : path)),
        );
      }
    } else if (field.type === "richText" && field.localized) {
      if (data[field.name]) {
        for (const dataLocale of Object.keys(data[field.name])) {
          if (data[field.name][dataLocale]) {
            const linkElementNodes = getLinkElementNodes(
              (data[field.name][dataLocale] as SerializedEditorState).root,
            );

            for (const linkElementNode of linkElementNodes) {
              if (linkElementNode.fields.linkType === "internal") {
                const { doc } = linkElementNode.fields;
                if (doc.relationTo === collectionToFind && doc.value === id) {
                  addUsage(`${field.name}.${dataLocale}`);
                }
              }
            }
          }
        }
      }
    }
  }

  return usagePaths;

  function addUsage(fieldPath: string) {
    usagePaths.push(fieldPath);
  }
}

function getLinkElementNodes({
  children,
}: {
  children: SerializedLexicalNode[];
}): LinkElementNode[] {
  return children.flatMap((child) => {
    if (child.type === "link") {
      return [child as unknown as LinkElementNode];
    }

    if ("children" in child) {
      return getLinkElementNodes(
        child as { children: SerializedLexicalNode[] },
      );
    }

    return [];
  });
}
