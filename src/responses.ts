export interface ThumbnailResult {
  key: string;
  location: string;
  size: number;
}

export interface SliceResult {
  index: number;
  offset_y: number;
  width: number;
  height: number;
  url: string;
  size?: number;
}

/** The target page's HTTP response. `headers` only with `save_headers`. */
export interface RenderResponseInfo {
  statusCode: number;
  statusCodeInitial?: number;
  /** `Key=Value` strings. */
  headers?: string[];
  urlRequested?: string;
  urlResolved?: string;
  urlResolvedInitial?: string;
}

export interface BlockDetectionResult {
  blocked: boolean;
  score: number;
  provider: string;
  signals: string[];
}

export interface UnblockSummary {
  blocked: boolean;
  unblocked: boolean;
  attempts: number;
  rung: number | null;
  rungOptions: Record<string, unknown> | null;
}

/** The JSON body of a successful render (`POST /v1/render/sync`). */
export interface RenderResult {
  /** Where the render was uploaded. */
  renderUrl: string;
  /** Size of the render in bytes. */
  size: number;
  renderTime?: number;
  queueTime?: number;
  bandwidth?: number;
  totalBandwidth?: number;
  width?: number;
  height?: number;
  pageWidth?: number;
  pageHeight?: number;
  requestDomains?: string[];
  /** An array, or an object keyed by thumbnail key with `thumbnails_object`. */
  thumbnails?: ThumbnailResult[] | Record<string, Omit<ThumbnailResult, "key">>;
  slices?: SliceResult[];
  htmlUrl?: string;
  mhtmlUrl?: string;
  metadataUrl?: string;
  headingsUrl?: string;
  tablesUrl?: string;
  structuredDataUrl?: string;
  markdownUrl?: string;
  custom_id?: string;
  metadata?: Record<string, unknown>;
  llm?: unknown;
  timestamp?: string;
  certifiedHash?: string;
  hashedOptions?: string;
  response?: RenderResponseInfo;
  /** Credits charged, for accounts that have credit reporting enabled. */
  creditsUsed?: number;
  /** Renders drawn from your allowance by this request. */
  renders?: number;
  /** Present while the account's payment is failing. */
  warning?: string;
  blockDetection?: BlockDetectionResult;
  unblock?: UnblockSummary;
}

/** `POST /v1/render/async` response (HTTP 201). */
export interface AsyncRenderCreated {
  status: "created";
  renderId: string;
  /** Poll this URL (or call `getRender(renderId)`) for the result. */
  statusUrl: string;
  warning?: string;
}

export interface RenderPending {
  renderId: string;
  status: "created" | "retrying";
  statusUrl: string;
  /** Set when a stalled render is being retried. */
  stalled?: boolean;
}

export interface RenderSucceeded extends RenderResult {
  renderId: string;
  status: "succeeded";
}

export interface RenderFailed {
  renderId: string;
  status: "failed";
  reason?: string;
  renderTime?: number;
  queueTime?: number;
  debugScreenshot?: { location: string; size?: number };
  /** The target page's final HTTP status, when the page loaded. */
  statusCode?: number;
  statusCodeInitial?: number;
  headers?: string[];
  urlRequested?: string;
  urlResolved?: string;
  urlResolvedInitial?: string;
}

export interface RenderNotFound {
  renderId: string;
  status: "not-found";
}

/** `GET /v1/render/:renderId`, discriminated on `status`. */
export type RenderStatus =
  RenderPending | RenderSucceeded | RenderFailed | RenderNotFound;

export interface WebhookMeta {
  /** ISO 8601. */
  startTime: string;
  /** ISO 8601. */
  endTime: string;
}

export interface WebhookRenderSucceeded {
  event: "render.succeeded";
  renderId: string;
  customId?: string;
  result: RenderResult & { renders: number };
  meta: WebhookMeta;
}

export interface WebhookRenderFailed {
  event: "render.failed";
  renderId: string;
  customId?: string;
  error: { message: string; code?: string };
  meta: WebhookMeta;
  result?: {
    renders: number;
    renderTime?: number;
    queueTime?: number;
    response?: RenderResponseInfo;
    debugScreenshot?: { location: string; size?: number };
  };
}

export type WebhookEvent = WebhookRenderSucceeded | WebhookRenderFailed;
