"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAllReports, useGenerateReport, useDownloadReport } from "@/features/analytics/hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, FileText, Plus } from "lucide-react"
import { format } from "date-fns"

export default function ReportsPage() {
  const { data: reports, isLoading } = useAllReports()
  const { mutate: generateReport, isPending: isGenerating } = useGenerateReport()
  const { mutate: downloadReport, isPending: isDownloading } = useDownloadReport()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Performance Reports</h1>
            <p className="text-muted-foreground">View and manage performance reports</p>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle><Skeleton className="h-4 w-[200px]" /></CardTitle>
                <CardDescription><Skeleton className="h-4 w-[100px]" /></CardDescription>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" disabled>
                  <Download className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Performance Reports</h1>
          <p className="text-muted-foreground">View and manage performance reports</p>
        </div>
        <Button onClick={() => generateReport()} disabled={isGenerating}>
          <Plus className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports?.data?.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Report {report.id.slice(0, 8)}
              </CardTitle>
              <CardDescription>
                {format(new Date(report.createdAt), "PPp")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <span className={
                    report.status === "completed" ? "text-green-600" :
                    report.status === "failed" ? "text-red-600" :
                    "text-yellow-600"
                  }>
                    {report.status}
                  </span>
                </div>
                {report.metrics && (
                  <>
                    <div>
                      <span className="font-medium">Total Requests:</span>{" "}
                      {report.metrics.totalRequests}
                    </div>
                    <div>
                      <span className="font-medium">Success Rate:</span>{" "}
                      {(report.metrics.successRate || 0 * 100).toFixed(1)}%
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadReport(report.id)}
                disabled={isDownloading || report.status !== "completed"}
              >
                <Download className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}

        {!reports?.data?.length && (
          <Card className="col-span-full p-6">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Reports</h3>
              <p className="text-muted-foreground">
                Generate a new report to see performance metrics
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
} 