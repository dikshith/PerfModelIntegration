"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAnalyticsPage } from "@/features/analytics/use-analytics-page"
import { usePerformanceSummary } from "@/features/analytics/hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Line, LineChart } from 'recharts'
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AnalyticsPage() {
  const {
    timeframe,
    metrics,
    isLoading,
    setTimeframe,
  } = useAnalyticsPage()

  const { data: summary, isLoading: loadingSummary } = usePerformanceSummary(timeframe)

  if (isLoading || loadingSummary) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Monitor your AI assistant&apos;s performance and usage</p>
        </div>
        <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as typeof timeframe)}>
          <TabsList>
            <TabsTrigger value="24h">Last 24 Hours</TabsTrigger>
            <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
            <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <Skeleton className="h-4 w-[100px]" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px]" />
                <Skeleton className="h-4 w-[100px] mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle><Skeleton className="h-6 w-[120px]" /></CardTitle>
              <CardDescription><Skeleton className="h-4 w-[200px]" /></CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle><Skeleton className="h-6 w-[120px]" /></CardTitle>
              <CardDescription><Skeleton className="h-4 w-[200px]" /></CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>Analytics data could not be loaded</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const statusIcon = {
    success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    warning: <AlertCircle className="h-4 w-4 text-yellow-500" />,
    error: <XCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Monitor your AI assistant&apos;s performance and usage</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm",
            metrics.status === "success" && "text-green-500",
            metrics.status === "warning" && "text-yellow-500",
            metrics.status === "error" && "text-red-500"
          )}>
            System Status: {metrics.status}
          </span>
          {statusIcon[metrics.status]}
        </div>
      </div>

      <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as typeof timeframe)}>
        <TabsList>
          <TabsTrigger value="24h">Last 24 Hours</TabsTrigger>
          <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
          <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalRequests ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.averageResponseTime ?? 0}ms</div>
            <p className="text-xs text-muted-foreground">p50: {summary?.p50 ?? 0}ms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">p90 / p99</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.p90 ?? 0}ms</div>
            <p className="text-xs text-muted-foreground">p99: {summary?.p99 ?? 0}ms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime / Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.uptime ?? 100}%</div>
            <p className="text-xs text-muted-foreground">Error Rate: {summary?.errorRate?.toFixed(2)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Series */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic & Latency Over Time</CardTitle>
          <CardDescription>Hourly buckets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary?.timeSeries || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="avgResponseTime" stroke="#82ca9d" name="Avg Latency (ms)" />
                <Line yAxisId="right" type="monotone" dataKey="requests" stroke="#8884d8" name="Requests" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Distributions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Latency Distribution</CardTitle>
            <CardDescription>Response time buckets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(summary?.responseTimeDistribution || {}).map(([bucket, count]) => ({ bucket, count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Codes</CardTitle>
            <CardDescription>HTTP status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(summary?.statusCodeDistribution || {}).map(([code, count]) => ({ code, count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="code" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Endpoints */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Slow Endpoints</CardTitle>
            <CardDescription>Highest average response times</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(summary?.topSlowEndpoints || []).map((e) => (
                <div key={e.key} className="flex items-center justify-between text-sm">
                  <div className="truncate mr-2">{e.key}</div>
                  <div className="text-muted-foreground">{e.averageResponseTime}ms • {e.count} req</div>
                </div>
              ))}
              {!summary?.topSlowEndpoints?.length && <div className="text-sm text-muted-foreground">No data</div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Error Endpoints</CardTitle>
            <CardDescription>Highest error counts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(summary?.topErrorEndpoints || []).map((e) => (
                <div key={e.key} className="flex items-center justify-between text-sm">
                  <div className="truncate mr-2">{e.key}</div>
                  <div className="text-muted-foreground">{e.errors} errors • {e.count} req</div>
                </div>
              ))}
              {!summary?.topErrorEndpoints?.length && <div className="text-sm text-muted-foreground">No data</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}