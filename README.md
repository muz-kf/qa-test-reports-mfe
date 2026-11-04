# Test Reports MFE

React micro-frontend for the QA Test Reports experience. It exposes `./App` and
is loaded on demand by the dashboard MFE; it is not registered in
`qa-mfe-shell`.

The MFE calls the same-origin `/api/test-reports/*` route and supplies the
Keycloak access token provided by its host. The QA Insights API validates the
token and proxies requests to the internal `qa-test-reports-api` service. The
browser does not call the microservice directly.

Run the standalone dev server on port 3005 with `npm run dev`. Without a host
that passes `getAccessToken`, the standalone UI directs users to open Test
Reports from the QA Pulse dashboard. The report API returns a freshly
generated seven-day test execution snapshot; the MFE shows summary cards, an
outcome doughnut, an execution trend line, and results by suite.

Run `npm test` for a TypeScript check and `npm run build` for a production
build.
