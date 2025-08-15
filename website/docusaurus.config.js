// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

import { themes as prismThemes } from "prism-react-renderer";

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Spec-Toolkit",
  tagline: "Helping you to create JSON Schema based interface contracts and specifications.",
  url: "https://open-resource-discovery.github.io",
  baseUrl: "/spec-toolkit/",
  trailingSlash: false,
  onBrokenLinks: "throw",
  onDuplicateRoutes: "throw",
  onBrokenMarkdownLinks: "throw",
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

  scripts: ["/spec-toolkit/js/custom.js"],

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
        title: "",
        logo: {
          alt: "Spec-toolkit Site Logo",
          src: "img/logo.svg",
          href: "/index",
        },
        items: [
          {
            label: "Overview",
            to: "/index",
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
            href: "https://github.com/open-resource-discovery/spec-toolkit",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            label: "GitHub Repository",
            to: "https://github.com/open-resource-discovery/spec-toolkit",
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} SAP SE. Made available under Apache License 2.0.\n\n This site is hosted by GitHub Pages. Please see the GitHub Privacy Statement for any information how GitHub processes your personal data.`,
      },
    }),
};

module.exports = config;
