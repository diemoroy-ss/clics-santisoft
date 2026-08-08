// ─── Global TypeScript Types ─────────────────────────────────────────────────

export type Plan = 'FREE' | 'PRO' | 'ENTERPRISE';

export type FraudReason =
  | 'CLICK_FREQUENCY'
  | 'ZERO_SESSION'
  | 'NO_INTERACTION'
  | 'VPN_DETECTED'
  | 'PROXY_DETECTED'
  | 'DATACENTER'
  | 'MANUAL'
  | 'BOT_FINGERPRINT';

// ─── Tracking Payload ────────────────────────────────────────────────────────

export interface TrackPayload {
  siteKey: string;
  gclid?: string;
  fbclid?: string;
  userAgent?: string;
  fingerprint?: string;
  sessionTime?: number;       // seconds
  mouseEvents?: number;       // count of mouse/touch/scroll events
  referer?: string;
  screenRes?: string;
  timestamp?: number;         // client-side unix ms
}

// ─── GeoIP Response ──────────────────────────────────────────────────────────

export interface GeoIPResult {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  isp: string;
  isVPN: boolean;
  isProxy: boolean;
  isDatacenter: boolean;
  success: boolean;
}

// ─── Fraud Engine ────────────────────────────────────────────────────────────

export interface FraudCheckInput {
  ip: string;
  siteId: string;
  payload: TrackPayload;
  geo: GeoIPResult;
  rules: FraudRuleConfig;
}

export interface FraudCheckResult {
  isFraud: boolean;
  reason?: FraudReason;
  score: number;              // 0-100 fraud probability
}

export interface FraudRuleConfig {
  maxClicksPerIP: number;
  timeWindowMinutes: number;
  blockVPN: boolean;
  blockProxy: boolean;
  blockDatacenter: boolean;
  blockBots: boolean;
  minSessionSeconds: number;
  minMouseEvents: number;
  autoSyncGoogleAds: boolean;
  cpcEstimateUSD: number;
}

// ─── Dashboard Metrics ───────────────────────────────────────────────────────

export interface DashboardMetrics {
  totalClicks: number;
  fraudClicks: number;
  fraudRate: number;          // percentage 0-100
  moneySaved: number;         // USD
  lastBlockedIP: LastBlockedIP | null;
  clicksByDay: ClicksByDay[];
  topFraudReasons: TopFraudReason[];
  blockedIPsCount: number;
}

export interface LastBlockedIP {
  ip: string;
  country: string;
  countryCode: string;
  reason: FraudReason;
  blockedAt: string;          // ISO string
}

export interface ClicksByDay {
  date: string;               // YYYY-MM-DD
  total: number;
  fraud: number;
  legitimate: number;
}

export interface TopFraudReason {
  reason: FraudReason;
  count: number;
}

// ─── Blocked IP (for API responses) ─────────────────────────────────────────

export interface BlockedIPEntry {
  id: string;
  ip: string;
  reason: FraudReason;
  country: string;
  countryCode: string;
  isp: string;
  blockedAt: string;
  isActive: boolean;
}

// ─── Google Ads ──────────────────────────────────────────────────────────────

export interface GoogleAdsTokenData {
  customerId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface CampaignInfo {
  id: string;
  googleCampaignId: string;
  name: string;
  status: string;
  avgCpcUSD: number | null;
  blockedIPCount: number;
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Auth Session ────────────────────────────────────────────────────────────

export interface AuthSession {
  uid: string;
  email: string;
  name?: string;
}
