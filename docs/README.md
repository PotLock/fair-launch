# POTLAUNCH Documentation

This documentation site is built using [Next.js](https://nextjs.org/) app router + [Mantine](https://mantine.dev/) + [Nextra](https://nextra.site/).

## About POTLAUNCH

POTLAUNCH is a platform for launching projects with community funding. Create and deploy your own SPL tokens, manage token launches through bonding curves, and build your community-driven project.

## Installation

```bash
npm install
```

or

```bash
yarn install
```

## Local Development

```bash
npm run dev
```

or

```bash
yarn dev
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
npm run build
```

or

```bash
yarn build
```

This command generates static content and can be served using any static contents hosting service.

## Features

This documentation site includes:

- [Next.js](https://nextjs.org/) app router with App Directory
- [Mantine UI](https://mantine.dev/) components for beautiful interface
- [Nextra](https://nextra.site/) documentation framework
- [TypeScript](https://www.typescriptlang.org/) for type safety
- Dark mode support synced between Mantine and Nextra
- Responsive design for mobile and desktop
- Custom Navigation and Footer components
- Search functionality
- [PostCSS](https://postcss.org/) with [mantine-postcss-preset](https://mantine.dev/styles/postcss-preset)
- [Storybook](https://storybook.js.org/) for component development
- [Jest](https://jestjs.io/) setup with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- ESLint setup with [eslint-config-mantine](https://github.com/mantinedev/eslint-config-mantine)

## Folder Structure

- `app` – Next.js app directory with pages and layouts
- `components` – shared UI components (Navigation, Footer, Logo, etc.)
- `content` – Nextra documentation content (.mdx and _meta.json files)
- `theme` – Mantine theme configuration

## Available Scripts

### Development

- `dev` – start development server
- `build` – bundle application for production
- `start` – start production server
- `analyze` – analyze application bundle with [@next/bundle-analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

### Testing

- `typecheck` – checks TypeScript types
- `lint` – runs ESLint
- `prettier:check` – checks files with Prettier
- `jest` – runs jest tests
- `jest:watch` – starts jest in watch mode
- `test` – runs all tests (`jest`, `prettier:check`, `lint`, `typecheck`)

### Other

- `storybook` – starts Storybook dev server
- `storybook:build` – build production Storybook bundle
- `prettier:write` – formats all files with Prettier

## Deployment

The documentation site can be deployed to any static hosting service such as:

- Vercel
- Netlify
- GitHub Pages
- AWS S3
- Cloudflare Pages

For production deployment, run:

```bash
npm run build
```

Then deploy the generated `.next` directory to your hosting provider.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

Built with ❤️ by [POTLOCK](https://potlock.org)
