import { Resource } from "i18next";

export const adminResources: Resource = {
  en: {
    admin: {
      previewBar: {
        message:
          "<strong>Preview</strong> ‧ This website is currently in maintenance mode and not accessible publicly.",
        manageContent: "Manage Content…",
        logOut: "Log Out",
        versionInfo: "Version: {{ version }}",
      },
    },
  },
  es: {
    admin: {
      previewBar: {
        message:
          "<strong>Vista previa</strong> ‧ Este sitio web se encuentra actualmente en modo de mantenimiento y no es accesible públicamente.",
        manageContent: "Administrar contenido…",
        logOut: "Cerrar sesión",
        versionInfo: "Versión: {{ version }}",
      },
    },
  },
};
