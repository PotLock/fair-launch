export default {
  /**
   * Nextra metadata configuration
   * @see https://nextra.vercel.app/docs/metadata
   */
  metadata: {
    title: {
      default: 'POTLAUNCH Documentation',
      template: '%s | POTLAUNCH',
    },
    description: 'Launch your project with community funding. POTLAUNCH is your platform for community-powered token launches.',
    metadataBase: new URL('https://docs.potlaunch.com/'),
    keywords: [
      'POTLAUNCH',
      'Token Launch',
      'Bonding Curves',
      'Fair Launch',
      'Solana',
      'Cryptocurrency',
      'DeFi',
      'Community Funding',
      'DAO',
      'Blockchain',
    ],
    generator: 'Next.js',
    applicationName: 'POTLAUNCH',
    appleWebApp: {
      title: 'POTLAUNCH',
    },
    openGraph: {
      // https://github.com/vercel/next.js/discussions/50189#discussioncomment-10826632
      url: './',
      siteName: 'POTLAUNCH',
      locale: 'en_US',
      type: 'website',
    },
    other: {
      'msapplication-TileColor': '#fff',
    },
    twitter: {
      site: 'https://docs.potlaunch.com/',
    },
    alternates: {
      // https://github.com/vercel/next.js/discussions/50189#discussioncomment-10826632
      canonical: './',
    },
  },
  /**
   * Nextra Layout component configuration
   */
  nextraLayout: {
    docsRepositoryBase: 'https://github.com/PotLock/fair-launch/tree/main/docs-nextra/content/',
    sidebar: {
      defaultMenuCollapseLevel: 1,
    },
  },
  /**
   * Main Layout head configuration
   */
  head: {
    mantine: {
      defaultColorScheme: 'dark',
      nonce: '8IBTHwOdqNKAWeKl7plt8g==',
    },
  },
  /**
   * GitHub API configuration
   * @see https://docs.github.com/en/rest/reference/repos#releases
   *
   * The GitHub API token is optional for rate limiting.
   * If you want to use it, create a personal access token with the `repo` scope.
   *
   * This information is used to fetch the releases from the GitHub API.
   */
  gitHub: {
    repo: 'PotLock/fair-launch',
    apiUrl: 'https://api.github.com',
    releasesUrl: 'https://api.github.com/repos/PotLock/fair-launch/releases',
  },

  /**
   * Release notes configuration
   * This is used to link the release notes in the app.
   */
  releaseNotes: {
    url: 'https://github.com/PotLock/fair-launch/releases',
    maxReleases: 10,
  },

  /**
   * Search configuration (for pagefind)
   * This is used to configure the search engine API.
   * @see /app/api/search/route.ts
   */
  search: {
    queryKeyword: 'q',
    minQueryLength: 3,
    limitKeyword: 'limit',
    defaultMaxResults: 5,
    excerptLengthKeyword: 'excerptLength',
    defaultExcerptLength: 30,
    defaultLanguage: 'en',
  },
} as const;
