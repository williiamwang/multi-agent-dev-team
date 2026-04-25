import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react";

const TASK_STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  blocked: "bg-red-100 text-red-700",
};

const TASK_CATEGORY_NAMES: Record<string, string> = {
  frontend: "前端",
  backend: "后端",
  infrastructure: "基础设施",
};

export default function Tasks() {
  const [workflowId] = useState(1); // TODO: Get from context
  const [selectedCategory, setSelectedCategory] = useState<
    "frontend" | "backend" | "infrastructure"
  >("frontend");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  // List tasks by category
  const { data: tasks, isLoading } = trpc.tasks.listByCategory.useQuery({
    workflowId,
    category: selectedCategory,
  });

  const { data: selectedTask } = trpc.tasks.getById.useQuery(
    { taskId: selectedTaskId || 0 },
    { enabled: !!selectedTaskId }
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "in_progress":
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case "blocked":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            原子化任务看板
          </h1>
          <p className="text-slate-600">
            查看和管理项目的所有任务
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>任务列表</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={selectedCategory}
                  onValueChange={(value) =>
                    setSelectedCategory(
                      value as "frontend" | "backend" | "infrastructure"
                    )
                  }
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="frontend">前端</TabsTrigger>
                    <TabsTrigger value="backend">后端</TabsTrigger>
                    <TabsTrigger value="infrastructure">基础设施</TabsTrigger>
                  </TabsList>

                  <TabsContent value={selectedCategory} className="mt-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : tasks && tasks.length > 0 ? (
                      <div className="space-y-2">
                        {tasks.map((task) => (
                          <button
                            key={task.id}
                            onClick={() => setSelectedTaskId(task.id)}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                              selectedTaskId === task.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {getStatusIcon(task.status)}
                              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                {task.taskId}
                              </span>
                            </div>
                            <p className="text-sm font-semibold mt-1 truncate">
                              {task.taskName}
                            </p>
                            <Badge
                              className={TASK_STATUS_COLORS[task.status] || ""}
                            >
                              {task.status}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        暂无任务
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Task Details */}
          <div className="lg:col-span-2">
            {selectedTask ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedTask.taskName}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedTask.taskId}
                      </p>
                    </div>
                    <Badge
                      className={TASK_STATUS_COLORS[selectedTask.status] || ""}
                    >
                      {selectedTask.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Prerequisites */}
                  {selectedTask.prerequisites && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2">前置条件</h3>
                      <p className="text-sm text-gray-700">
                        {selectedTask.prerequisites}
                      </p>
                    </div>
                  )}

                  {/* Inputs & Outputs */}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedTask.inputs && (
                      <div>
                        <h3 className="font-semibold text-sm mb-2">输入</h3>
                        <div className="bg-gray-50 p-3 rounded text-xs">
                          <pre className="overflow-x-auto">
                            {selectedTask.inputs}
                          </pre>
                        </div>
                      </div>
                    )}
                    {selectedTask.outputs && (
                      <div>
                        <h3 className="font-semibold text-sm mb-2">输出</h3>
                        <div className="bg-gray-50 p-3 rounded text-xs">
                          <pre className="overflow-x-auto">
                            {selectedTask.outputs}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acceptance Criteria */}
                  {selectedTask.acceptanceCriteria && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2">验收标准</h3>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        <pre className="overflow-x-auto text-xs">
                          {selectedTask.acceptanceCriteria}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Self-Test Cases */}
                  {selectedTask.selfTestCases && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2">自测用例</h3>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        <pre className="overflow-x-auto text-xs">
                          {selectedTask.selfTestCases}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Dependencies */}
                  {selectedTask.dependencies && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2">依赖任务</h3>
                      <p className="text-sm text-gray-700">
                        {selectedTask.dependencies}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    {selectedTask.status === "pending" && (
                      <Button className="flex-1">开始任务</Button>
                    )}
                    {selectedTask.status === "in_progress" && (
                      <Button className="flex-1" variant="outline">
                        标记完成
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      选择一个任务来查看详情
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
