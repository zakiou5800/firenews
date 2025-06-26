import {
  AddCustomSourceData,
  AddCustomSourceError,
  CheckHealthData,
  CustomSource,
  DeleteCustomSourceData,
  DeleteCustomSourceError,
  DeleteCustomSourceParams,
  GetActiveFiresData,
  GetAiStatusData,
  GetCustomSourcesData,
  GetFireStatsData,
  GetFiresByWilayaData,
  GetFiresByWilayaError,
  GetFiresByWilayaParams,
  GetHighConfidenceFiresData,
  GetHighConfidenceFiresError,
  GetHighConfidenceFiresParams,
  GetScrapingModeData,
  ManualScrapeData,
  ManualScrapeError,
  ManualScrapeRequest,
  ScrapingModeRequest,
  SetScrapingModeData,
  SetScrapingModeError,
  ToggleSourceStatusData,
  ToggleSourceStatusError,
  ToggleSourceStatusParams,
  UpdateCustomSourceData,
  UpdateCustomSourceError,
  UpdateCustomSourceParams,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * @description Scrapes and returns a list of active fire incidents with enhanced location extraction.
   *
   * @tags fires, dbtn/module:fires, dbtn/hasAuth
   * @name get_active_fires
   * @summary Get Active Fires
   * @request GET:/routes/api/fires/active
   */
  get_active_fires = (params: RequestParams = {}) =>
    this.request<GetActiveFiresData, any>({
      path: `/routes/api/fires/active`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get fire incidents for a specific wilaya.
   *
   * @tags fires, dbtn/module:fires, dbtn/hasAuth
   * @name get_fires_by_wilaya
   * @summary Get Fires By Wilaya
   * @request GET:/routes/api/fires/active/by-wilaya/{wilaya_name}
   */
  get_fires_by_wilaya = ({ wilayaName, ...query }: GetFiresByWilayaParams, params: RequestParams = {}) =>
    this.request<GetFiresByWilayaData, GetFiresByWilayaError>({
      path: `/routes/api/fires/active/by-wilaya/${wilayaName}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get fire incidents with high location confidence.
   *
   * @tags fires, dbtn/module:fires, dbtn/hasAuth
   * @name get_high_confidence_fires
   * @summary Get High Confidence Fires
   * @request GET:/routes/api/fires/active/high-confidence
   */
  get_high_confidence_fires = (query: GetHighConfidenceFiresParams, params: RequestParams = {}) =>
    this.request<GetHighConfidenceFiresData, GetHighConfidenceFiresError>({
      path: `/routes/api/fires/active/high-confidence`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Get statistics about current fire incidents.
   *
   * @tags fires, dbtn/module:fires, dbtn/hasAuth
   * @name get_fire_stats
   * @summary Get Fire Stats
   * @request GET:/routes/api/fires/stats
   */
  get_fire_stats = (params: RequestParams = {}) =>
    this.request<GetFireStatsData, any>({
      path: `/routes/api/fires/stats`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get all custom sources for the current user
   *
   * @tags dbtn/module:scraping_control, dbtn/hasAuth
   * @name get_custom_sources
   * @summary Get Custom Sources
   * @request GET:/routes/scraping/sources
   */
  get_custom_sources = (params: RequestParams = {}) =>
    this.request<GetCustomSourcesData, any>({
      path: `/routes/scraping/sources`,
      method: "GET",
      ...params,
    });

  /**
   * @description Add a new custom source for the current user
   *
   * @tags dbtn/module:scraping_control, dbtn/hasAuth
   * @name add_custom_source
   * @summary Add Custom Source
   * @request POST:/routes/scraping/sources
   */
  add_custom_source = (data: CustomSource, params: RequestParams = {}) =>
    this.request<AddCustomSourceData, AddCustomSourceError>({
      path: `/routes/scraping/sources`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Update a custom source
   *
   * @tags dbtn/module:scraping_control, dbtn/hasAuth
   * @name update_custom_source
   * @summary Update Custom Source
   * @request PUT:/routes/scraping/sources/{source_id}
   */
  update_custom_source = (
    { sourceId, ...query }: UpdateCustomSourceParams,
    data: CustomSource,
    params: RequestParams = {},
  ) =>
    this.request<UpdateCustomSourceData, UpdateCustomSourceError>({
      path: `/routes/scraping/sources/${sourceId}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete a custom source
   *
   * @tags dbtn/module:scraping_control, dbtn/hasAuth
   * @name delete_custom_source
   * @summary Delete Custom Source
   * @request DELETE:/routes/scraping/sources/{source_id}
   */
  delete_custom_source = ({ sourceId, ...query }: DeleteCustomSourceParams, params: RequestParams = {}) =>
    this.request<DeleteCustomSourceData, DeleteCustomSourceError>({
      path: `/routes/scraping/sources/${sourceId}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Get Gemini AI service status and capabilities
   *
   * @tags dbtn/module:scraping_control, dbtn/hasAuth
   * @name get_ai_status
   * @summary Get Ai Status
   * @request GET:/routes/scraping/ai-status
   */
  get_ai_status = (params: RequestParams = {}) =>
    this.request<GetAiStatusData, any>({
      path: `/routes/scraping/ai-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Toggle active status of a custom source
   *
   * @tags dbtn/module:scraping_control, dbtn/hasAuth
   * @name toggle_source_status
   * @summary Toggle Source Status
   * @request POST:/routes/scraping/sources/{source_id}/toggle
   */
  toggle_source_status = ({ sourceId, ...query }: ToggleSourceStatusParams, params: RequestParams = {}) =>
    this.request<ToggleSourceStatusData, ToggleSourceStatusError>({
      path: `/routes/scraping/sources/${sourceId}/toggle`,
      method: "POST",
      ...params,
    });

  /**
   * @description Trigger manual scraping with AI-powered analysis
   *
   * @tags dbtn/module:scraping_control, dbtn/hasAuth
   * @name manual_scrape
   * @summary Manual Scrape
   * @request POST:/routes/scraping/manual-scrape
   */
  manual_scrape = (data: ManualScrapeRequest, params: RequestParams = {}) =>
    this.request<ManualScrapeData, ManualScrapeError>({
      path: `/routes/scraping/manual-scrape`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get current scraping mode for user (stored in user preferences or default to auto)
   *
   * @tags dbtn/module:scraping_control, dbtn/hasAuth
   * @name get_scraping_mode
   * @summary Get Scraping Mode
   * @request GET:/routes/scraping/mode
   */
  get_scraping_mode = (params: RequestParams = {}) =>
    this.request<GetScrapingModeData, any>({
      path: `/routes/scraping/mode`,
      method: "GET",
      ...params,
    });

  /**
   * @description Set scraping mode for user and persist to database
   *
   * @tags dbtn/module:scraping_control, dbtn/hasAuth
   * @name set_scraping_mode
   * @summary Set Scraping Mode
   * @request POST:/routes/scraping/mode
   */
  set_scraping_mode = (data: ScrapingModeRequest, params: RequestParams = {}) =>
    this.request<SetScrapingModeData, SetScrapingModeError>({
      path: `/routes/scraping/mode`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
}
