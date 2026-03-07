import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as OpenApiPlugin from "docusaurus-plugin-openapi-docs";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

function parseSemver(v: string) {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!m) return null;
  return {major: +m[1], minor: +m[2], patch: +m[3], pre: m[4] ?? null};
}

function semverDesc(a: string, b: string): number {
  const va = parseSemver(a);
  const vb = parseSemver(b);
  if (!va || !vb) return b.localeCompare(a);
  if (va.major !== vb.major) return vb.major - va.major;
  if (va.minor !== vb.minor) return vb.minor - va.minor;
  if (va.patch !== vb.patch) return vb.patch - va.patch;
  if (!va.pre && vb.pre) return -1;
  if (va.pre && !vb.pre) return 1;
  if (va.pre && vb.pre) {
    const am = va.pre.match(/^(\D*)(\d+)$/);
    const bm = vb.pre.match(/^(\D*)(\d+)$/);
    if (am && bm && am[1] === bm[1]) return +bm[2] - +am[2];
    return vb.pre.localeCompare(va.pre);
  }
  return 0;
}

const config: Config = {
  title: 'LANCommander',
  tagline: 'Documentation for LANCommander, the self-hosted game library.',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://docs.lancommander.app',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'LANCommander', // Usually your GitHub org/user name.
  projectName: 'LANCommander.Documentation', // Usually your repo name.

  onBrokenLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    '@docusaurus/plugin-content-pages',
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'documentation',
        path: 'Documentation',
        routeBasePath: '/',
        sidebarPath: './sidebars.documentation.ts',
        editUrl: 'https://github.com/LANCommander/LANCommander/tree/main/LANCommander.Documentation',
        sidebarItemsGenerator: async ({defaultSidebarItemsGenerator, ...args}) => {
          const items = await defaultSidebarItemsGenerator(args);
          if (args.item.dirName === 'Releases') {
            return [...items].sort((a: any, b: any) =>
              semverDesc(
                String(a.id ?? '').split('/').pop() ?? '',
                String(b.id ?? '').split('/').pop() ?? '',
              ),
            );
          }
          return items;
        },
      }
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'gameServers',
        path: 'GameServers',
        routeBasePath: 'GameServers',
        sidebarPath: './sidebars.gameServers.ts',
      }
    ],
    [
      'docusaurus-plugin-openapi-docs',
      {
        id: 'api',
        docsPluginId: 'documentation',
        config: {
          lancommanderApi: {
            specPath: 'https://raw.githubusercontent.com/LANCommander/LANCommander/main/LANCommander.API/openapi.yaml',
            outputDir: 'API',
            sidebarOptions: {
              groupPathsBy: 'tag',
            }
          } satisfies OpenApiPlugin.Options,
        }
      }
    ],
  ],

  themes: [['@docusaurus/theme-classic', { customCss: require.resolve('./src/css/custom.css') }]],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      logo: {
        alt: 'LANCommander Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'documentationSidebar',
          position: 'left',
          label: 'Documentation',
          docsPluginId: 'documentation',
        },
        {to: '/Category/Releases', label: 'Releases', position: 'left'},
        {
          type: 'docSidebar',
          sidebarId: 'gameServersSidebar',
          position: 'left',
          label: 'Game Servers',
          docsPluginId: 'gameServers',
        },
        {
          href: 'https://github.com/LANCommander/LANCommander',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Documentation',
              to: '/Overview',
            },
            {
              label: 'Releases',
              to: '/Releases',
            },
            {
              label: 'Game Servers',
              to: '/GameServers',
            }
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/vDEEWVt8EM',
            },
            {
              label: 'Patreon',
              href: 'https://www.patreon.com/LANCommander',
            }
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/LANCommander/LANCommander',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} LANCommander LLC. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['powershell'],
    },
  }
};

export default config;
