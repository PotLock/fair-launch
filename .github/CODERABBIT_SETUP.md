# CodeRabbit AI Setup Guide

This repository is configured to use CodeRabbit AI for automated code reviews on pull requests.

## What is CodeRabbit?

CodeRabbit is an AI-powered code review assistant that automatically reviews pull requests, providing intelligent feedback on code quality, security, best practices, and potential bugs.

## Setup Instructions

### 1. Install CodeRabbit GitHub App

1. Visit [https://coderabbit.ai](https://coderabbit.ai)
2. Click "Login with GitHub"
3. Authorize the CodeRabbit application
4. Select your organization or personal account
5. Choose repository access:
   - **All repositories**: CodeRabbit will have access to all current and future repos
   - **Only select repositories**: Choose specific repositories (recommended)
6. Click "Install & Authorize"

### 2. Required Permissions

CodeRabbit requires:

**Read access:**
- Actions, checks, discussions, members, and metadata

**Read and write access:**
- Code, commit statuses, issues, and pull requests

Note: CodeRabbit never stores your code. All analysis is done in real-time.

### 3. Verify Installation

1. Create a test pull request
2. CodeRabbit should automatically comment within a few minutes
3. You can interact with CodeRabbit by:
   - Replying to its comments
   - Using `@coderabbitai` mentions
   - Asking it to review specific files or changes

## Configuration

This repository includes a `.coderabbit.yaml` configuration file that customizes:

- Review tone and style
- File path filters (what to review)
- Specific instructions for different file types
- Auto-review settings
- Knowledge base context

## GitHub Actions Integration

The `.github/workflows/coderabbit-review.yml` workflow complements CodeRabbit by:

- Running code quality checks
- Verifying builds
- Running linters
- Providing status summaries

## How to Use

### Basic Usage

Once installed, CodeRabbit automatically reviews all pull requests. No additional action needed!

### Interactive Features

1. **Ask for specific reviews:**
   ```
   @coderabbitai review this file for security issues
   ```

2. **Request explanations:**
   ```
   @coderabbitai explain this function
   ```

3. **Get suggestions:**
   ```
   @coderabbitai suggest improvements for performance
   ```

4. **Create issues:**
   ```
   @coderabbitai create an issue for this technical debt
   ```

### Commands

You can use these commands in PR comments:

- `@coderabbitai pause` - Pause reviews on this PR
- `@coderabbitai resume` - Resume reviews
- `@coderabbitai review` - Trigger a new review
- `@coderabbitai resolve` - Mark a conversation as resolved
- `@coderabbitai help` - Show available commands

## Customizing Reviews

### Path-specific Instructions

The `.coderabbit.yaml` file includes specific instructions for:

- TypeScript files (`**/*.ts`)
- React components (`**/*.tsx`)
- Rust files (`**/*.rs`)
- Smart contracts (`**/contracts/**`)

### Excluding Files

CodeRabbit is configured to skip:
- `node_modules/`
- `dist/` and `build/`
- Minified files (`*.min.js`)
- Lock files

## Best Practices

1. **Review CodeRabbit's feedback** - It's a tool to assist, not replace human review
2. **Engage in discussions** - Ask CodeRabbit questions about its suggestions
3. **Update configuration** - Customize `.coderabbit.yaml` for your team's needs
4. **Combine with CI/CD** - Use alongside existing automated checks
5. **Provide feedback** - Mark reviews as helpful or not to improve future reviews

## Troubleshooting

### CodeRabbit not reviewing PRs

1. Check that the app is installed and has access to the repository
2. Verify the PR is not in draft mode (if `drafts: false` in config)
3. Check if the changed files match path filters
4. Visit the CodeRabbit dashboard to check status

### Need to modify permissions

1. Go to GitHub Settings > Applications
2. Find CodeRabbit AI
3. Click "Configure"
4. Modify repository access or permissions

## Additional Resources

- [CodeRabbit Documentation](https://docs.coderabbit.ai)
- [CodeRabbit Quickstart](https://docs.coderabbit.ai/getting-started/quickstart/)
- [GitHub Platform Guide](https://docs.coderabbit.ai/platforms/github-com)

## Support

For issues or questions:
- Visit [CodeRabbit Support](https://coderabbit.ai/support)
- Check [CodeRabbit Documentation](https://docs.coderabbit.ai)
- Contact via the CodeRabbit dashboard

---

**Note:** This is configured for the potlaunch project with specific settings for TypeScript, React, Rust, and Solana smart contracts.
