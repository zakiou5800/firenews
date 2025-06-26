import {
  AddCustomSourceData,
  CheckHealthData,
  CustomSource,
  DeleteCustomSourceData,
  GetActiveFiresData,
  GetAiStatusData,
  GetCustomSourcesData,
  GetFireStatsData,
  GetFiresByWilayaData,
  GetHighConfidenceFiresData,
  GetScrapingModeData,
  ManualScrapeData,
  ManualScrapeRequest,
  ScrapingModeRequest,
  SetScrapingModeData,
  ToggleSourceStatusData,
  UpdateCustomSourceData,
} from "./data-contracts";

export namespace Brain {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * @description Scrapes and returns a list of active fire incidents with enhanced location extraction.
   * @tags fires, dbtn/module:fires, dbtn/hasAuth
   * @name get_active_fires
   * @summary Get Active Fires
   * @request GET:/routes/api/fires/active
   */
  export namespace get_active_fires {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetActiveFiresData;
  }

  /**
   * @description Get fire incidents for a specific wilaya.
   * @tags fires, dbtn/module:fires, dbtn/hasAuth
   * @name get_fires_by_wilaya
   * @summary Get Fires By Wilaya
   * @request GET:/routes/api/fires/active/by-wilaya/{wilaya_name}
   */
  export namespace get_fires_by_wilaya {
    export type RequestParams = {
      /** Wilaya Name */
      wilayaName: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetFiresByWilayaData;
  }

  /**
   * @description Get fire incidents with high location confidence.
   * @tags fires, dbtn/module:fires, dbtn/hasAuth
   * @name get_high_confidence_fires
   * @summary Get High Confidence Fires
   * @request GET:/routes/api/fires/active/high-confidence
   */
  export namespace get_high_confidence_fires {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Min Confidence
       * @default 0.7
       */
      min_confidence?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetHighConfidenceFiresData;
  }

  /**
   * @description Get statistics about current fire incidents.
   * @tags fires, dbtn/module:fires, dbtn/hasAuth
   * @name get_fire_stats
   * @summary Get Fire Stats
   * @request GET:/routes/api/fires/stats
   */
  export namespace get_fire_stats {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetFireStatsData;
  }

  /**
   * @description Get all custom sources for the current user
   * @tags dbtn/module:scraping_control, dbtn/hasAuth
   * @name get_custom_sources
   * @summary Get Custom Sources
   * @request GET:/routes/scraping/sources
   */
  export namespace get_custom_sources {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCustomSourcesData;
  }

  /**
   * @description Add a new custom source for the current user
   * @tags dbtn/module:scraping_control, dbtn/hasAuth
   * @name add_custom_source
   * @summary Add Custom Source
   * @request POST:/routes/scraping/sources
   */
  export namespace add_custom_source {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CustomSource;
    export type RequestHeaders = {};
    export type ResponseBody = AddCustomSourceData;
  }

  /**
   * @description Update a custom source
   * @tags dbtn/module:scraping_control, dbtn/hasAuth
   * @name update_custom_source
   * @summary Update Custom Source
   * @request PUT:/routes/scraping/sources/{source_id}
   */
  export namespace update_custom_source {
    export type RequestParams = {
      /** Source Id */
      sourceId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = CustomSource;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateCustomSourceData;
  }

  /**
   * @description Delete a custom source
   * @tags dbtn/module:scraping_control, dbtn/hasAuth
   * @name delete_custom_source
   * @summary Delete Custom Source
   * @request DELETE:/routes/scraping/sources/{source_id}
   */
  export namespace delete_custom_source {
    export type RequestParams = {
      /** Source Id */
      sourceId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteCustomSourceData;
  }

  /**
   * @description Get Gemini AI service status and capabilities
   * @tags dbtn/module:scraping_control, dbtn/hasAuth
   * @name get_ai_status
   * @summary Get Ai Status
   * @request GET:/routes/scraping/ai-status
   */
  export namespace get_ai_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAiStatusData;
  }

  /**
   * @description Toggle active status of a custom source
   * @tags dbtn/module:scraping_control, dbtn/hasAuth
   * @name toggle_source_status
   * @summary Toggle Source Status
   * @request POST:/routes/scraping/sources/{source_id}/toggle
   */
  export namespace toggle_source_status {
    export type RequestParams = {
      /** Source Id */
      sourceId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ToggleSourceStatusData;
  }

  /**
   * @description Trigger manual scraping with AI-powered analysis
   * @tags dbtn/module:scraping_control, dbtn/hasAuth
   * @name manual_scrape
   * @summary Manual Scrape
   * @request POST:/routes/scraping/manual-scrape
   */
  export namespace manual_scrape {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ManualScrapeRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ManualScrapeData;
  }

  /**
   * @description Get current scraping mode for user (stored in user preferences or default to auto)
   * @tags dbtn/module:scraping_control, dbtn/hasAuth
   * @name get_scraping_mode
   * @summary Get Scraping Mode
   * @request GET:/routes/scraping/mode
   */
  export namespace get_scraping_mode {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetScrapingModeData;
  }

  /**
   * @description Set scraping mode for user and persist to database
   * @tags dbtn/module:scraping_control, dbtn/hasAuth
   * @name set_scraping_mode
   * @summary Set Scraping Mode
   * @request POST:/routes/scraping/mode
   */
  export namespace set_scraping_mode {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ScrapingModeRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SetScrapingModeData;
  }
}
