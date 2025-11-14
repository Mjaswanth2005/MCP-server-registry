# Troubleshooting Guide

Common issues and solutions for the MCP Server Registry Actor.

## Deployment Issues

### Error: "Could not read schema files - EISDIR: illegal operation on a directory"

**Problem**: Apify cannot read the INPUT_SCHEMA.json file.

**Cause**: The INPUT_SCHEMA.json file must be located in the `.actor/` directory, not the root directory.

**Solution**:
```bash
# Ensure INPUT_SCHEMA.json is in .actor/ directory
ls .actor/INPUT_SCHEMA.json

# If it's in the root, move it:
mv INPUT_SCHEMA.json .actor/INPUT_SCHEMA.json
```

**Verification**:
```bash
# Check directory structure
ls -la .actor/
# Should show:
# - actor.json
# - INPUT_SCHEMA.json
```

### Error: ".actor/actor.json has invalid format" - storages.dataset

**Problem**: The `storages.dataset` configuration in actor.json is invalid.

**Cause**: The dataset configuration must include either `views` or `fields` properties, or be a simple string.

**Solution**: The actor.json has been updated with a proper dataset configuration including views. Ensure your `.actor/actor.json` includes:

```json
{
  "storages": {
    "dataset": {
      "actorSpecification": 1,
      "title": "MCP Servers",
      "description": "Catalog of discovered MCP servers with metadata",
      "views": {
        "overview": {
          "title": "All Servers",
          "transformation": {
            "fields": ["name", "description", "version", "source", "categories"]
          },
          "display": {
            "component": "table",
            "properties": {}
          }
        }
      }
    }
  }
}
```

**Verification**:
```bash
# Validate JSON syntax
cat .actor/actor.json | python -m json.tool
# or
node -e "console.log(JSON.stringify(require('./.actor/actor.json'), null, 2))"
```

### Error: "File '.actor/default' does not exist"

**Problem**: Apify cannot find a file called ".actor/default".

**Cause**: Incorrect configuration in `.actor/actor.json`:
- Storage configuration referencing "default" as a string
- Missing `dockerfile` field
- Incorrect `main` field pointing to non-existent file

**Solution**: Update `.actor/actor.json`:
```json
{
  "actorSpecification": 1,
  "dockerfile": "./Dockerfile",
  "dockerImage": "apify/actor-node:20",
  "storages": {
    "dataset": {
      "maxAgeDays": 30
    }
  },
  "input": "./INPUT_SCHEMA.json"
}
```

**Verification**:
```bash
# Check actor.json has correct format
cat .actor/actor.json | grep dockerfile
# Should output: "dockerfile": "./Dockerfile"
```

### Error: "Docker build failed"

**Problem**: Docker cannot build the actor image.

**Cause**: Missing Dockerfile or incorrect configuration.

**Solution**:
1. Ensure Dockerfile exists in root directory
2. Verify it uses the correct base image: `apify/actor-node:20`
3. Check that build step is included: `RUN npm run build`

**Verification**:
```bash
# Test Docker build locally
docker build -t mcp-registry-test .
```

### Error: "Module not found" during build

**Problem**: TypeScript compilation fails with missing modules.

**Cause**: Dependencies not installed or incorrect import paths.

**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

**Verification**:
```bash
# Check for TypeScript errors
npm run build
# Should exit with code 0
```

## Runtime Issues

### Error: "Rate limit exceeded"

**Problem**: GitHub API rate limit reached.

**Cause**: Too many requests without authentication.

**Solution**:
1. Provide a GitHub personal access token:
```json
{
  "githubToken": "ghp_your_token_here"
}
```

2. Or reduce request volume:
```json
{
  "maxServers": 50,
  "sources": ["npm", "pypi"]
}
```

**Verification**: Check run metadata for rate limit events.

### Error: "Validation failures"

**Problem**: Many servers fail validation.

**Cause**: Invalid or incomplete metadata from sources.

**Solution**: This is expected behavior. The actor logs validation failures but continues processing. Check run metadata for details:

```javascript
// In run metadata
{
  "validationFailures": [
    {
      "timestamp": "2024-11-14T10:00:00Z",
      "field": "sourceUrl",
      "value": "server-name",
      "reason": "invalid URL format"
    }
  ]
}
```

### Error: "Memory limit exceeded"

**Problem**: Actor runs out of memory.

**Cause**: Processing too many servers or large READMEs.

**Solution**:
1. Increase memory in `.actor/actor.json`:
```json
{
  "environment": {
    "APIFY_MEMORY_MBYTES": 8192
  }
}
```

2. Or reduce data volume:
```json
{
  "maxServers": 100,
  "includeReadme": false
}
```

### Error: "Timeout exceeded"

**Problem**: Actor exceeds 1-hour timeout.

**Cause**: Processing too many servers or slow API responses.

**Solution**:
1. Increase timeout in `.actor/actor.json`:
```json
{
  "environment": {
    "APIFY_TIMEOUT_SECS": 7200
  }
}
```

2. Or reduce scope:
```json
{
  "maxServers": 200,
  "sources": ["github"]
}
```

## Data Quality Issues

### Issue: "No servers found"

**Problem**: Dataset is empty after run.

**Possible Causes**:
1. `maxServers` set too low
2. `minStars` filter too restrictive
3. Network issues
4. API rate limits

**Solution**:
```json
{
  "sources": ["github", "npm", "pypi"],
  "maxServers": 100,
  "minStars": 0
}
```

**Verification**: Check run metadata for:
- `totalServersFound`
- `errors` array
- `rateLimitEvents`

### Issue: "Duplicate servers in dataset"

**Problem**: Same server appears multiple times.

**Cause**: Deduplication not working correctly.

**Solution**: This should not happen. If it does:
1. Check that `normalizedName` field is present
2. Verify repository URLs are being normalized
3. Review deduplication logs

**Report**: This is a bug - please check the deduplicator logic.

### Issue: "Wrong categories assigned"

**Problem**: Servers have incorrect categories.

**Cause**: Keyword matching is too broad or too narrow.

**Solution**: Update category keywords in `src/types.ts`:
```typescript
export const CATEGORIES: Category[] = [
  {
    name: 'Database',
    keywords: ['database', 'sql', 'postgres', ...] // Add more keywords
  },
  // ...
];
```

### Issue: "Missing installation instructions"

**Problem**: Some servers lack installation instructions.

**Cause**: Only NPM and PyPI sources generate instructions.

**Solution**: This is expected for GitHub-only servers. Installation instructions are only generated for package managers.

## Testing Issues

### Error: "Tests fail locally"

**Problem**: `npm test` fails.

**Cause**: Dependencies or configuration issue.

**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Verify Node.js version (must be 16+)
node --version

# Run tests
npm test
```

### Error: "Jest configuration error"

**Problem**: Jest cannot find tests or modules.

**Cause**: ESM configuration issue.

**Solution**: Verify `jest.config.js`:
```javascript
export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  // ...
};
```

## Performance Issues

### Issue: "Slow scraping"

**Problem**: Actor takes too long to complete.

**Possible Causes**:
1. Rate limiting delays
2. Large README files
3. Network latency
4. Too many servers

**Solutions**:
1. Disable README fetching:
```json
{
  "includeReadme": false
}
```

2. Use GitHub token for higher rate limits
3. Reduce `maxServers`
4. Use single source

### Issue: "High memory usage"

**Problem**: Memory usage approaches limit.

**Cause**: Large dataset or README content.

**Solution**:
1. Process in smaller batches
2. Disable README fetching
3. Increase memory allocation
4. Reduce `maxServers`

## Debugging Tips

### Enable Verbose Logging

The actor uses `@apify/log` for logging. Logs are automatically captured by Apify.

### Check Run Metadata

Always review run metadata for insights:
```javascript
{
  "totalServersFound": 250,
  "duplicatesRemoved": 30,
  "rateLimitEvents": [...],
  "validationFailures": [...],
  "errors": [...]
}
```

### Test Locally First

Before deploying, test locally:
```bash
# Create test input
echo '{"runMode":"test","sources":["github"]}' > .actor/INPUT.json

# Run locally
npm start

# Check results
cat apify_storage/datasets/default/*.json
```

### Use Test Mode

Always test with `runMode: "test"` first:
```json
{
  "runMode": "test",
  "maxServers": 5
}
```

## Getting Help

If issues persist:

1. **Check Documentation**
   - README.md
   - QUICKSTART.md
   - IMPLEMENTATION_SUMMARY.md

2. **Review Logs**
   - Actor run logs in Apify Console
   - Run metadata in Key-Value Store
   - Validation failures

3. **Test Locally**
   - Run with test mode
   - Check for errors
   - Verify output format

4. **Common Fixes**
   ```bash
   # Reset everything
   rm -rf node_modules package-lock.json dist
   npm install
   npm run build
   npm test
   ```

## Quick Fixes Checklist

- [ ] INPUT_SCHEMA.json in .actor/ directory
- [ ] Dockerfile exists in root
- [ ] Dependencies installed (`npm install`)
- [ ] Build succeeds (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] GitHub token provided (if using GitHub source)
- [ ] Memory allocation sufficient (4GB+)
- [ ] Timeout sufficient (3600s+)
- [ ] Test mode works before production

## Error Code Reference

| Error | Cause | Solution |
|-------|-------|----------|
| EISDIR | Wrong file location | Move INPUT_SCHEMA.json to .actor/ |
| ENOENT | Missing file | Check file exists |
| 403 | Rate limit | Add GitHub token |
| 429 | Rate limit | Wait or reduce requests |
| ENOMEM | Out of memory | Increase memory or reduce scope |
| ETIMEDOUT | Timeout | Increase timeout or reduce scope |

## Still Having Issues?

1. Check actor logs in Apify Console
2. Review run metadata for error details
3. Test with minimal configuration
4. Verify all files are in correct locations
5. Ensure dependencies are up to date
