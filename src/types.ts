/**
 * Core data models and interfaces for the MCP Server Registry Actor
 */

/**
 * Actor input configuration that controls scraping behavior
 * 
 * @property sources - Array of package sources to scrape (github, npm, pypi)
 * @property updateMode - Whether to perform full rescan or incremental update
 * @property maxServers - Optional limit on number of servers to return (for testing)
 * @property minStars - Optional minimum GitHub stars filter
 * @property includeReadme - Whether to fetch full README content (default: true)
 * @property githubToken - Optional GitHub personal access token for higher rate limits
 * @property runMode - Execution mode: test (limited results) or production (full scan)
 */
export interface ActorInput {
  sources: ('github' | 'npm' | 'pypi')[];
  updateMode: 'full' | 'incremental';
  maxServers?: number;
  minStars?: number;
  includeReadme?: boolean;
  githubToken?: string;
  runMode?: 'test' | 'production';
}

/**
 * Complete server record stored in Apify Dataset with all metadata and enrichments
 * 
 * @property name - Server name as published in package registry
 * @property description - Server description
 * @property version - Current version number
 * @property sourceUrl - Primary source URL where server was found
 * @property sourceUrls - URLs for all sources where server was discovered
 * @property source - Primary package source (github, npm, pypi)
 * @property stars - GitHub stars count (if available)
 * @property forks - GitHub forks count (if available)
 * @property downloads - Download statistics from NPM and/or PyPI
 * @property license - License type (e.g., MIT, Apache-2.0)
 * @property author - Server author or organization
 * @property repository - Repository URL (typically GitHub)
 * @property keywords - Associated keywords and tags
 * @property readme - Full README content (if includeReadme is true)
 * @property lastUpdated - ISO 8601 timestamp of last update
 * @property isActive - Whether server is actively maintained (updated within 180 days)
 * @property categories - Assigned functional categories
 * @property compatibility - AI client compatibility information
 * @property installationInstructions - Generated installation commands and config examples
 * @property normalizedName - Normalized name for deduplication (lowercase, hyphenated)
 */
export interface ServerRecord {
  name: string;
  description: string;
  version: string;
  sourceUrl: string;
  sourceUrls: SourceUrls;
  source: 'github' | 'npm' | 'pypi';
  stars?: number;
  forks?: number;
  downloads?: DownloadStats;
  license?: string;
  author?: string;
  repository?: string;
  keywords?: string[];
  readme?: string;
  lastUpdated: string; // ISO 8601
  isActive: boolean;
  categories: string[];
  compatibility: CompatibilityInfo[];
  installationInstructions: InstallationInstructions;
  normalizedName: string;
}

/**
 * Mapping of package sources to their respective URLs
 * Used to track all locations where a server was discovered
 * 
 * @property github - GitHub repository URL
 * @property npm - NPM package URL
 * @property pypi - PyPI project URL
 */
export interface SourceUrls {
  github?: string;
  npm?: string;
  pypi?: string;
}

/**
 * Download statistics aggregated from multiple package sources
 * 
 * @property npm - NPM downloads (last week)
 * @property pypi - PyPI downloads (estimated from release count)
 */
export interface DownloadStats {
  npm?: number;
  pypi?: number;
}

/**
 * Raw server metadata extracted by source scrapers before enrichment
 * This is the intermediate format used during scraping and processing
 * 
 * @property name - Server name
 * @property description - Server description
 * @property version - Version number
 * @property sourceUrl - URL where server was found
 * @property source - Package source (github, npm, pypi)
 * @property stars - GitHub stars (if from GitHub)
 * @property forks - GitHub forks (if from GitHub)
 * @property downloads - Download count from package registry
 * @property license - License type
 * @property author - Author name or organization
 * @property repository - Repository URL
 * @property keywords - Keywords and tags
 * @property readme - README content
 * @property lastUpdated - ISO 8601 timestamp of last update
 */
export interface ServerMetadata {
  name: string;
  description: string;
  version: string;
  sourceUrl: string;
  source: 'github' | 'npm' | 'pypi';
  stars?: number;
  forks?: number;
  downloads?: number;
  license?: string;
  author?: string;
  repository?: string;
  keywords?: string[];
  readme?: string;
  lastUpdated: string; // ISO 8601
}

/**
 * AI client compatibility information inferred from documentation
 * Compatibility is determined through metadata analysis, not runtime testing
 * 
 * @property client - AI client name (e.g., 'Claude', 'OpenAI', 'Kiro')
 * @property status - Compatibility status: verified (confirmed), likely (mentioned), unknown (no info)
 * @property notes - Additional context about compatibility detection
 */
export interface CompatibilityInfo {
  client: string;
  status: 'verified' | 'likely' | 'unknown';
  notes?: string;
}

/**
 * Generated installation instructions for different package managers
 * 
 * @property npm - NPM installation command
 * @property pypi - PyPI installation commands (pip and uvx)
 * @property configExample - Sample MCP configuration JSON
 */
export interface InstallationInstructions {
  npm?: InstallCommand;
  pypi?: InstallCommand[];
  configExample?: string;
}

/**
 * Single installation command with package details
 * 
 * @property command - Full installation command string
 * @property package - Package name
 * @property version - Package version
 */
export interface InstallCommand {
  command: string;
  package: string;
  version: string;
}

/**
 * Category definition with associated keywords for classification
 * 
 * @property name - Category display name
 * @property keywords - Keywords used to match servers to this category
 */
export interface Category {
  name: string;
  keywords: string[];
}

/**
 * Actor run metadata and statistics stored in Key-Value Store
 * Provides comprehensive information about the scraping run for monitoring and analysis
 * 
 * @property runId - Unique identifier for this actor run
 * @property startedAt - ISO 8601 timestamp when run started
 * @property completedAt - ISO 8601 timestamp when run completed
 * @property duration - Run duration in milliseconds
 * @property totalServersFound - Total number of servers discovered across all sources
 * @property serversBySource - Breakdown of servers found per source
 * @property duplicatesRemoved - Number of duplicate servers merged
 * @property serversByCategory - Breakdown of servers per category
 * @property rateLimitEvents - Log of rate limiting events encountered
 * @property validationFailures - Log of validation failures
 * @property errors - List of error messages encountered
 * @property updateMode - Whether this was a full or incremental update
 */
export interface RunMetadata {
  runId: string;
  startedAt: string; // ISO 8601
  completedAt: string; // ISO 8601
  duration: number; // milliseconds
  totalServersFound: number;
  serversBySource: SourceStats;
  duplicatesRemoved: number;
  serversByCategory: CategoryStats;
  rateLimitEvents: RateLimitEvent[];
  validationFailures: ValidationFailure[];
  errors: string[];
  updateMode: 'full' | 'incremental';
}

/**
 * Server count statistics broken down by package source
 * 
 * @property github - Number of servers found on GitHub
 * @property npm - Number of servers found on NPM
 * @property pypi - Number of servers found on PyPI
 */
export interface SourceStats {
  github: number;
  npm: number;
  pypi: number;
}

/**
 * Server count statistics broken down by category
 * Dynamic object with category names as keys and server counts as values
 */
export interface CategoryStats {
  [category: string]: number;
}

/**
 * Rate limiting event logged during scraping
 * 
 * @property source - Package source that was rate limited
 * @property timestamp - ISO 8601 timestamp when rate limit occurred
 * @property message - Human-readable description of the event
 * @property retryAfter - Seconds to wait before retrying (if provided by API)
 */
export interface RateLimitEvent {
  source: 'github' | 'npm' | 'pypi';
  timestamp: string; // ISO 8601
  message: string;
  retryAfter?: number;
}

/**
 * Data validation failure logged during processing
 * 
 * @property timestamp - ISO 8601 timestamp when validation failed
 * @property field - Field name that failed validation
 * @property value - Value that failed validation (typically server name)
 * @property reason - Reason for validation failure
 */
export interface ValidationFailure {
  timestamp: string; // ISO 8601
  field: string;
  value: string;
  reason: string;
}

/**
 * Interface for package source scrapers
 * Each scraper is responsible for discovering MCP servers from a specific source
 */
export interface SourceScraper {
  /**
   * Scrape MCP servers from the package source
   * @param input - Actor input configuration
   * @returns Array of discovered server metadata
   */
  scrape(input: ActorInput): Promise<ServerMetadata[]>;
}

/**
 * Interface for data processing and validation
 * Responsible for normalizing, validating, and enriching scraped metadata
 */
export interface DataProcessor {
  /**
   * Process and validate server metadata
   * @param metadata - Array of raw server metadata from scrapers
   * @returns Array of validated and normalized server metadata
   */
  process(metadata: ServerMetadata[]): Promise<ServerMetadata[]>;
}

/**
 * Interface for server categorization
 * Assigns functional categories based on keywords in name, description, and README
 */
export interface Categorizer {
  /**
   * Categorize a server based on its metadata
   * @param server - Server metadata to categorize
   * @returns Array of category names (can be multiple categories)
   */
  categorize(server: ServerMetadata): Promise<string[]>;
}

/**
 * Interface for AI client compatibility checking
 * Infers compatibility from documentation without executing server code
 */
export interface CompatibilityChecker {
  /**
   * Check which AI clients are compatible with this server
   * @param server - Server metadata to analyze
   * @returns Array of compatibility information for detected clients
   */
  check(server: ServerMetadata): Promise<CompatibilityInfo[]>;
}

/**
 * Interface for server deduplication
 * Consolidates servers found across multiple sources into single records
 */
export interface Deduplicator {
  /**
   * Deduplicate servers by normalized name and repository URL
   * @param servers - Array of server records to deduplicate
   * @returns Array of unique server records with merged data
   */
  deduplicate(servers: ServerRecord[]): Promise<ServerRecord[]>;
  
  /**
   * Get current deduplication state
   * @returns Current state including server map and normalization mappings
   */
  getState(): DeduplicationState;
  
  /**
   * Save deduplication state to Key-Value Store
   * Enables incremental updates in future runs
   */
  saveState(): Promise<void>;
}

/**
 * Deduplication state persisted across actor runs
 * Maintains mappings for efficient duplicate detection
 * 
 * @property runId - Actor run ID
 * @property serverMap - Map of server keys to complete server records
 * @property normalizedNames - Map of normalized names to server keys
 * @property repositoryUrls - Map of normalized repository URLs to server keys
 * @property lastRunTimestamp - ISO 8601 timestamp of last run
 * @property updateMode - Whether this was a full or incremental update
 */
export interface DeduplicationState {
  runId: string;
  serverMap: Map<string, ServerRecord>;
  normalizedNames: Map<string, string>;
  repositoryUrls: Map<string, string>;
  lastRunTimestamp: string; // ISO 8601
  updateMode: 'full' | 'incremental';
}

/**
 * Predefined categories with associated keywords for server classification
 * Each category contains keywords that are matched against server name, description, and README
 * Servers can be assigned to multiple categories if they match multiple keyword sets
 */
export const CATEGORIES: Category[] = [
  {
    name: 'Database',
    keywords: ['database', 'sql', 'postgres', 'mysql', 'mongodb', 'dynamodb', 'redis', 'sqlite', 'db']
  },
  {
    name: 'File System',
    keywords: ['file', 'filesystem', 'storage', 's3', 'gcs', 'blob', 'fs', 'directory', 'upload', 'download']
  },
  {
    name: 'Web & API',
    keywords: ['http', 'api', 'web', 'fetch', 'rest', 'curl', 'request', 'url']
  },
  {
    name: 'Code & Development',
    keywords: ['git', 'github', 'code', 'repository', 'branch', 'commit', 'lint', 'test', 'build']
  },
  {
    name: 'AI & ML',
    keywords: ['ai', 'ml', 'model', 'llm', 'machine learning', 'neural', 'inference', 'embedding']
  },
  {
    name: 'Communication',
    keywords: ['slack', 'email', 'webhook', 'notification', 'chat', 'messaging', 'discord', 'teams']
  },
  {
    name: 'Data & Analytics',
    keywords: ['analytics', 'metrics', 'data', 'statistics', 'bigquery', 'datadog', 'grafana', 'observability']
  },
  {
    name: 'Cloud & Infrastructure',
    keywords: ['aws', 'azure', 'gcp', 'kubernetes', 'docker', 'cloud', 'infrastructure', 'deployment', 'terraform']
  },
  {
    name: 'Integration & Orchestration',
    keywords: ['integration', 'workflow', 'orchestration', 'automation', 'zapier', 'ifttt', 'pipeline']
  }
];




