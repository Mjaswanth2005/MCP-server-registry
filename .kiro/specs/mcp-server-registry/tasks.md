# Implementation Plan

- [x] 1. Set up Apify actor project structure
  - Initialize Apify actor project with TypeScript support
  - Configure tsconfig.json for strict type checking
  - Set up .actor/actor.json with memory (4096 MB) and timeout (3600s) settings
  - Create INPUT_SCHEMA.json defining all input parameters including sources, updateMode, maxServers, minStars, includeReadme, githubToken (secret), and runMode
  - Add README.md with usage instructions and sample test fixtures
  - _Requirements: 10.1, 10.2, 10.4, NFR-2_

- [x] 2. Implement core data models and interfaces
  - [x] 2.1 Define TypeScript interfaces for ServerMetadata, ServerRecord, and ActorInput
    - Create src/types.ts with all data model interfaces
    - Include validation types for input parameters (sources, updateMode, maxServers, minStars, includeReadme, githubToken, runMode)
    - Add ISO 8601 timestamp types for all date fields
    - _Requirements: 9.2, 8.1, 8.2, 8.3, 8.4_

  - [x] 2.2 Define interfaces for source scrapers and processors
    - Create SourceScraper interface with scrape() method
    - Create DataProcessor, Categorizer, and CompatibilityChecker interfaces
    - _Requirements: 5.4_

  - [x] 2.3 Create category definitions with keywords
    - Define 8+ categories with associated keywords
    - Create Category interface and predefined category list
    - _Requirements: 6.1, 6.3_

- [x] 3. Implement GitHub scraper
  - [x] 3.1 Create GitHub API client with Octokit
    - Initialize Octokit with optional GitHub token from input
    - Implement exponential backoff for rate limiting (60s, 120s, 300s)
    - Set concurrency to 2-3 requests to respect rate limits
    - Log rate limit events to run metadata
    - _Requirements: 5.1, 8.4, NFR-3, NFR-5, NFR-6_

  - [x] 3.2 Implement GitHub search for MCP servers
    - Search repositories by topics: mcp-server, model-context-protocol
    - Search code for mcp*.json and *mcp-server* files
    - Handle pagination for search results
    - _Requirements: 5.1, 5.4_

  - [x] 3.3 Extract metadata from GitHub repositories
    - Extract name, description, stars, forks, last commit date
    - Fetch README content if includeReadme input is true (limit to 500 KB)
    - Extract license and author information
    - Apply minStars filter if specified in input
    - _Requirements: 2.1, 4.1, 7.4, NFR-15_

  - [x] 3.4 Determine active status based on last update
    - Calculate days since last update
    - Mark as inactive if not updated in 180 days
    - _Requirements: 2.4_

- [x] 4. Implement NPM scraper
  - [x] 4.1 Create NPM Registry API client
    - Use axios to query NPM search endpoint
    - Implement search by keywords: mcp, mcp-server, model-context-protocol
    - _Requirements: 5.2_

  - [x] 4.2 Extract metadata from NPM packages
    - Parse package.json for name, description, version, author, license
    - Extract download counts for last week
    - Extract repository URL and keywords
    - _Requirements: 5.4, 2.1_

  - [x] 4.3 Handle NPM pagination and result limits
    - Implement pagination through search results
    - Respect maxServers input parameter if provided
    - _Requirements: 8.2_

- [x] 5. Implement PyPI scraper
  - [x] 5.1 Create PyPI API client
    - Use axios to query PyPI JSON API and search
    - Search by classifiers and keywords for MCP-related terms
    - _Requirements: 5.3_

  - [x] 5.2 Extract metadata from PyPI packages
    - Parse project metadata for name, description, version, author, license
    - Extract download statistics and project URLs
    - Extract repository links from project URLs
    - _Requirements: 5.4, 2.1_

  - [x] 5.3 Handle PyPI pagination and result limits
    - Implement pagination through search results
    - Respect maxServers input parameter if provided
    - _Requirements: 8.2_


- [x] 6. Implement data processor
  - [x] 6.1 Create name normalization function
    - Convert to lowercase and remove punctuation except hyphens
    - Replace spaces and underscores with hyphens
    - Collapse multiple consecutive hyphens to single hyphen
    - Trim leading/trailing hyphens
    - _Requirements: 5.5_

  - [x] 6.2 Implement popularity score calculation
    - Calculate score using formula: (stars * 0.4) + (log10(downloads + 1) * 0.3) + (recency_factor * 0.3)
    - Calculate recency_factor as: max(0, 1 - (days_since_update / 365))
    - Handle missing metrics gracefully
    - _Requirements: 2.5_

  - [x] 6.3 Extract and normalize repository URLs
    - Parse repository URLs from various formats
    - Normalize GitHub URLs for deduplication (lowercase, remove .git, strip trailing slashes)
    - Use repository URL as canonical key for deduplication
    - _Requirements: 5.5_

  - [x] 6.4 Implement data validation
    - Validate required fields (name, description, version, sourceUrl)
    - Validate URLs using URL parser
    - Sanitize text fields (remove control characters, limit length)
    - Log validation failures to run metadata
    - Skip invalid records and continue processing
    - _Requirements: NFR-8, NFR-15_

- [x] 7. Implement categorization service
  - [x] 7.1 Create keyword matching algorithm
    - Scan server name, description, and keywords for category keywords
    - Assign to all matching categories (multi-category support)
    - _Requirements: 1.2, 6.3, 6.4_

  - [x] 7.2 Implement README-based categorization
    - Search README content for category keywords if available
    - Weight README matches lower than name/description matches
    - _Requirements: 6.3, 6.4_

  - [x] 7.3 Handle uncategorized servers
    - Default to "Uncategorized" category if no matches found
    - Log servers that couldn't be categorized
    - _Requirements: 6.3_

- [x] 8. Implement compatibility checker
  - [x] 8.1 Create AI client detection logic
    - Search README and description for client names: Claude, OpenAI, Kiro
    - Look for configuration examples mentioning specific clients
    - _Requirements: 3.1, 3.3_

  - [x] 8.2 Generate compatibility information
    - Create CompatibilityInfo objects for detected clients
    - Default to "unknown" status when no information found
    - _Requirements: 3.2, 3.4_

  - [x] 8.3 Ensure no code execution for compatibility testing
    - Only use metadata and documentation parsing
    - Never execute or import MCP server code
    - Add explicit validation to prevent code execution paths
    - _Requirements: 3.5, NFR-13_

- [x] 9. Implement deduplicator
  - [x] 9.1 Create deduplication state management
    - Load existing state from Key-Value Store at actor start (key: dedup-state-{runId})
    - Maintain in-memory map of normalized names and repository URLs to server data
    - Support both full and incremental update modes
    - _Requirements: 5.5, NFR-7_

  - [x] 9.2 Implement duplicate detection logic
    - Check for duplicates by normalized name (deterministic rules)
    - Check for duplicates by normalized repository URL (canonical key)
    - Prefer repository URL matching over name matching
    - _Requirements: 5.5_

  - [x] 9.3 Implement server merging logic
    - Prefer GitHub for stars, forks, last commit date
    - Sum downloads from NPM and PyPI
    - Keep longer/more detailed README
    - Combine source URLs from all sources in sourceUrls object
    - Use most recent version number
    - _Requirements: 5.5_

  - [x] 9.4 Persist deduplication state to Key-Value Store
    - Save state after processing all servers with key format: dedup-state-{runId}
    - Include server map, last run timestamp (ISO 8601), and update mode
    - _Requirements: 9.3, NFR-7_

- [x] 10. Implement installation instruction generator
  - [x] 10.1 Generate NPM installation commands
    - Create npm install command with package name and version
    - _Requirements: 4.2, 4.4_

  - [x] 10.2 Generate PyPI installation commands
    - Create pip install command with package name and version
    - Generate uvx command for Python packages
    - _Requirements: 4.2, 4.4_

  - [x] 10.3 Generate configuration examples
    - Create basic MCP configuration JSON for at least one AI client
    - Include environment variables if detected in documentation
    - _Requirements: 4.3, 4.5_

- [x] 11. Implement main actor logic
  - [x] 11.1 Create actor entry point with input validation
    - Parse and validate actor input against schema
    - Set default values for optional parameters
    - _Requirements: 8.5, NFR-9_

  - [x] 11.2 Implement source router
    - Route to appropriate scrapers based on sources input parameter
    - Run scrapers in parallel for performance
    - _Requirements: 8.1, NFR-1_

  - [x] 11.3 Implement data processing pipeline
    - Process scraped servers through data processor
    - Apply categorization to each server
    - Check compatibility for each server
    - Generate installation instructions
    - _Requirements: 5.4, NFR-4_

  - [x] 11.4 Implement deduplication and dataset writing
    - Deduplicate servers across sources
    - Write deduplicated servers to Apify Dataset in batches
    - _Requirements: 5.5, 9.1, NFR-4_

  - [x] 11.5 Generate run metadata and summary
    - Count total servers found by source
    - Count duplicates removed
    - Count servers by category
    - Calculate run duration
    - Track rate limit events with timestamps (ISO 8601)
    - Track validation failures count
    - Store metadata in Key-Value Store with key: run-metadata-{runId}
    - Include runId, startedAt, completedAt timestamps (ISO 8601)
    - _Requirements: 9.3, 9.4_

  - [x] 11.6 Implement error handling and logging
    - Catch and log errors from each scraper
    - Continue processing on individual server failures
    - Store errors in run metadata
    - _Requirements: NFR-8, NFR-10, NFR-11_

- [x] 12. Implement data sanitization
  - [x] 12.1 Sanitize scraped data before storage
    - Remove potentially malicious content from README
    - Limit README size to 500 KB maximum
    - Validate URLs and remove invalid ones
    - Remove control characters from text fields
    - Escape special characters in text fields
    - _Requirements: NFR-15_

  - [x] 12.2 Validate server records against schema
    - Check all required fields are present
    - Validate data types match schema
    - Ensure all timestamps are in ISO 8601 format
    - Skip invalid records and log errors with details
    - _Requirements: 9.2, NFR-8_

- [x] 13. Create actor documentation
  - [x] 13.1 Write README.md with usage instructions
    - Describe actor purpose and features
    - Document all input parameters with examples
    - Provide example output format
    - Include usage examples for common scenarios
    - _Requirements: 10.3_

  - [x] 13.2 Add inline code documentation

    - Add JSDoc comments to all public functions and interfaces
    - Document complex algorithms and business logic
    - _Requirements: NFR-10_

- [x] 14. Configure actor for Apify platform
  - [x] 14.1 Create .actor/actor.json configuration
    - Set actor name, version, and description
    - Configure memory limit to 4096 MB
    - Set timeout to 3600 seconds
    - Configure dataset retention for 30 days
    - _Requirements: 10.4, NFR-2, NFR-1_

  - [x] 14.2 Configure INPUT_SCHEMA.json with all parameters
    - Define sources as array with enum values (github, npm, pypi)
    - Define updateMode as enum (full, incremental) with default 'full'
    - Define maxServers as optional integer
    - Define minStars as optional integer
    - Define includeReadme as optional boolean with default true
    - Define githubToken as secret string
    - Define runMode as enum (test, production) with default 'production'
    - _Requirements: 10.2, 8.1, 8.2, 8.3, 8.4, NFR-16_

  - [ ] 14.3 Configure monitoring and alerts
    - Set up alerts for actor run failures
    - Set up alerts for error rate exceeding 10%
    - Set up alerts for run duration exceeding 3300 seconds
    - Set up alerts for validation failure rate exceeding 5%
    - Configure alert destinations (email/webhook)
    - _Requirements: NFR-10_

  - [ ] 14.4 Test deployment to Apify platform
    - Run apify login to authenticate
    - Run apify push to deploy actor
    - Verify actor appears in Apify console
    - _Requirements: 10.1_


- [x] 15. Test actor execution


  - [x] 15.1 Test with default input parameters

    - Run actor with no input (use defaults)
    - Verify all three sources are scraped
    - Verify dataset contains server records
    - _Requirements: 10.5, NFR-9_


  - [ ] 15.2 Test with single source
    - Run actor with only GitHub source
    - Verify only GitHub servers are scraped
    - _Requirements: 8.1_


  - [ ] 15.3 Test with maxServers limit
    - Run actor with maxServers set to 10
    - Verify dataset contains at most 10 records

    - _Requirements: 8.2_

  - [ ] 15.4 Test with includeReadme disabled
    - Run actor with includeReadme set to false

    - Verify README fields are empty or omitted
    - _Requirements: 8.3_

  - [x] 15.5 Verify deduplication across sources

    - Check that servers found in multiple sources appear only once
    - Verify merged data includes information from all sources
    - _Requirements: 5.5, NFR-7_

  - [x] 15.6 Verify error handling

    - Test with invalid GitHub token
    - Verify actor continues with other sources
    - Check error logging in run metadata
    - _Requirements: NFR-5, NFR-6, NFR-8_


  - [ ] 15.7 Verify data export formats
    - Export dataset as JSON
    - Export dataset as CSV
    - Verify both formats contain complete data
    - _Requirements: 9.5, NFR-12_

  - [ ] 15.8 Test with sample fixtures
    - Test with @modelcontextprotocol/server-filesystem (NPM)
    - Test with mcp-server-postgres (GitHub)
    - Test with anthropic/mcp-server-slack (GitHub)
    - Test with mcp-server-fetch (multi-source deduplication)
    - Verify categorization and metadata extraction accuracy
    - _Requirements: All_
