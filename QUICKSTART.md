# Quick Start Guide

Get the MCP Server Registry Actor up and running in minutes.

## Prerequisites

- Node.js 16 or higher
- npm or yarn
- (Optional) Apify account for platform deployment
- (Optional) GitHub personal access token for higher rate limits

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Project

```bash
npm run build
```

### 3. Run Tests

```bash
npm test
```

Expected output:
```
Test Suites: 5 passed, 5 total
Tests:       30 passed, 30 total
```

### 4. Run Locally (Test Mode)

Create a test input file `.actor/INPUT.json`:

```json
{
  "sources": ["github"],
  "runMode": "test",
  "maxServers": 5,
  "includeReadme": false
}
```

Run the actor:

```bash
npm start
```

### 5. Check Results

Results are stored in `./apify_storage/`:

- **Dataset**: `./apify_storage/datasets/default/*.json`
- **Metadata**: `./apify_storage/key_value_stores/default/run-metadata-*.json`

## Apify Platform Deployment

### 1. Install Apify CLI

```bash
npm install -g apify-cli
```

### 2. Login to Apify

```bash
apify login
```

### 3. Deploy Actor

```bash
apify push
```

### 4. Run on Platform

Via CLI:
```bash
apify run
```

Or via Apify Console:
1. Go to your actor page
2. Click "Start"
3. Configure input parameters
4. Click "Run"

## Common Use Cases

### Discover All MCP Servers

```json
{
  "sources": ["github", "npm", "pypi"],
  "updateMode": "full",
  "includeReadme": true
}
```

### GitHub Only with Quality Filter

```json
{
  "sources": ["github"],
  "minStars": 50,
  "githubToken": "ghp_your_token_here"
}
```

### Quick Test Run

```json
{
  "sources": ["github", "npm"],
  "runMode": "test",
  "maxServers": 5
}
```

### Incremental Update

```json
{
  "sources": ["github", "npm", "pypi"],
  "updateMode": "incremental"
}
```

## Understanding the Output

### Server Record Example

```json
{
  "name": "mcp-server-postgres",
  "description": "PostgreSQL database access for MCP",
  "version": "1.2.0",
  "sourceUrl": "https://github.com/user/mcp-server-postgres",
  "sourceUrls": {
    "github": "https://github.com/user/mcp-server-postgres",
    "npm": "https://www.npmjs.com/package/mcp-server-postgres"
  },
  "source": "github",
  "stars": 150,
  "downloads": {
    "npm": 5000
  },
  "categories": ["Database"],
  "compatibility": [
    {
      "client": "Claude",
      "status": "likely",
      "notes": "Mentioned in README"
    }
  ],
  "installationInstructions": {
    "npm": {
      "command": "npm install mcp-server-postgres@1.2.0",
      "package": "mcp-server-postgres",
      "version": "1.2.0"
    },
    "configExample": "{ \"mcpServers\": { ... } }"
  },
  "isActive": true,
  "lastUpdated": "2024-11-14T10:30:00Z"
}
```

### Run Metadata Example

```json
{
  "runId": "abc123",
  "startedAt": "2024-11-14T10:00:00Z",
  "completedAt": "2024-11-14T10:30:00Z",
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
  }
}
```

## Troubleshooting

### Rate Limiting

**Problem**: GitHub rate limit errors

**Solution**: Provide a GitHub token:
```json
{
  "githubToken": "ghp_your_token_here"
}
```

### No Results

**Problem**: Empty dataset

**Solution**: 
- Check `maxServers` isn't too low
- Remove `minStars` filter
- Check run metadata for errors

### Build Errors

**Problem**: TypeScript compilation fails

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Test Failures

**Problem**: Tests don't pass

**Solution**:
```bash
npm install
npm test
```

If issues persist, check Node.js version (must be 16+).

## Next Steps

1. **Review Documentation**
   - Read `README.md` for detailed features
   - Check `TESTING.md` for test procedures
   - See `IMPLEMENTATION_SUMMARY.md` for architecture

2. **Customize Configuration**
   - Adjust `.actor/actor.json` for memory/timeout
   - Modify `INPUT_SCHEMA.json` for custom parameters
   - Update categories in `src/types.ts`

3. **Monitor Performance**
   - Check run metadata for statistics
   - Review rate limit events
   - Monitor validation failures

4. **Deploy to Production**
   - Test with `runMode: "test"` first
   - Gradually increase `maxServers`
   - Set up monitoring and alerts

## Support

- **Documentation**: See README.md, TESTING.md, IMPLEMENTATION_SUMMARY.md
- **Issues**: Check actor logs and run metadata
- **Testing**: Run `npm test` to verify functionality

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run build` | Compile TypeScript |
| `npm test` | Run all tests |
| `npm start` | Run actor locally |
| `npm run dev` | Run in development mode |
| `apify push` | Deploy to Apify platform |
| `apify run` | Run on Apify platform |

## Example Workflow

```bash
# 1. Setup
git clone <repository>
cd mcp-server-registry-actor
npm install

# 2. Test
npm test
npm run build

# 3. Local Run
echo '{"runMode":"test","sources":["github"]}' > .actor/INPUT.json
npm start

# 4. Check Results
cat apify_storage/datasets/default/*.json

# 5. Deploy
apify login
apify push
apify run
```

That's it! You're ready to discover and catalog MCP servers.
