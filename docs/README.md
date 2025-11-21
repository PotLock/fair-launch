# POTLAUNCH Docs

Documentation site for the POTLAUNCH token launch platform.

## Tech Stack

- **Framework**: Next.js 16
- **Documentation**: Nextra 4
- **UI**: Mantine 8
- **Language**: TypeScript 5.9
- **Testing**: Jest, React Testing Library
- **Storybook**: Component development

## Project Structure

```
docs/
├── app/               # Next.js app directory
├── components/        # Shared UI components
├── content/           # MDX documentation content
│   ├── concepts-architecture/
│   ├── developer-guide/
│   ├── dynamic-bonding-curve/
│   ├── quick-start/
│   └── user-guide/
├── config/            # Site configuration
├── theme/             # Mantine theme
├── test/              # Test files
└── public/            # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn 4+

### Installation

```bash
yarn install
```

### Development

```bash
yarn dev
```

Server runs at http://localhost:3000

### Build

```bash
yarn build
```

This generates static content and builds the Pagefind search index.

### Production

```bash
yarn start
```

## Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start development server |
| `yarn build` | Build for production with search index |
| `yarn start` | Start production server |
| `yarn lint` | Run ESLint and Stylelint |
| `yarn typecheck` | Check TypeScript types |
| `yarn test` | Run all tests |
| `yarn jest` | Run Jest tests |
| `yarn storybook` | Start Storybook dev server |
| `yarn prettier:write` | Format code |
| `yarn analyze` | Analyze bundle size |

## Documentation Structure

| Section | Description |
|---------|-------------|
| Quick Start | Getting started guides |
| User Guide | End-user documentation |
| Developer Guide | API and SDK documentation |
| Dynamic Bonding Curve | Technical curve documentation |
| Concepts & Architecture | System architecture |
| FAQ & Troubleshooting | Common issues and solutions |
| Contributing | Contribution guidelines |
| Changelog | Version history |

## Writing Documentation

Documentation is written in MDX format in the `content/` directory.

### Page Metadata

Each section has a `_meta.ts` file for navigation ordering:

```ts
export default {
  index: 'Introduction',
  'getting-started': 'Getting Started',
  'advanced-usage': 'Advanced Usage',
}
```

### MDX Features

- Mantine components available in MDX
- Code syntax highlighting
- Callouts and alerts
- Interactive examples

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `nextra` | Documentation framework |
| `nextra-theme-docs` | Docs theme |
| `@mantine/core` | UI components |
| `@mantine/hooks` | React hooks |
| `pagefind` | Static search |

## Deployment

Deploy to any static hosting service:

```bash
yarn build
```

The output is in `.next/` directory. Compatible with:

- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages

## License

MIT
