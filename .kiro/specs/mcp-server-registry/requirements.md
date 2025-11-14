# Requirements Document

## Introduction

The MCP Server Registry & Discovery Tool is a centralized platform for discovering, categorizing, and tracking Model Context Protocol (MCP) servers across the rapidly growing ecosystem. As MCP adoption accelerates across major AI platforms (Anthropic, OpenAI, etc.), developers need a unified way to find, evaluate, and integrate MCP servers. This tool aggregates MCP servers from multiple sources (GitHub, NPM, PyPI), provides categorization and compatibility information, and offers installation guidance.

## Glossary

- **MCP Server Registry**: The Apify actor that aggregates, stores, and serves information about available MCP servers
- **Discovery Engine**: The component responsible for scraping and identifying MCP servers from external sources
- **Compatibility Checker**: The component that determines which AI clients support each MCP server based on metadata and documentation
- **Package Source**: External repositories (GitHub, NPM, PyPI) where MCP servers are published
- **AI Client**: Applications that consume MCP servers (e.g., Claude, OpenAI clients, Kiro)
- **Apify Dataset**: The storage mechanism for scraped MCP server records in JSON format
- **Actor Input**: Configuration parameters that control the actor's scraping behavior

## Requirements

### Requirement 1

**User Story:** As a developer, I want to search for MCP servers by functionality, so that I can quickly find servers that meet my specific needs

#### Acceptance Criteria

1. WHEN a user enters a search query, THE Discovery Engine SHALL return MCP servers matching the query within 2 seconds
2. THE MCP Server Registry SHALL categorize servers by functionality including database, API, automation, file system, and development tools
3. WHEN a user applies category filters, THE MCP Server Registry SHALL display only servers matching the selected categories
4. THE MCP Server Registry SHALL support search by server name, description, and functionality keywords
5. WHEN search results are displayed, THE MCP Server Registry SHALL show server name, description, category, and popularity metrics for each result

### Requirement 2

**User Story:** As a developer, I want to see popularity and activity metrics for MCP servers, so that I can evaluate which servers are actively maintained and trusted by the community

#### Acceptance Criteria

1. THE Discovery Engine SHALL collect GitHub stars, forks, and last update date for each MCP server
2. WHEN displaying server information, THE MCP Server Registry SHALL show popularity metrics including stars, downloads, and recent activity
3. THE Discovery Engine SHALL update server metrics at least once every 24 hours
4. WHEN a server has not been updated in 180 days, THE MCP Server Registry SHALL display an inactive status indicator
5. THE MCP Server Registry SHALL rank search results by a popularity score combining stars, downloads, and recency

### Requirement 3

**User Story:** As a developer, I want to know which AI clients are compatible with each MCP server, so that I can ensure the server will work with my development environment

#### Acceptance Criteria

1. THE Compatibility Checker SHALL identify which AI clients support each MCP server based on metadata and documentation
2. WHEN displaying server details, THE MCP Server Registry SHALL show a list of compatible AI clients including Claude, OpenAI, and Kiro
3. THE Compatibility Checker SHALL infer compatibility from package metadata, README content, and official registry listings
4. WHEN compatibility information is unavailable, THE MCP Server Registry SHALL display an unknown compatibility status
5. THE MCP Server Registry SHALL NOT execute or test MCP server code to determine compatibility

### Requirement 4

**User Story:** As a developer, I want to access installation guides and code snippets for MCP servers, so that I can quickly integrate them into my projects

#### Acceptance Criteria

1. WHEN a user views server details, THE MCP Server Registry SHALL display installation instructions specific to the package source
2. THE MCP Server Registry SHALL provide code snippets for common installation methods including NPM, PyPI, and uvx
3. WHEN installation instructions are displayed, THE MCP Server Registry SHALL include configuration examples for at least one AI client
4. THE MCP Server Registry SHALL generate installation commands based on the server package source and version
5. WHEN a user copies installation code, THE MCP Server Registry SHALL include all required dependencies and environment variables

### Requirement 5

**User Story:** As a system administrator, I want the discovery engine to automatically find new MCP servers, so that the registry stays current with the growing ecosystem

#### Acceptance Criteria

1. THE Discovery Engine SHALL scan GitHub repositories for MCP servers at least once every 24 hours
2. THE Discovery Engine SHALL scan NPM packages tagged with MCP-related keywords at least once every 24 hours
3. THE Discovery Engine SHALL scan PyPI packages tagged with MCP-related keywords at least once every 24 hours
4. WHEN a new MCP server is discovered, THE Discovery Engine SHALL extract metadata including name, description, version, and source URL
5. WHEN a server is discovered from multiple sources, THE Discovery Engine SHALL consolidate the information into a single registry entry

### Requirement 6

**User Story:** As a developer, I want to browse MCP servers by category, so that I can explore available options within specific functional areas

#### Acceptance Criteria

1. THE MCP Server Registry SHALL provide a category navigation interface with at least 8 functional categories
2. WHEN a user selects a category, THE MCP Server Registry SHALL display all servers within that category sorted by popularity
3. THE MCP Server Registry SHALL assign each server to at least one category based on its functionality
4. WHEN category information is ambiguous, THE MCP Server Registry SHALL use machine learning or keyword analysis to determine appropriate categories
5. THE MCP Server Registry SHALL display the number of servers in each category on the navigation interface

### Requirement 7

**User Story:** As a developer, I want to view detailed information about each MCP server, so that I can make informed decisions about which servers to use

#### Acceptance Criteria

1. WHEN a user selects a server, THE MCP Server Registry SHALL display a detail page with comprehensive information
2. THE MCP Server Registry SHALL include server description, version, author, license, and source repository on the detail page
3. THE MCP Server Registry SHALL display installation instructions, compatibility information, and usage examples on the detail page
4. WHEN available, THE MCP Server Registry SHALL show README content from the source repository
5. THE MCP Server Registry SHALL provide links to the source repository, package page, and official documentation


### Requirement 8

**User Story:** As an actor user, I want to configure the scraping behavior through input parameters, so that I can customize the discovery process for my needs

#### Acceptance Criteria

1. THE MCP Server Registry SHALL accept an input parameter specifying which sources to scrape from the set of GitHub, NPM, and PyPI
2. THE MCP Server Registry SHALL accept an input parameter to limit the maximum number of results for testing purposes
3. THE MCP Server Registry SHALL accept an input parameter to control whether full README content is fetched
4. THE MCP Server Registry SHALL accept an optional GitHub token parameter for higher API rate limits
5. THE MCP Server Registry SHALL provide sensible default values for all input parameters to enable zero-configuration execution

### Requirement 9

**User Story:** As a data consumer, I want the actor to output structured data in a consistent format, so that I can easily integrate the results into my applications

#### Acceptance Criteria

1. THE MCP Server Registry SHALL store each discovered server as a JSON record in the Apify Dataset
2. WHEN a server record is created, THE MCP Server Registry SHALL include fields for name, description, version, source URLs, author, license, keywords, stars, downloads, forks, popularity score, categories, compatibility, installation instructions, README, and timestamps
3. THE MCP Server Registry SHALL store run metadata in the Key-Value Store including total servers found, servers by source, duplicates removed, categories assigned, run duration, and errors
4. THE MCP Server Registry SHALL generate a summary report in the Key-Value Store with server counts, popularity rankings, and last crawl timestamp
5. THE MCP Server Registry SHALL support exporting dataset results in JSON and CSV formats

### Requirement 10

**User Story:** As a developer, I want the actor to deploy successfully to Apify platform, so that I can run it on schedule and share it with others

#### Acceptance Criteria

1. THE MCP Server Registry SHALL deploy successfully using the Apify CLI commands apify login and apify push
2. THE MCP Server Registry SHALL include a valid INPUT_SCHEMA.json file defining all input parameters
3. THE MCP Server Registry SHALL include a README.md file with usage instructions and examples
4. THE MCP Server Registry SHALL include a .actor/actor.json configuration file with appropriate settings
5. THE MCP Server Registry SHALL execute successfully on the Apify platform with default input parameters

## Non-Functional Requirements

### Performance

**NFR-1:** THE MCP Server Registry SHALL complete a full discovery scan of all three sources within 60 minutes

**NFR-2:** THE MCP Server Registry SHALL operate within Apify Actor memory limits of 4096 MB

**NFR-3:** THE MCP Server Registry SHALL handle API rate limits using exponential backoff retry logic

**NFR-4:** THE MCP Server Registry SHALL process servers in batches to optimize memory usage

### Reliability

**NFR-5:** WHEN an API call fails, THE MCP Server Registry SHALL retry up to 3 times with exponential backoff

**NFR-6:** WHEN GitHub, NPM, or PyPI API rate limits are reached, THE MCP Server Registry SHALL gracefully handle the error and continue with other sources

**NFR-7:** THE MCP Server Registry SHALL maintain deduplication state to prevent duplicate entries across incremental runs

**NFR-8:** WHEN invalid data is encountered, THE MCP Server Registry SHALL log the error and continue processing other servers

### Usability

**NFR-9:** THE MCP Server Registry SHALL execute successfully with zero configuration using default input parameters

**NFR-10:** THE MCP Server Registry SHALL provide clear progress logging during execution

**NFR-11:** THE MCP Server Registry SHALL generate human-readable error messages for common failure scenarios

**NFR-12:** THE MCP Server Registry SHALL export results in both JSON and CSV formats for easy consumption

### Security

**NFR-13:** THE MCP Server Registry SHALL NOT execute MCP server code under any circumstances

**NFR-14:** THE MCP Server Registry SHALL only scrape publicly available repository and package metadata

**NFR-15:** THE MCP Server Registry SHALL sanitize all scraped data before storing in the dataset

**NFR-16:** THE MCP Server Registry SHALL store API tokens securely using Apify's secret input fields

## Scope Definition

### In Scope (MVP)

The following features are included in the initial release:

- GitHub, NPM, and PyPI source scraping
- Keyword-based categorization with 8+ predefined categories
- Popularity metrics calculation (stars, downloads, recency)
- Basic metadata extraction (name, description, version, author, license)
- README content retrieval and storage
- Metadata-based compatibility detection for AI clients
- Installation guide generation for NPM, PyPI, and uvx
- Deduplication across multiple sources
- JSON dataset output with structured server records
- Configurable actor inputs for flexible scraping

### Out of Scope (Future Enhancements)

The following features are not included in the initial release:

- AI-based semantic categorization or deep learning models
- Runtime execution or testing of MCP servers for compatibility verification
- Full web UI dashboard with search and filtering
- User accounts, authentication, or personalization
- Advanced search ranking models or recommendation engines
- Webhooks or real-time notifications
- Community ratings, reviews, or user-submitted data
- Automated compatibility testing infrastructure
- Server health monitoring or uptime tracking

## Data Model Requirements

### Server Record Schema

Each MCP server record in the Apify Dataset SHALL include the following fields:

**Identity Fields:**
- `name` (string): The server name
- `normalizedName` (string): Normalized name for deduplication
- `description` (string): Server description

**Version Fields:**
- `version` (string): Current version number
- `lastUpdated` (string): ISO date of last update
- `isActive` (boolean): Whether server is actively maintained

**Source Fields:**
- `packageSource` (array): List of sources where server was found
- `sourceUrls` (object): URLs for GitHub, NPM, PyPI, and repository

**Metadata Fields:**
- `author` (string): Server author or organization
- `license` (string): License type
- `keywords` (array): Associated keywords

**Metrics Fields:**
- `stars` (number): GitHub stars count
- `downloads` (number): Total downloads across sources
- `forks` (number): GitHub forks count
- `popularityScore` (number): Calculated popularity score
- `lastCommitDate` (string): ISO date of last commit

**Content Fields:**
- `readme` (string): Full README content

**Classification Fields:**
- `categories` (array): Assigned functional categories
- `compatibility` (array): AI client compatibility information

**Installation Fields:**
- `installInstructions` (object): Installation commands for NPM, PyPI, uvx, and config examples

**Timestamp Fields:**
- `scrapedAt` (string): ISO date when record was created
