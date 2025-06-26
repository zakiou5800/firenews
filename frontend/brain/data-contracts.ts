/** CustomSource */
export interface CustomSource {
  /** Name */
  name: string;
  /**
   * Url
   * @format uri
   * @minLength 1
   * @maxLength 2083
   */
  url: string;
  /**
   * Source Type
   * @default "website"
   */
  source_type?: string;
  /**
   * Selectors
   * @default ["h1","h2","h3",".title",".headline"]
   */
  selectors?: string[];
}

/** CustomSourceResponse */
export interface CustomSourceResponse {
  /** Id */
  id: number;
  /** Name */
  name: string;
  /** Url */
  url: string;
  /** Source Type */
  source_type: string;
  /** Selectors */
  selectors: string[];
  /** Is Active */
  is_active: boolean;
  /** Created At */
  created_at: string;
  /** Updated At */
  updated_at: string;
}

/** FireIncident */
export interface FireIncident {
  /**
   * Id
   * Unique incident identifier
   */
  id: string;
  location: FireLocation;
  /**
   * Timestamp
   * Incident timestamp
   */
  timestamp: string;
  /**
   * Severity
   * Fire severity level
   */
  severity: string;
  /**
   * Status
   * Current fire status
   */
  status: string;
  /**
   * Description
   * Incident description
   */
  description: string;
  /**
   * Link
   * Source article link
   */
  link: string;
  /**
   * Source
   * News source
   */
  source: string;
  /**
   * Confidence
   * Location extraction confidence (0-1)
   */
  confidence: number;
  /**
   * Fire Type
   * Type of fire (forest, urban, industrial, etc.)
   */
  fire_type?: string | null;
  /**
   * Casualties
   * Casualties and injuries if mentioned
   */
  casualties?: string | null;
  /**
   * Emergency Services
   * Emergency services involved
   */
  emergency_services?: string | null;
  /**
   * Affected Area
   * Affected area details
   */
  affected_area?: string | null;
  /**
   * Cause
   * Fire cause if mentioned
   */
  cause?: string | null;
  /**
   * Weather Conditions
   * Weather conditions affecting fire
   */
  weather_conditions?: string | null;
  /**
   * Evacuation Info
   * Evacuation information if available
   */
  evacuation_info?: string | null;
  /**
   * Damage Assessment
   * Damage assessment if mentioned
   */
  damage_assessment?: string | null;
  /**
   * Date Mentioned
   * Specific date/time mentioned in article
   */
  date_mentioned?: string | null;
  /**
   * Ai Enhanced
   * Whether AI analysis provided enhanced details
   * @default false
   */
  ai_enhanced?: boolean;
}

/** FireLocation */
export interface FireLocation {
  /**
   * Lat
   * Latitude coordinate
   */
  lat: number;
  /**
   * Lon
   * Longitude coordinate
   */
  lon: number;
  /**
   * Wilaya
   * Wilaya (province) name
   */
  wilaya: string;
  /**
   * Wilaya Code
   * Official wilaya code
   */
  wilaya_code?: number | null;
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/** ManualScrapeRequest */
export interface ManualScrapeRequest {
  /** Source Ids */
  source_ids?: number[] | null;
}

/** ManualScrapeResponse */
export interface ManualScrapeResponse {
  /** Total Articles */
  total_articles: number;
  /** Results */
  results: ScrapeResult[];
  /** Duration Seconds */
  duration_seconds: number;
  /**
   * Ai Analysis Used
   * @default false
   */
  ai_analysis_used?: boolean;
  /**
   * High Confidence Articles
   * @default 0
   */
  high_confidence_articles?: number;
}

/** ScrapeResult */
export interface ScrapeResult {
  /** Source Id */
  source_id: number | null;
  /** Source Name */
  source_name: string;
  /** Articles Found */
  articles_found: number;
  /** Status */
  status: string;
  /** Error */
  error?: string | null;
  /** Duration Seconds */
  duration_seconds: number;
  /**
   * Ai Enhanced
   * @default false
   */
  ai_enhanced?: boolean | null;
  /** Ai Confidence Avg */
  ai_confidence_avg?: number | null;
}

/** ScrapingModeRequest */
export interface ScrapingModeRequest {
  /** Mode */
  mode: string;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

export type CheckHealthData = HealthResponse;

/** Response Get Active Fires */
export type GetActiveFiresData = FireIncident[];

export interface GetFiresByWilayaParams {
  /** Wilaya Name */
  wilayaName: string;
}

/** Response Get Fires By Wilaya */
export type GetFiresByWilayaData = FireIncident[];

export type GetFiresByWilayaError = HTTPValidationError;

export interface GetHighConfidenceFiresParams {
  /**
   * Min Confidence
   * @default 0.7
   */
  min_confidence?: number;
}

/** Response Get High Confidence Fires */
export type GetHighConfidenceFiresData = FireIncident[];

export type GetHighConfidenceFiresError = HTTPValidationError;

export type GetFireStatsData = any;

/** Response Get Custom Sources */
export type GetCustomSourcesData = CustomSourceResponse[];

export type AddCustomSourceData = CustomSourceResponse;

export type AddCustomSourceError = HTTPValidationError;

export interface UpdateCustomSourceParams {
  /** Source Id */
  sourceId: number;
}

export type UpdateCustomSourceData = CustomSourceResponse;

export type UpdateCustomSourceError = HTTPValidationError;

export interface DeleteCustomSourceParams {
  /** Source Id */
  sourceId: number;
}

export type DeleteCustomSourceData = any;

export type DeleteCustomSourceError = HTTPValidationError;

/** Response Get Ai Status */
export type GetAiStatusData = Record<string, any>;

export interface ToggleSourceStatusParams {
  /** Source Id */
  sourceId: number;
}

export type ToggleSourceStatusData = any;

export type ToggleSourceStatusError = HTTPValidationError;

export type ManualScrapeData = ManualScrapeResponse;

export type ManualScrapeError = HTTPValidationError;

export type GetScrapingModeData = any;

export type SetScrapingModeData = any;

export type SetScrapingModeError = HTTPValidationError;
