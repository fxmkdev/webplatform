export const en = {
  cmsPlugin: {
    admin: {
      groups: { admin: "Administration", content: "Content" },
    },
    apiKeys: {
      labels: {
        plural: "API Keys",
        singular: "API Key",
      },
      remark: { label: "Remark" },
      role: {
        label: "Role",
        options: {
          cicd: "CI/CD",
          e2eTests: "E2E Tests",
          frontend: "Frontend",
        },
      },
    },
    banners: {
      admin: {
        description:
          "A banner is useful to announce promotions or important news and can have a call to action. Here you can create and manage banners. Go to Brands to enable a banner on all pages of the brand.",
      },
      edit: {
        label: "Edit",
        message: { label: "Message" },
      },
      labels: {
        plural: "Banners",
        singular: "Banner",
      },
      usages: { label: "Usages" },
    },
    brands: {
      navLinkRowLabel: "Navigation Link {{ n }}",
      rootPath: {
        alreadyExists: "There is already a brand with this root path.",
        mustNotEndWithSlash: "The root path must not end with '/'.",
        mustStartWithSlash: "The root path must start with '/'.",
        overlaps: "The root path overlaps with another brand's root path.",
      },
    },
    common: {
      id: "ID",
      loading: "Loading…",
      usages: {
        label: "Usages",
      },
    },
    fields: {
      callToAction: {
        label: "Call to Action (CTA)",
        label_field: { label: "Label" },
        variant: {
          label: "Variant",
          options: {
            primary: "Primary",
            secondary: "Secondary",
          },
        },
      },
      description: {
        label: "Description",
      },
      elementId: {
        description:
          "An element ID allows you to link to this element from other parts of the site. If the ID is 'about-us', you can link to it with an URL ending in '#about-us'.",
        label: "Element ID",
      },
      image: { label: "Image" },
      link: {
        doc: { label: "Choose a document to link" },
        fragment: {
          description:
            "If a fragment is provided, it will be appended to the URL with a '#' character. Use this to link to a section of a page, defined by an 'Element ID'.",
          label: "Fragment",
        },
        label: "Link",
        linkType: {
          description:
            "Choose between entering a custom text URL or linking to another document.",
          label: "Link Type",
          options: {
            custom: "Custom URL",
            internal: "Internal Link",
          },
        },
        queryString: {
          description:
            "If a query string is provided, it will be appended to the URL with a '?' character.",
          label: "Query String",
        },
        url: { label: "URL" },
      },
      moreOptions: { label: "More Options" },
      overlayTextBox: {
        callToActionLabel: {
          description: "Leave blank to hide the call to action.",
          label: "Call to Action Label",
        },
        heading: { label: "Heading" },
        label: "Overlay Text Box",
        position: {
          label: "Position",
          options: {
            bottomLeft: "Bottom Left",
            bottomRight: "Bottom Right",
            topLeft: "Top Left",
            topRight: "Top Right",
          },
        },
      },
      richText: { label: "Text" },
      show: { label: "Show" },
      text: { label: "Text" },
      textarea: { label: "Text" },
      usages: { label: "Usages" },
    },
    globals: {
      common: {
        label: "Common",
        pageNotFoundScreen: {
          description:
            "This screen is shown when a user tries to access a page that does not exist.",
          heading: {
            label: "Heading",
          },
          label: "Page Not Found Screen",
        },
      },
    },
    heroSlides: {
      slideRowLabel: "Slide {{ n }}",
    },
    localeConfigs: {
      deeplSourceLanguage: { label: "DeepL Source Language" },
      deeplTargetLanguage: { label: "DeepL Target Language" },
      displayLabel: {
        description:
          "The label to be displayed in the application. This should be the name in the respective language so that it can be easily recognized by speakers of that language. E.g. 'English' for English, 'Español' for Spanish.",
        label: "Display Label",
      },
      googleMapsLanguage: { label: "Google Maps Language" },
      labels: {
        plural: "Locale Configurations",
        singular: "Locale Configuration",
      },
      locale: { label: "Locale" },
    },
    media: {
      alt: {
        description:
          "A brief description of the media for screen readers and search engines. It is not displayed on the page but is important for accessibility. For images an alt text can be generated automatically using OpenAI.",
        label: "Alternative Text",
      },
      category: {
        description:
          "Add a media category to easily find this media. When you select the media, you can filter by this category.",
        label: "Category",
      },
      comment: {
        description:
          "Add an internal comment to note any important information about this media, e.g. the source.",
        label: "Comment (internal)",
      },
      generate: {
        confirm:
          "This will send the image to OpenAI to generate an alternative text for the current locale.\n\nThe existing alternative text will be overwritten. Do you want to continue?",
        failure: "Failed to generate alt text",
        generate: "Generate",
        generating: "Generating…",
        pleaseSaveYourChangesToGenerateAltText:
          "Please save your changes to generate the alt text.",
        success: "Alt text generated successfully",
      },
      labels: {
        plural: "Media",
        singular: "Media",
      },
    },
    mediaCategories: {
      name: {
        label: "Name",
      },
      admin: {
        description:
          "Use media categories to organize your media as you find it useful. When you select media, you can filter by category.",
      },
      labels: {
        plural: "Media Categories",
        singular: "Media Category",
      },
      media: {
        label: "Media",
      },
    },
    pages: {
      labels: { plural: "Pages", singular: "Page" },
      pathname: {
        alreadyExists: "There is already a page with this pathname.",
        createRedirect:
          "Create a redirect from '{{ previousPathname }}' to this page.",
        lock: "Lock",
        pathnameBelongsToMoreSpecificBrand:
          "The pathname belongs to the more specific brand root path '{{ prefix }}'.",
        pathnameMustStartWithPrefix:
          "The pathname must start with '{{ prefix }}'.",
        pleaseEnterAPathname: "Please enter a pathname.",
        pleaseSelectABrandFirst: "Please select a brand first.",
        unlock: "Unlock",
      },
    },
    redirects: {
      fromPathname: { label: "From Pathname" },
      labels: {
        plural: "Redirects",
        singular: "Redirect",
      },
      to: {
        fragment: {
          description:
            "If a fragment is provided, it will be appended to the URL with a '#' character. Use this to link to a section of a page, defined by an 'Element ID'.",
          label: "Fragment",
        },
        label: "Redirect To",
        page: { label: "Page" },
        queryString: {
          description:
            "If a query string is provided, it will be appended to the URL with a '?' character.",
          label: "Query String",
        },
      },
    },
    rowLabel: {
      item: "Item {{ n }}",
      link: "Link {{ n }}",
      linkGroup: "Link Group {{ n }}",
    },
    translations: {
      autoTranslate: "Auto-Translate",
      autoTranslatedSuccessfully: "Auto-translated successfully",
      confirmAutoTranslate:
        "This will translate the {{ sourceLocale }} text to the other locales and overwrite the other translations.\n\nDo you want to proceed?",
      currentLocale: "Current Locale",
      failedToAutoTranslate: "Failed to auto-translate",
      failedToLoadTranslations: "Failed to load translations.",
      goToTranslation: "Go to Translation",
      pleaseSaveYourChangesToEnableAutoTranslate:
        "Please save your changes to enable translation.",
      retryLoadingTranslations: "Retry",
      selectLocales: "Select Locales",
      selectLocalesDescription:
        "Please confirm the target locales below. The text will be translated from the current locale {{ sourceLocale }} into the selected locales. The translation is powered by the machine translation service <a>DeepL</a>.",
      selectLocalesNote:
        "<s>Note:</s> The existing translations will be overwritten.",
      translateToSelectedLocales: "Translate to Selected Locales",
      translating: "Translating…",
      translationsButtonLabel: "Translations…",
      translationsTitle: "Translations",
    },
    usages: {
      name: "Name",
      type: "Type",
      fieldPath: "Field Path",
      global: "Global",
      noUsages: "There are no usages of this item.",
      numberOfUsages_one: "{{ count }} usage",
      numberOfUsages_other: "{{ count }} usages",
    },
    users: {
      labels: {
        plural: "Users",
        singular: "User",
      },
      role: {
        label: "Role",
        options: {
          admin: "Admin",
          editor: "Editor",
        },
      },
    },
    validation: {
      mustBeValidUrl: "Must be a valid URL",
    },
  },
};
