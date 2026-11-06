import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  fetchTestReportsSummary,
  type AccessTokenProvider,
  type ReportSummary
} from "./api/client";
import "./styles.css";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
);

interface AppProps {
  getAccessToken?: AccessTokenProvider;
}

const lineOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: { color: "#667085", usePointStyle: true, padding: 18 }
    }
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: "#667085" } },
    y: {
      beginAtZero: true,
      grid: { color: "#eaecf0" },
      ticks: { color: "#667085", precision: 0 }
    }
  }
};

const doughnutOptions: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "68%",
  plugins: {
    legend: {
      position: "bottom",
      labels: { color: "#667085", usePointStyle: true, padding: 18 }
    }
  }
};

const barOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: "y",
  plugins: {
    legend: {
      position: "bottom",
      labels: { color: "#667085", usePointStyle: true, padding: 18 }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: "#eaecf0" },
      ticks: { color: "#667085", precision: 0 }
    },
    y: { grid: { display: false }, ticks: { color: "#475467" } }
  }
};

function suiteRouteId(name: string): string {
  return name.toLowerCase().replaceAll(" ", "-");
}

const thirdPartyViews = [
  { id: "overview", label: "Overview", url:"https://github.com", title: "Third-party overview" },
  { id: "activity", label: "Activity", url:"https://www.atlassian.com/software", title: "Recent activity" },
  { id: "issues", label: "Issues", url:"https://play.tailwindcss.com/", title: "Open issues" },
  { id: "quality", label: "Quality", url:"https://www.w3schools.com/", title: "Quality metrics" }
].map((view,) => {

  return {
    ...view,
    // url: `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
  };
});

function ThirdPartyViews() {
  const [activeViewId, setActiveViewId] = useState(thirdPartyViews[0].id);
  const activeView = thirdPartyViews.find((view) => view.id === activeViewId)!;

  return (
    <div className="reports">
      <Link className="reports-back-link" to="/dashboard">
        ← Back to dashboard
      </Link>
      <header className="reports-heading">
        <span className="eyebrow">CONNECTED REPORTING</span>
        <h1>3rd Party Views</h1>
        <p className="description">
          Open connected dashboards and reports in one place.
        </p>
      </header>
      <div className="third-party-tabs" role="tablist" aria-label="Third-party views">
        {thirdPartyViews.map((view) => (
          <button
            aria-controls="third-party-view-panel"
            aria-selected={activeView.id === view.id}
            className="third-party-tab"
            id={`third-party-tab-${view.id}`}
            key={view.id}
            onClick={() => setActiveViewId(view.id)}
            role="tab"
            type="button"
          >
            {view.label}
          </button>
        ))}
      </div>
      <section
        aria-labelledby={`third-party-tab-${activeView.id}`}
        className="third-party-frame"
        id="third-party-view-panel"
        role="tabpanel"
      >
        <iframe
          key={activeView.id}
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox=""
          src={activeView.url}
          title={activeView.label}
        />
      </section>
    </div>
  );
}

function ReportDetail({
  summary,
  status,
  message,
  onRetry
}: {
  summary: ReportSummary | null;
  status: "waiting" | "loading" | "ready" | "error";
  message: string | null;
  onRetry: () => void;
}) {
  const { reportId } = useParams();
  const suite = summary?.suites.find((item) => suiteRouteId(item.name) === reportId);

  return (
    <div className="reports">
      <Link className="reports-back-link" to="/dashboard/test-reports">
        ← Back to Test Reports
      </Link>
      {status === "loading" && (
        <section className="service-status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <div>
            <strong>Loading report details</strong>
            <p>Fetching suite results from the reports service…</p>
          </div>
        </section>
      )}
      {status === "error" && (
        <section className="service-status service-status-error" role="alert">
          <div>
            <strong>Could not load report details</strong>
            <p>{message}</p>
          </div>
          <button className="status-action" onClick={onRetry} type="button">
            Retry
          </button>
        </section>
      )}
      {status === "ready" && summary && suite && (
        <>
          <header className="reports-heading">
            <span className="eyebrow">SUITE REPORT</span>
            <h1>{suite.name} results</h1>
            <p className="description">
              Generated {new Date(summary.generated_at).toLocaleString()}. Sample data is
              randomized for demonstration.
            </p>
          </header>
          <section className="summary-grid" aria-label={`${suite.name} execution totals`}>
            <article className="summary-card">
              <span>Executed</span>
              <strong>{(suite.passed + suite.failed + suite.skipped).toLocaleString()}</strong>
              <small>Across the seven-day report</small>
            </article>
            <article className="summary-card summary-card-passed">
              <span>Passed</span>
              <strong>{suite.passed.toLocaleString()}</strong>
              <small>Successful test executions</small>
            </article>
            <article className="summary-card summary-card-failed">
              <span>Failed</span>
              <strong>{suite.failed.toLocaleString()}</strong>
              <small>Executions needing attention</small>
            </article>
            <article className="summary-card summary-card-rate">
              <span>Skipped</span>
              <strong>{suite.skipped.toLocaleString()}</strong>
              <small>Not run in this sample</small>
            </article>
          </section>
        </>
      )}
      {status === "ready" && !suite && (
        <section className="service-status service-status-error" role="alert">
          <div>
            <strong>Report not found</strong>
            <p>No suite report matches “{reportId}”.</p>
          </div>
        </section>
      )}
    </div>
  );
}

export default function App({ getAccessToken }: AppProps) {
  const [status, setStatus] = useState<"waiting" | "loading" | "ready" | "error">(
    getAccessToken ? "loading" : "waiting"
  );
  const [message, setMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!getAccessToken) {
      setStatus("waiting");
      return;
    }

    const controller = new AbortController();
    setStatus("loading");
    setMessage(null);
    setSummary(null);

    fetchTestReportsSummary(getAccessToken, controller.signal)
      .then((reportSummary) => {
        if (controller.signal.aborted) return;
        setSummary(reportSummary);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setMessage(error instanceof Error ? error.message : "Could not load test reports.");
        setStatus("error");
      });

    return () => controller.abort();
  }, [getAccessToken, retryCount]);

  const lineData: ChartData<"line"> | null = summary
    ? {
        labels: summary.trend.map((point) =>
          new Date(`${point.date}T12:00:00Z`).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric"
          })
        ),
        datasets: [
          {
            label: "Passed",
            data: summary.trend.map((point) => point.passed),
            borderColor: "#12b76a",
            backgroundColor: "#12b76a",
            tension: 0.35
          },
          {
            label: "Failed",
            data: summary.trend.map((point) => point.failed),
            borderColor: "#f04438",
            backgroundColor: "#f04438",
            tension: 0.35
          }
        ]
      }
    : null;
  const outcomeData: ChartData<"doughnut"> | null = summary
    ? {
        labels: ["Passed", "Failed", "Skipped"],
        datasets: [
          {
            data: [
              summary.totals.passed,
              summary.totals.failed,
              summary.totals.skipped
            ],
            backgroundColor: ["#12b76a", "#f04438", "#fdb022"],
            borderWidth: 0,
            hoverOffset: 6
          }
        ]
      }
    : null;
  const suiteData: ChartData<"bar"> | null = summary
    ? {
        labels: summary.suites.map((suite) => suite.name),
        datasets: [
          {
            label: "Passed",
            data: summary.suites.map((suite) => suite.passed),
            backgroundColor: "#12b76a",
            borderRadius: 4
          },
          {
            label: "Failed",
            data: summary.suites.map((suite) => suite.failed),
            backgroundColor: "#f04438",
            borderRadius: 4
          }
        ]
      }
    : null;

  return (
    <Routes>
      <Route path="third-party-views" element={<ThirdPartyViews />} />
      <Route
        path="/:reportId"
        element={
          <ReportDetail
            summary={summary}
            status={status}
            message={message}
            onRetry={() => setRetryCount((count) => count + 1)}
          />
        }
      />
      <Route
        index
        element={
          <div className="reports">
      <header className="reports-heading">
        <span className="eyebrow">QUALITY REPORTING</span>
        <h1>Test Reports</h1>
        <p className="description">
          Randomized execution insights generated by the QA Test Reports API.
        </p>
      </header>

      <section className={`service-status service-status-${status}`} aria-live="polite">
        {status === "loading" && <span className="spinner" aria-hidden="true" />}
        <div>
          <strong>
            {status === "waiting"
              ? "Open Test Reports from QA Pulse"
              : status === "loading"
                ? "Loading report data"
                : status === "ready"
                  ? "Reports service connected"
                  : "Reports service unavailable"}
          </strong>
          <p>
            {message ??
              (status === "waiting"
                ? "The authenticated QA Insights API connection is provided by the dashboard."
                : status === "ready" && summary
                  ? `Generated ${new Date(summary.generated_at).toLocaleString()}. Data is randomized for demonstration.`
                  : "Fetching the latest test execution summary.")}
          </p>
        </div>
        {(status === "ready" || status === "error") && (
          <button
            className="status-action"
            onClick={() => setRetryCount((count) => count + 1)}
            type="button"
          >
            {status === "error" ? "Retry" : "Generate new sample"}
          </button>
        )}
      </section>

      {summary && status === "ready" && (
        <>
          <section className="summary-grid" aria-label="Test execution totals">
            <article className="summary-card">
              <span>Total executions</span>
              <strong>{summary.totals.executed.toLocaleString()}</strong>
              <small>Across all suites and seven days</small>
            </article>
            <article className="summary-card summary-card-passed">
              <span>Passed</span>
              <strong>{summary.totals.passed.toLocaleString()}</strong>
              <small>Successful test executions</small>
            </article>
            <article className="summary-card summary-card-failed">
              <span>Failed</span>
              <strong>{summary.totals.failed.toLocaleString()}</strong>
              <small>Executions needing attention</small>
            </article>
            <article className="summary-card summary-card-rate">
              <span>Pass rate</span>
              <strong>{summary.totals.pass_rate.toFixed(1)}%</strong>
              <small>{summary.totals.skipped.toLocaleString()} skipped</small>
            </article>
          </section>

          <section className="suite-report-grid" aria-label="Suite report details">
            {summary.suites.map((suite) => (
              <Link
                className="suite-report-card"
                key={suite.name}
                to={`/dashboard/test-reports/${suiteRouteId(suite.name)}`}
              >
                <span className="eyebrow">SUITE REPORT</span>
                <strong>{suite.name}</strong>
                <small>
                  {suite.passed} passed · {suite.failed} failed · {suite.skipped} skipped
                </small>
                <span className="suite-report-action">View report →</span>
              </Link>
            ))}
          </section>

          <section className="charts-grid" aria-label="Test report charts">
            {lineData && (
              <article className="chart-card chart-card-wide">
                <header>
                  <h2>Execution trend</h2>
                  <p>Passed and failed tests over the last seven days</p>
                </header>
                <div className="chart-frame chart-frame-wide">
                  <Line data={lineData} options={lineOptions} />
                </div>
              </article>
            )}
            {outcomeData && (
              <article className="chart-card">
                <header>
                  <h2>Run outcomes</h2>
                  <p>Distribution across all generated executions</p>
                </header>
                <div className="chart-frame">
                  <Doughnut data={outcomeData} options={doughnutOptions} />
                </div>
              </article>
            )}
            {suiteData && (
              <article className="chart-card">
                <header>
                  <h2>Results by suite</h2>
                  <p>Passed and failed executions by test suite</p>
                </header>
                <div className="chart-frame">
                  <Bar data={suiteData} options={barOptions} />
                </div>
              </article>
            )}
          </section>
        </>
      )}
          </div>
        }
      />
      <Route
        path="*"
        element={<Navigate to="/dashboard/test-reports" replace />}
      />
    </Routes>
  );
}
