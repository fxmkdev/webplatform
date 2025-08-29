import { type PropsWithChildren, createContext, useContext } from "react";

export type Theme = {
  loadingBarColor: string;
  logoTextColor: string;
  headingTextColor: string;
  whiteHighlightTextColor: string;
  bannerBackgroundColor: string;
  lightBackgroundColor: string;
  buttonColors: {
    primary: {
      backgroundColor: string;
      textColor: string;
      hoverBackgroundColor: string;
      hoverTextColor: string;
    };
    secondary: {
      backgroundColor: string;
      textColor: string;
      hoverBackgroundColor: string;
      hoverTextColor: string;
    };
    focusOutlineColor: string;
  };
  navButtonClassName: string;
  strongBackgroundGradientColors: string;
  paragraphTextColor: string;
  linkColors: {
    textColor: string;
    hoverTextColor: string;
  };
  mapPinCssColors: {
    background: string;
    glyph: string;
    border: string;
  };
};

export type ThemeProviderProps = {
  brandId: string;
};

export function ThemeProvider({
  brandId,
  children,
}: PropsWithChildren<ThemeProviderProps>) {
  const theme = themesByBrand[brandId];

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export const ThemeContext = createContext<Theme | undefined>(undefined);

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return theme;
}

export const themesByBrand: Record<string, Theme> = {
  puerta: {
    loadingBarColor: "bg-puerta-500",
    logoTextColor: "text-neutral-900",
    headingTextColor: "text-puerta-600",
    whiteHighlightTextColor: "text-puerta-200",
    bannerBackgroundColor: "bg-puerta-800",
    lightBackgroundColor: "bg-puerta-100",
    buttonColors: {
      primary: {
        backgroundColor: "bg-puerta-500",
        textColor: "text-white",
        hoverBackgroundColor: "hover:bg-puerta-200",
        hoverTextColor: "hover:text-puerta-800",
      },
      secondary: {
        backgroundColor: "bg-puerta-200",
        textColor: "text-puerta-800",
        hoverBackgroundColor: "hover:bg-puerta-300",
        hoverTextColor: "hover:text-puerta-900",
      },
      focusOutlineColor: "focus-visible:outline-puerta-600",
    },
    navButtonClassName: "border-puerta-500 bg-puerta-50 text-puerta-700",
    strongBackgroundGradientColors: "from-puerta-100 to-puerta-300",
    paragraphTextColor: "text-puerta-800",
    linkColors: {
      textColor: "text-puerta-600",
      hoverTextColor: "hover:text-puerta-700",
    },
    mapPinCssColors: {
      background: "#b37332",
      glyph: "#ffffff",
      border: "#ffffff",
    },
  },
  aqua: {
    loadingBarColor: "bg-aqua-400",
    logoTextColor: "text-aqua-600",
    headingTextColor: "text-aqua-600",
    whiteHighlightTextColor: "text-aqua-200",
    bannerBackgroundColor: "bg-aqua-500",
    lightBackgroundColor: "bg-aqua-50",
    buttonColors: {
      primary: {
        backgroundColor: "bg-aqua-400",
        textColor: "text-white",
        hoverBackgroundColor: "hover:bg-aqua-200",
        hoverTextColor: "hover:text-aqua-800",
      },
      secondary: {
        backgroundColor: "bg-aqua-100",
        textColor: "text-aqua-800",
        hoverBackgroundColor: "hover:bg-aqua-300",
        hoverTextColor: "hover:text-aqua-950",
      },
      focusOutlineColor: "focus-visible:outline-aqua-600",
    },
    navButtonClassName: "border-aqua-400 bg-aqua-50 text-aqua-700",
    strongBackgroundGradientColors: "from-aqua-50 to-aqua-200",
    paragraphTextColor: "text-aqua-950",
    linkColors: {
      textColor: "text-aqua-600",
      hoverTextColor: "hover:text-aqua-700",
    },
    mapPinCssColors: {
      background: "#2dd4bf",
      glyph: "#ffffff",
      border: "#ffffff",
    },
  },
  azul: {
    loadingBarColor: "bg-azul-800",
    logoTextColor: "text-azul-900",
    headingTextColor: "text-azul-900",
    whiteHighlightTextColor: "text-azul-200",
    bannerBackgroundColor: "bg-azul-950",
    lightBackgroundColor: "bg-azul-50",
    buttonColors: {
      primary: {
        backgroundColor: "bg-azul-950",
        textColor: "text-white",
        hoverBackgroundColor: "hover:bg-azul-200",
        hoverTextColor: "hover:text-azul-900",
      },
      secondary: {
        backgroundColor: "bg-azul-100",
        textColor: "text-azul-900",
        hoverBackgroundColor: "hover:bg-azul-300",
        hoverTextColor: "hover:text-azul-950",
      },
      focusOutlineColor: "focus-visible:outline-azul-900",
    },
    navButtonClassName: "border-azul-950 bg-azul-50 text-azul-800",
    strongBackgroundGradientColors: "from-azul-50 to-azul-200",
    paragraphTextColor: "text-azul-950",
    linkColors: {
      textColor: "text-azul-800",
      hoverTextColor: "hover:text-azul-900",
    },
    mapPinCssColors: {
      background: "#172554",
      glyph: "#ffffff",
      border: "#ffffff",
    },
  },
};
