import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'POTLAUNCH',
  tagline: 'Launch your project with community funding',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://docs.potlaunch.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'PotLock', // Usually your GitHub org/user name.
  projectName: 'potlaunch', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/PotLock/fair-launch/tree/main/docs/docs/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/og-image.png',
    navbar: {
      title: 'POTLAUNCH',
      logo: {
        alt: 'POTLAUNCH Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'userDocsSidebar',
          position: 'left',
          label: '📖 User Guide',
        },
        {
          type: 'docSidebar',
          sidebarId: 'developerDocsSidebar',
          position: 'left',
          label: '👨‍💻 Developer Guide',
        },
        {
          type: 'docSidebar',
          sidebarId: 'contractsDocsSidebar',
          position: 'left',
          label: '🔧 Contracts',
        },
        {
          type: 'docSidebar',
          sidebarId: 'launchMechanismsSidebar',
          position: 'left',
          label: '🎯 Launch Mechanisms',
        },
        {
          type: 'docSidebar',
          sidebarId: 'governanceSidebar',
          position: 'left',
          label: '🏛️ Governance & DAO',
        },
        {
          href: 'https://github.com/PotLock/fair-launch',
          label: '🐙 GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '📚 Docs',
          items: [
            {
              label: '📖 User Guide',
              to: '/docs/user-guide/intro',
            },
            {
              label: '👨‍💻 Developer Guide',
              to: '/docs/developer-guide/potlaunch-sdk',
            },
            {
              label: '🔧 Contracts',
              to: '/docs/contracts/core-contracts',
            },
            {
              label: '🎯 Launch Mechanisms',
              to: '/docs/launch-mechanisms/bonding-curves',
            },
            {
              label: '🏛️ Governance & DAO',
              to: '/docs/governance/governance-system',
            },
          ],
        },
        {
          title: '🌐 Community',
          items: [
            {
              label: '💬 Telegram',
              href: 'https://potlock.org/community',
            },
            {
              label: '🕊️ Twitter',
              href: 'https://x.com/potlock_',
            },
          ],
        },
        {
          title: '🛠️ Products',
          items: [
            {
              label: '🔒 POTLAUNCH',
              href: 'https://potlaunch.com',
            }
          ],
        },
      ],
      copyright: `Built with ❤️ by <a href="https://potlock.org" target="_blank" rel="noopener noreferrer">POTLOCK</a>`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
