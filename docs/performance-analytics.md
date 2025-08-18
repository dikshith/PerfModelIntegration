# Performance Analytics

The system collects request metrics via a middleware and generates rich reports with KPIs, percentiles, time series, distributions, and AI-assisted insights.

## Data collected
- endpoint, method, statusCode, responseTime
- userAgent, clientIp (nullable)
- requestBody/responseBody (JSON, sanitized)
- metrics/metadata/tags (JSON)
- createdAt, updatedAt

## Endpoints
- GET /api/reports/performance?startDate&endDate&endpoint&method
  - Returns:
    - totalRequests, avg/min/max, p50/p90/p99
    - successRate, errorRate, uptime (approx)
    - endpointStats (per endpoint averages)
    - topSlowEndpoints, topErrorEndpoints
    - responseTimeDistribution, statusCodeDistribution, methodDistribution
    - timeSeries (hourly buckets by default)
    - anomalies (error spikes)
- GET /api/reports/metrics?startDate&endDate&endpoint&method
  - Raw metrics (capped) for detailed inspection
- GET /api/reports/health
  - Last hour summary: status, averageResponseTime, errorRate, totalRequests
- POST /api/reports/generate
  - Builds an AI-assisted report; falls back to a basic report when AI is unavailable
- GET /api/reports
  - List of generated reports (in-memory store) with summaries
- GET /api/reports/:id, GET /api/reports/:id/download

Notes
- Responses are wrapped by a global interceptor as `{ success: boolean, data?: T, error?: {...} }`.
- The frontend passes `startDate`/`endDate` to performance and metrics endpoints based on the selected timeframe (24h, 7d, 30d).

## Calculations
- Percentiles: p50/p90/p99 from sorted response times
- Distributions: latency buckets, status codes, methods
- Time series: hourly aggregation with avg latency and error/success rates
- Uptime: % of buckets with any successful requests
- Anomalies: buckets with errorRate > 3x median (or >10% if median is 0)

## Frontend integration
- Dashboard shows:
  - KPI cards: totalRequests, avg, p90, errorRate, uptime
  - Charts: line charts from `timeSeries`; bar charts for distributions
  - Tables: topSlowEndpoints and topErrorEndpoints
  - Report generation and list of past reports
- System status badge uses `GET /api/reports/health`.

## Recommendations
- Use p90 as the primary SLO for latency; alert if it crosses thresholds.
- Track top error endpoints and fix the top 2 first for meaningful gains.
- Add DB query metrics to `metrics.metadata` for deeper insights.

# Updated Performance Analytics UI

The analytics page now surfaces richer insights powered by the backend summary endpoint.

## UI Overview
- KPIs: Total Requests, Avg + p50, p90/p99, Uptime + Error Rate
- Time Series: hourly requests and average latency in a dual-axis line chart
- Distributions: latency buckets and status code histogram
- Top Endpoints: slowest and most error-prone endpoints

## Backend Mapping
- GET /api/reports/performance → PerformanceSummary
  - Fields: totalRequests, averageResponseTime, p50, p90, p99, uptime, errorRate, timeSeries, distributions, top endpoints, anomalies
- GET /api/reports/summary/current still powers the small status banner, while the main charts use the summary endpoint.

## Notes
- All additions are backward compatible; existing endpoints remain.
- Consider adding custom tags in metrics.metadata for deeper segmentation (e.g., feature names) and extend the UI accordingly.
