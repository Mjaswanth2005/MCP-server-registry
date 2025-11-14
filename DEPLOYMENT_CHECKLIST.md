# Deployment Checklist

Use this checklist before deploying the MCP Server Registry Actor to production.

## Pre-Deployment Verification

### Code Quality
- [x] All TypeScript files compile without errors
- [x] No linting errors or warnings
- [x] All unit tests pass (30/30)
- [x] Code coverage is adequate
- [x] JSDoc comments on all public functions
- [x] No console.log statements in production code

### Configuration
- [x] `.actor/actor.json` configured correctly
  - [x] Memory limit set (4096 MB)
  - [x] Timeout set (3600 seconds)
  - [x] Dataset retention configured (30 days)
- [x] `.actor/INPUT_SCHEMA.json` validated
  - [x] All parameters documented
  - [x] Default values set
  - [x] Secret fields marked (githubToken)
  - [x] Located in .actor/ directory (required by Apify)
- [x] `package.json` dependencies up to date
- [x] `tsconfig.json` strict mode enabled
- [x] `Dockerfile` created for Apify platform
- [x] `.dockerignore` configured

### Documentation
- [x] README.md complete with examples
- [x] QUICKSTART.md for new users
- [x] TESTING.md with test procedures
- [x] IMPLEMENTATION_SUMMARY.md with architecture
- [x] Inline code documentation (JSDoc)

### Testing
- [x] Unit tests pass locally
- [x] Build completes successfully
- [x] No TypeScript diagnostics
- [ ] Test mode runs successfully on Apify platform
- [ ] Production mode tested with small dataset

## Deployment Steps

### 1. Final Local Verification

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Build
npm run build

# Test
npm test

# Verify no errors
echo $?  # Should output: 0
```

### 2. Apify CLI Setup

```bash
# Install CLI (if not already installed)
npm install -g apify-cli

# Login
apify login

# Verify login
apify info
```

### 3. Deploy to Apify

```bash
# Push actor to platform
apify push

# Verify deployment
# Check Apify console for actor
```

### 4. Initial Test Run

**Test Configuration:**
```json
{
  "sources": ["github"],
  "runMode": "test",
  "maxServers": 5,
  "includeReadme": false
}
```

**Steps:**
1. Go to actor page in Apify Console
2. Click "Start"
3. Use test configuration above
4. Click "Run"
5. Wait for completion (~1-2 minutes)

**Verify:**
- [ ] Run completes successfully
- [ ] Dataset contains 5 servers
- [ ] Metadata includes run statistics
- [ ] No critical errors in logs

### 5. Validation Test Run

**Validation Configuration:**
```json
{
  "sources": ["github", "npm"],
  "runMode": "test",
  "maxServers": 10,
  "includeReadme": true
}
```

**Verify:**
- [ ] Multi-source scraping works
- [ ] Deduplication functions correctly
- [ ] Categories assigned properly
- [ ] Installation instructions generated
- [ ] README content included
- [ ] Rate limiting handled gracefully

### 6. Production Test Run

**Production Configuration:**
```json
{
  "sources": ["github", "npm", "pypi"],
  "updateMode": "full",
  "maxServers": 50,
  "includeReadme": true
}
```

**Verify:**
- [ ] All sources scraped successfully
- [ ] Deduplication across sources works
- [ ] Dataset size is reasonable
- [ ] Run completes within timeout
- [ ] Memory usage is acceptable
- [ ] Rate limit events handled

## Post-Deployment Monitoring

### First 24 Hours

Monitor:
- [ ] Run success rate
- [ ] Average run duration
- [ ] Memory usage patterns
- [ ] Rate limit events
- [ ] Validation failure rate
- [ ] Error frequency

### First Week

Review:
- [ ] Dataset growth rate
- [ ] Deduplication effectiveness
- [ ] Category distribution
- [ ] Source coverage (GitHub vs NPM vs PyPI)
- [ ] User feedback (if applicable)

### Ongoing

- [ ] Set up monitoring alerts
  - Run failures
  - Error rate > 10%
  - Duration > 3300 seconds
  - Validation failure rate > 5%
- [ ] Schedule regular runs (daily/weekly)
- [ ] Review and update categories as needed
- [ ] Monitor for new AI clients to add
- [ ] Update dependencies monthly

## Rollback Plan

If issues occur after deployment:

1. **Immediate Actions**
   - Stop any running instances
   - Check error logs
   - Review run metadata

2. **Rollback Steps**
   ```bash
   # Revert to previous version
   git checkout <previous-commit>
   apify push
   ```

3. **Investigation**
   - Review error logs
   - Check validation failures
   - Test locally with same input
   - Fix issues and redeploy

## Configuration Recommendations

### For High Volume
```json
{
  "sources": ["github", "npm", "pypi"],
  "updateMode": "full",
  "includeReadme": true,
  "githubToken": "ghp_your_token_here"
}
```

### For Quality Focus
```json
{
  "sources": ["github"],
  "minStars": 50,
  "includeReadme": true,
  "githubToken": "ghp_your_token_here"
}
```

### For Quick Updates
```json
{
  "sources": ["npm", "pypi"],
  "updateMode": "incremental",
  "maxServers": 100
}
```

## Monitoring Metrics

Track these metrics:

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Success Rate | > 95% | < 90% |
| Run Duration | < 30 min | > 55 min |
| Memory Usage | < 3 GB | > 3.5 GB |
| Error Rate | < 5% | > 10% |
| Validation Failures | < 5% | > 10% |
| Rate Limit Events | < 10/run | > 20/run |

## Troubleshooting Guide

### High Error Rate
- Check rate limit events
- Verify GitHub token is valid
- Review validation failures
- Check external API status

### Slow Performance
- Reduce maxServers
- Disable includeReadme
- Use single source
- Check network latency

### Memory Issues
- Reduce batch size
- Disable README fetching
- Limit maxServers
- Increase memory allocation

### Rate Limiting
- Add/update GitHub token
- Reduce concurrency
- Increase backoff delays
- Spread runs over time

## Success Criteria

Deployment is successful when:

- [x] Actor deploys without errors
- [ ] Test runs complete successfully
- [ ] Dataset contains valid records
- [ ] Metadata is generated correctly
- [ ] No critical errors in logs
- [ ] Performance meets targets
- [ ] Monitoring is in place
- [ ] Documentation is accessible

## Sign-Off

Before marking deployment complete:

- [ ] Technical lead approval
- [ ] Test results reviewed
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Rollback plan tested
- [ ] Team notified

## Notes

Add any deployment-specific notes here:

---

**Deployment Date:** _________________

**Deployed By:** _________________

**Version:** _________________

**Status:** _________________
