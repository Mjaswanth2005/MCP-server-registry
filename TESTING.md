# Testing Guide

This document describes the testing strategy and how to run tests for the MCP Server Registry Actor.

## Test Suite Overview

The test suite covers all core functionality of the actor:

### Unit Tests

1. **DataProcessor Tests** (`__tests__/processor.test.ts`)
   - Name normalization (lowercase, special chars, hyphens)
   - Repository URL normalization
   - Data validation (required fields, URLs)
   - Text sanitization
   - Popularity score calculation

2. **Categorizer Tests** (`__tests__/categorizer.test.ts`)
   - Category assignment by keywords
   - Multi-category support
   - Uncategorized fallback
   - Keyword matching in name, description, and README

3. **CompatibilityChecker Tests** (`__tests__/compatibility.test.ts`)
   - AI client detection (Claude, OpenAI, Kiro)
   - Multiple client detection
   - Unknown compatibility handling
   - README and description parsing

4. **Deduplicator Tests** (`__tests__/deduplicator.test.ts`)
   - Duplicate detection by normalized name
   - Duplicate detection by repository URL
   - Data merging from multiple sources
   - Unique server preservation

5. **InstallationGenerator Tests** (`__tests__/installationGenerator.test.ts`)
   - NPM installation commands
   - PyPI installation commands (pip and uvx)
   - Configuration example generation
   - Environment variable detection

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Specific Test File
```bash
npm test -- __tests__/processor.test.ts
```

## Test Results

All 30 tests pass successfully:

```
Test Suites: 5 passed, 5 total
Tests:       30 passed, 30 total
```

### Coverage Areas

- ✅ Data validation and sanitization
- ✅ Name and URL normalization
- ✅ Categorization logic
- ✅ Compatibility detection
- ✅ Deduplication across sources
- ✅ Installation instruction generation
- ✅ Error handling and validation failures

## Manual Testing

### Test Mode

The actor supports a test mode that limits results for quick validation:

```json
{
  "runMode": "test",
  "sources": ["github", "npm", "pypi"]
}
```

This will:
- Limit to 5 servers per source
- Complete quickly for validation
- Test all core functionality

### Integration Testing

To test the full actor locally:

1. **Set up environment**
   ```bash
   npm install
   npm run build
   ```

2. **Create test input** (`.actor/INPUT.json`)
   ```json
   {
     "sources": ["github"],
     "runMode": "test",
     "maxServers": 5,
     "includeReadme": false
   }
   ```

3. **Run locally**
   ```bash
   npm start
   ```

4. **Check results**
   - Dataset: `./apify_storage/datasets/default/`
   - Metadata: `./apify_storage/key_value_stores/default/`

### Test Scenarios

#### Scenario 1: Single Source (GitHub)
```json
{
  "sources": ["github"],
  "minStars": 10,
  "maxServers": 10
}
```

Expected: Only GitHub servers with 10+ stars

#### Scenario 2: Multi-Source Deduplication
```json
{
  "sources": ["github", "npm", "pypi"],
  "maxServers": 20
}
```

Expected: Merged servers from all sources with combined metadata

#### Scenario 3: No README
```json
{
  "sources": ["npm"],
  "includeReadme": false,
  "maxServers": 5
}
```

Expected: Servers without README content

#### Scenario 4: Incremental Update
```json
{
  "sources": ["github", "npm"],
  "updateMode": "incremental"
}
```

Expected: Merges with previous run data

## Validation Checklist

Before deployment, verify:

- [ ] All unit tests pass
- [ ] Build completes without errors
- [ ] No TypeScript diagnostics
- [ ] Test mode runs successfully
- [ ] Dataset contains valid server records
- [ ] Metadata includes run statistics
- [ ] Deduplication works across sources
- [ ] Categories are assigned correctly
- [ ] Installation instructions are generated
- [ ] Rate limiting is handled gracefully

## Known Test Limitations

1. **No Live API Tests**: Tests use mocked data to avoid rate limits and external dependencies
2. **No Apify Platform Tests**: Tests run locally without Apify infrastructure
3. **No Network Tests**: Scrapers are not tested against live APIs

These limitations are intentional to keep tests fast, reliable, and independent of external services.

## Continuous Integration

For CI/CD pipelines, use:

```bash
npm ci          # Clean install
npm run build   # Compile TypeScript
npm test        # Run all tests
```

All commands must exit with code 0 for successful builds.

## Troubleshooting

### Tests Fail with Module Errors

Ensure you're using Node.js 16+ and have run:
```bash
npm install
```

### TypeScript Compilation Errors

Check `tsconfig.json` and ensure all dependencies are installed:
```bash
npm install --save-dev @types/node @types/jest
```

### Jest Configuration Issues

The project uses ESM modules. Ensure `jest.config.js` has:
```javascript
preset: 'ts-jest/presets/default-esm'
extensionsToTreatAsEsm: ['.ts']
```

## Adding New Tests

When adding new functionality:

1. Create test file in `__tests__/` directory
2. Follow naming convention: `<module>.test.ts`
3. Use descriptive test names
4. Test both success and failure cases
5. Mock external dependencies (Apify, APIs)
6. Run tests before committing

Example test structure:
```typescript
describe('MyModule', () => {
  let instance: MyModule;

  beforeEach(() => {
    instance = new MyModule();
  });

  describe('myMethod', () => {
    it('should handle valid input', () => {
      // Test implementation
    });

    it('should reject invalid input', () => {
      // Test implementation
    });
  });
});
```
