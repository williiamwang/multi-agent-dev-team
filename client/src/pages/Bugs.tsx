import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, AlertTriangle, Info } from "lucide-react";

const SEVERITY_COLORS: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-blue-100 text-blue-700",
};

const SEVERITY_ICONS: Record<string, any> = {
  HIGH: AlertTriangle,
  MEDIUM: AlertCircle,
  LOW: Info,
};

export default function Bugs() {
  const [workflowId] = useState(1); // TODO: Get from context
  const [selectedBugId, setSelectedBugId] = useState<number | null>(null);

  const { data: bugs, isLoading } = trpc.bugs.listByWorkflow.useQuery({
    workflowId,
  });

  const { data: selectedBug } = trpc.bugs.getById.useQuery(
    { bugId: selectedBugId || 0 },
    { enabled: !!selectedBugId }
  );

  const { data: bugReplies } = trpc.bugs.getReplies.useQuery(
    { bugId: selectedBugId || 0 },
    { enabled: !!selectedBugId }
  );

  const sortedBugs = bugs
    ? [...bugs].sort((a, b) => {
        const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return (
          severityOrder[a.severity as keyof typeof severityOrder] -
          severityOrder[b.severity as keyof typeof severityOrder]
        );
      })
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Bug 追踪系统
          </h1>
          <p className="text-slate-600">
            提交、追踪和管理项目缺陷
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bug List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>缺陷列表</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : sortedBugs.length > 0 ? (
                  <div className="space-y-2">
                    {sortedBugs.map((bug) => {
                      const Icon = SEVERITY_ICONS[bug.severity];
                      return (
                        <button
                          key={bug.id}
                          onClick={() => setSelectedBugId(bug.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            selectedBugId === bug.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                              {bug.bugId}
                            </span>
                          </div>
                          <p className="text-sm font-semibold mt-1 truncate">
                            {bug.reproducingSteps.substring(0, 30)}...
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge
                              className={SEVERITY_COLORS[bug.severity] || ""}
                            >
                              {bug.severity}
                            </Badge>
                            <Badge variant="outline">{bug.status}</Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    暂无缺陷
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bug Details */}
          <div className="lg:col-span-2">
            {selectedBug ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{selectedBug.bugId}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(selectedBug.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          className={SEVERITY_COLORS[selectedBug.severity] || ""}
                        >
                          {selectedBug.severity}
                        </Badge>
                        <Badge variant="outline">{selectedBug.status}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Reproducing Steps */}
                    <div>
                      <h3 className="font-semibold text-sm mb-2">复现步骤</h3>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        {selectedBug.reproducingSteps}
                      </p>
                    </div>

                    {/* Expected vs Actual */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold text-sm mb-2">预期结果</h3>
                        <p className="text-sm text-gray-700 bg-green-50 p-3 rounded">
                          {selectedBug.expected}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm mb-2">实际结果</h3>
                        <p className="text-sm text-gray-700 bg-red-50 p-3 rounded">
                          {selectedBug.actual}
                        </p>
                      </div>
                    </div>

                    {/* Traceback */}
                    {selectedBug.traceback && (
                      <div>
                        <h3 className="font-semibold text-sm mb-2">Traceback</h3>
                        <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                          <pre>{selectedBug.traceback}</pre>
                        </div>
                      </div>
                    )}

                    {/* Related Task */}
                    {selectedBug.relatedTask && (
                      <div>
                        <h3 className="font-semibold text-sm mb-2">
                          关联任务
                        </h3>
                        <p className="text-sm text-gray-700">
                          {selectedBug.relatedTask}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Bug Replies */}
                {bugReplies && bugReplies.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>修复回复</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {bugReplies.map((reply) => (
                        <div
                          key={reply.id}
                          className="border-l-4 border-blue-500 pl-4 py-2"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">
                              {reply.replyType === "hotfix"
                                ? "Hotfix"
                                : "重构方案"}
                            </Badge>
                            <p className="text-xs text-gray-500">
                              {new Date(reply.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-sm text-gray-700">
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Submit Reply Button */}
                {selectedBug.status === "open" && (
                  <Button className="w-full">提交修复方案</Button>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      选择一个缺陷来查看详情
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
