import { mongooseAdapter } from "@payloadcms/db-mongodb";
import path from "path";
import { buildConfig } from "payload";
import { cmsPlugin, textField } from "@fxmk/cms-plugin";
import { fileURLToPath } from "url";
import { en } from "payload/i18n/en";
import { es } from "payload/i18n/es";
import { RoomListBlock } from "./blocks/room-list/config";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const serverUrl = process.env.SERVER_URL;
const livePreviewBaseUrl = process.env.LIVE_PREVIEW_BASE_URL || serverUrl;

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || "",
  }),
  plugins: [
    cmsPlugin({
      additionalContentBlocks: [RoomListBlock],
      additionalUiLabelFields: [
        textField({ name: "test", label: "Test Field" }),
      ],
      deeplApiKey: process.env.DEEPL_API_KEY,
      openaiApiKey: process.env.OPENAI_API_KEY,
      publicMediaBaseUrl: process.env.PUBLIC_MEDIA_BASE_URL,
      media: {
        organization: "folders",
      },
      serverUrl,
      mediaS3Storage: {
        bucket: process.env.MEDIA_S3_BUCKET || "",
        accessKeyId: process.env.MEDIA_S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.MEDIA_S3_SECRET_ACCESS_KEY || "",
        region: process.env.MEDIA_S3_REGION || "",
      },
      livePreviewBaseUrl,
    }),
  ],
  i18n: {
    supportedLanguages: { en, es },
    translations: {
      en: {
        custom: {
          roomList: {
            roomRowLabel: "Room",
          },
        },
      },
    },
  },
});
