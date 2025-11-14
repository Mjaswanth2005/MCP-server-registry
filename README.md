# MCP Server Registry Actor

An Apify actor for discovering, cataloging, and deduplicating Model Context Protocol (MCP) servers across GitHub, NPM, and PyPI.

## Features

- **Multi-source Scraping**: Discovers MCP servers from GitHub, NPM Registry, and PyPI
- **Intelligent Deduplication**: Merges duplicate servers found across multiple sources
- **Automatic Categorization**: Assigns servers to 9+ categories based on functionality
- **Compatibility Detection**: Identifies AI client compatibility (Claude, OpenAI, Kiro, etc.)
- **Installation Instructions**: Generates installation commands and configuration examples
- **Rate Limit Handling**: Exponential backoff and automatic retry logic
- **Data Validation**: Comprehensive validation with detailed error logging
- **Incremental Updates**: Support for both full and incremental data collection modes

## Input Parameters

### Sources Configuration

**sources** (array of strings)
- Default: `["github", "npm", "pypi"]`
- Options: `"github"`, `"npm"`, `"pypi"`
- Controls which data sources to scrape

### Update Mode

**updateMode** (enum)
- Default: `"full"`
- Options: `"full"` (replace all data) or `"incremental"` (merge with existing)
- Affects how servers are merged with previous runs

### Filtering

**maxServers** (integer, optional)
- Limits total number of servers to collect
- Useful for testing or partial runs

**minStars** (integer, optional, GitHub only)
- Minimum GitHub stars to include
- Filters low-engagement projects

### Content Options

**includeReadme** (boolean)
- Default: `true`
- Controls whether to fetch and include README content

**githubToken** (string, optional, secret)
- Personal access token for GitHub API
- Increases rate limits from 60 to 5,000 requests/hour
- Recommended for production runs

### Execution Mode

**runMode** (enum)
- Default: `"production"`
- Options: `"test"` (limited to 5 servers) or `"production"` (full run)

## Output Format

The actor outputs a dataset containing deduplicated server records:

```json
{
  "name": "server-name",
  "description": "Server description",
  "version": "1.0.0",
  "sourceUrl": "https://npm.example.com/package/server-name",
  "sourceUrls": {
    "npm": "https://www.npmjs.com/package/server-name",
    "github": "https://github.com/user/server-name"
  },
  "stars": 150,
  "forks": 20,
  "downloads": {
    "npm": 5000,
    "pypi": 200
  },
  "license": "MIT",
  "author": "Author Name",
  "repository": "user/server-name",
  "keywords": ["mcp", "llm", "ai"],
  "readme": "# Server Name\nLong README content...",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "isActive": true,
  "categories": ["AI & ML", "Integration & Orchestration"],
  "compatibility": [
    {
      "client": "Claude",
      "status": "likely",
      "notes": "Mentioned in documentation"
    }
  ],
  "installationInstructions": {
    "npm": {
      "command": "npm install server-name@1.0.0",
      "package": "server-name",
      "version": "1.0.0"
    },
    "pypi": [
      {
        "command": "pip install server-name==1.0.0",
        "package": "server-name",
        "version": "1.0.0"
      }
    ],
    "configExample": "{...}"
  },
  "normalizedName": "server-name"
}
```

## Metadata Output

Run metadata is stored in the Key-Value Store with key `run-metadata-{runId}`:

```json
{
  "runId": "uuid",
  "startedAt": "2024-01-15T10:00:00Z",
  "completedAt": "2024-01-15T10:30:00Z",
  "duration": 1800000,
  "totalServersFound": 250,
  "serversBySource": {
    "github": 120,
    "npm": 80,
    "pypi": 50
  },
  "duplicatesRemoved": 30,
  "serversByCategory": {
    "Database": 45,
    "File System": 30,
    "Web & API": 50
  },
  "rateLimitEvents": [
    {
      "source": "github",
      "timestamp": "2024-01-15T10:15:00Z",
      "message": "Rate limited...",
      "retryAfter": 60
    }
  ],
  "validationFailures": [],
  "errors": [],
  "updateMode": "full"
}
```

## Categories

The actor categorizes servers into 9 categories:

1. **Database** - SQL, NoSQL, data storage systems
2. **File System** - Cloud storage, S3, blob storage
3. **Web & API** - HTTP, REST, fetch, URL handling
4. **Code & Development** - Git, GitHub, CI/CD, testing
5. **AI & ML** - Machine learning, LLMs, embeddings
6. **Communication** - Slack, email, webhooks, messaging
7. **Data & Analytics** - Analytics, metrics, observability
8. **Cloud & Infrastructure** - AWS, Azure, GCP, Kubernetes
9. **Integration & Orchestration** - Workflows, automation, pipelines

## Rate Limiting & Retry Logic

### GitHub API
- Rate limit: 60 requests/hour (unauthenticated) or 5,000/hour (authenticated)
- Retry delays: 60s → 120s → 300s (exponential backoff)

### NPM Registry
- Rate limit: 1,000 requests/hour
- Automatic retry on 429 status

### PyPI
- Rate limit: 1,000 requests/hour
- Automatic retry on 429 status

## Deduplication Strategy

The actor uses a two-tier deduplication approach:

1. **Normalized Name Match**: Case-insensitive, removes special characters
2. **Repository URL Match**: Prefers repository URL for canonical identification

When duplicates are found, the actor:
- Prefers GitHub data for stars, forks, and last commit date
- Sums downloads from NPM and PyPI
- Keeps the longer/more detailed README
- Combines source URLs from all sources
- Uses the most recent version number

## Usage Examples

### Full Scan (Default)
```json
{
  "sources": ["github", "npm", "pypi"],
  "updateMode": "full",
  "includeReadme": true
}
```

### GitHub Only with Star Filter
```json
{
  "sources": ["github"],
  "minStars": 50,
  "githubToken": "ghp_xxxxx"
}
```

### Test Run
```json
{
  "sources": ["github", "npm", "pypi"],
  "runMode": "test",
  "maxServers": 5
}
```

### Incremental Update
```json
{
  "sources": ["npm", "pypi"],
  "updateMode": "incremental",
  "maxServers": 100
}
```

## Running Locally

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation
```bash
npm install
```

### Build
```bash
npm run build
```

### Development
```bash
npm run dev
```

### Deployment to Apify
```bash
npm install -g apify-cli
apify login
apify push
```

## Performance Considerations

- **Memory**: 4 GB allocated (configurable in `.actor/actor.json`)
- **Timeout**: 1 hour (3600 seconds)
- **Concurrency**: Limited to 2-3 simultaneous requests per source
- **Dataset Batch Size**: 100 records per write operation

## Troubleshooting

### Rate Limiting
If you encounter rate limit errors:
1. Provide a GitHub token via `githubToken` input
2. Increase timeout in `.actor/actor.json`
3. Reduce `maxServers` to lower request volume

### Validation Failures
Check the `run-metadata` output for validation errors:
- Missing required fields
- Invalid URLs
- Malformed data

### Missing Data
- NPM: Ensure `includeReadme` is not filtering expected servers
- GitHub: Use higher `maxServers` or remove `minStars` filter
- PyPI: Limited by public package search availability

## Architecture

```
src/
├── main.ts              # Entry point and orchestration
├── types.ts             # Data models and interfaces
├── processor.ts         # Data validation and normalization
├── categorizer.ts       # Category assignment
├── compatibility.ts     # AI client detection
├── deduplicator.ts      # Duplicate detection and merging
├── installationGenerator.ts  # Instruction generation
└── scrapers/
    ├── github.ts        # GitHub repository scraper
    ├── npm.ts           # NPM registry scraper
    └── pypi.ts          # PyPI package scraper
```

## Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get up and running in minutes
- **[Testing Guide](TESTING.md)** - Comprehensive testing documentation
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Architecture and technical details

## Development

### Setup
```bash
npm install
npm run build
npm test
```

### Scripts
- `npm run build` - Compile TypeScript
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm start` - Run actor locally
- `npm run dev` - Run in development mode
- `npm run lint` - Lint source code

### Project Structure
```
src/
├── main.ts                    # Actor entry point
├── types.ts                   # Data models
├── processor.ts               # Data validation
├── categorizer.ts             # Category assignment
├── compatibility.ts           # AI client detection
├── deduplicator.ts            # Duplicate handling
├── installationGenerator.ts   # Installation instructions
└── scrapers/                  # Source scrapers
    ├── github.ts
    ├── npm.ts
    └── pypi.ts

__tests__/                     # Unit tests
```

## License

Apache 2.0

## Support

For issues or feature requests:
1. Check the [Quick Start Guide](QUICKSTART.md)
2. Review the [Testing Guide](TESTING.md)
3. See the [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
4. Check actor logs and run metadata
