export type AccessTokenProvider = () => Promise<string>;

export interface ResultCounts {
  passed: number;
  failed: number;
  skipped: number;
}

export interface ReportSummary {
  generated_at: string;
  totals: ResultCounts & {
    executed: number;
    pass_rate: number;
  };
  trend: (ResultCounts & { date: string })[];
  suites: (ResultCounts & { name: string })[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isResultCounts(value: unknown): value is ResultCounts {
  return (
    isRecord(value) &&
    Number.isInteger(value.passed) &&
    Number.isInteger(value.failed) &&
    Number.isInteger(value.skipped) &&
    Number(value.passed) >= 0 &&
    Number(value.failed) >= 0 &&
    Number(value.skipped) >= 0
  );
}

function isReportSummary(value: unknown): value is ReportSummary {
  if (!isRecord(value) || typeof value.generated_at !== "string") return false;
  if (Number.isNaN(Date.parse(value.generated_at))) return false;

  const totals = value.totals;
  if (!isRecord(totals) || !isResultCounts(totals)) return false;
  if (
    !Number.isInteger(totals.executed) ||
    Number(totals.executed) < 0 ||
    typeof totals.pass_rate !== "number" ||
    !Number.isFinite(totals.pass_rate) ||
    totals.pass_rate < 0 ||
    totals.pass_rate > 100
  ) {
    return false;
  }

  if (!Array.isArray(value.trend) || !Array.isArray(value.suites)) return false;
  const validTrend = value.trend.every((point: unknown) => {
    if (!isRecord(point) || !isResultCounts(point) || typeof point.date !== "string") {
      return false;
    }
    return !Number.isNaN(Date.parse(point.date));
  });
  const validSuites = value.suites.every(
    (suite: unknown) =>
      isRecord(suite) && isResultCounts(suite) && typeof suite.name === "string"
  );
  return validTrend && validSuites;
}

export async function fetchTestReportsSummary(
  getAccessToken: AccessTokenProvider,
  signal?: AbortSignal
): Promise<ReportSummary> {
  const token = await getAccessToken();
  const response = await fetch("/api/test-reports/summary", {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "omit",
    signal
  });

  if (!response.ok) {
    throw new Error(`Could not load test reports (${response.status}).`);
  }

  const payload: unknown = await response.json();
  if (!isReportSummary(payload)) {
    throw new Error("The test reports API returned an invalid report summary.");
  }
  return payload;
}
