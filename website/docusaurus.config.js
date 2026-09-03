// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

import { themes as prismThemes } from "prism-react-renderer";

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Spec Toolkit",
  tagline: "Create JSON Schema based interface contracts and specifications.",
  url: "https://open-resource-discovery.github.io",
  baseUrl: process.env.BASE_URL || "/spec-toolkit/",
  trailingSlash: false,
  onBrokenLinks: "throw",
  onDuplicateRoutes: "throw",
  staticDirectories: ["static"],
  favicon: "img/favicon.ico",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "open-resource-discovery", // Usually your GitHub org/user name.
  projectName: "spec-toolkit", // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: "throw",
    },
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          // sidebarPath: require.resolve('./sidebars.js'),
          sidebarCollapsible: true,
          routeBasePath: "/", // Serve the docs at the site's root
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl: ""https://github.com/open-resource-discovery/spec-toolkit/tree/main/",
        },
        blog: false, // disable the blog plugin
        theme: {
          customCss: require.resolve("./static/css/custom.css"),
        },
      }),
    ],
  ],

  scripts: [`${process.env.BASE_URL || "/spec-toolkit/"}js/custom.js`],

  themes: [
    "@docusaurus/theme-mermaid",
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      {
        searchResultLimits: 10,
        hashed: true,
        indexBlog: false,
        indexPages: false,
        language: ["en"],
        docsRouteBasePath: "/",
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      ...(process.env.PR_PREVIEW_NUMBER
        ? {
            announcementBar: {
              content: `<b>This is a preview version of the website for <a href="https://github.com/open-resource-discovery/spec-toolkit/pull/${process.env.PR_PREVIEW_NUMBER}" target="_blank">PR #${process.env.PR_PREVIEW_NUMBER}</a></b>`,
              backgroundColor: "#e65050ff",
              textColor: "#fff",
              isCloseable: false,
            },
          }
        : {}),
      colorMode: {
        defaultMode: "light",
        disableSwitch: true,
        respectPrefersColorScheme: false,
      },
      prism: {
        theme: prismThemes.nightOwl,
      },
      mermaid: {
        theme: { light: "neutral", dark: "forest" },
      },
      navbar: {
        title: "Spec Toolkit",
        logo: {
          alt: "Spec-toolkit Site Logo",
          src: "img/logo.svg",
          href: "/",
        },
        items: [
          {
            label: "Overview",
            to: "/",
          },
          {
            label: "Documentation",
            to: "/docs",
          },
          {
            label: "Best Practices",
            to: "/best-practices",
          },
          {
            label: "FAQ",
            to: "/faq",
          },
          {
            to: "/docs/getting-started",
            label: "Get started",
            position: "right",
            className: "header-start-pill",
          },
          {
            href: "https://github.com/open-resource-discovery/spec-toolkit",
            label: "GitHub",
            position: "right",
            className: "header-github-link",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Toolkit",
            items: [
              { label: "Documentation", to: "/docs" },
              { label: "Best Practices", to: "/best-practices" },
              { label: "FAQ", to: "/faq" },
            ],
          },
          {
            title: "Source",
            items: [
              { label: "GitHub repository", href: "https://github.com/open-resource-discovery/spec-toolkit" },
              { label: "Report an issue", href: "https://github.com/open-resource-discovery/spec-toolkit/issues" },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} SAP SE. Made available under Apache License 2.0.`,
      },
    }),
};

module.exports = config;
