import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";

const STAGE_NAMES: Record<string, string> = {
  requirement: "需求挖掘 (CPO)",
  architecture: "架构设计 (Architect)",
  decomposition: "任务拆解 (PM)",
  development: "开发 (Dev)",
  testing: "测试 (QA)",
  bugfix: "Bug 修复",
  release: "发布",
};

const STAGE_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [workflowId, setWorkflowId] = useState<number | null>(null);

  // Get workflow status
  const { data: workflowData, isLoading } = trpc.workflows.getById.useQuery(
    { workflowId: workflowId || 0 },
    { enabled: !!workflowId }
  );

  // List workflows
  const { data: workflows } = trpc.workflows.listByProject.useQuery(
    { projectId: 1 }, // TODO: Get from context
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (workflows && workflows.length > 0) {
      setWorkflowId(workflows[0].id);
    }
  }, [workflows]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>请登录</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              您需要登录才能访问工作流仪表盘
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!workflowData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>没有工作流</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              请先创建一个项目和工作流
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { workflow, stages, approvals } = workflowData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            多智能体开发工作流
          </h1>
          <p className="text-slate-600">
            项目 #{workflow.projectId} - 当前阶段: {STAGE_NAMES[workflow.currentStage]}
          </p>
        </div>

        {/* Workflow Timeline */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">工作流进度</h2>

          <div className="flex items-center justify-between">
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center flex-1">
                {/* Stage Card */}
                <div className="flex-1">
                  <StageCard
                    stage={stage}
                    isActive={workflow.currentStage === stage.stageType}
                    approval={approvals.find((a) => a.stageId === stage.id)}
                  />
                </div>

                {/* Connector Line */}
                {index < stages.length - 1 && (
                  <div className="w-8 h-1 bg-slate-300 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stage Details */}
        {stages.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Stage Info */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {STAGE_NAMES[workflow.currentStage]} - 详情
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">状态</p>
                      <Badge
                        className={STAGE_COLORS[workflow.status] || ""}
                      >
                        {workflow.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">开始时间</p>
                      <p className="text-lg font-semibold">
                        {stages[0]?.startedAt
                          ? new Date(stages[0].startedAt).toLocaleString()
                          : "未开始"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>快速操作</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" variant="default">
                    查看文档
                  </Button>
                  <Button className="w-full" variant="outline">
                    查看任务
                  </Button>
                  <Button className="w-full" variant="outline">
                    查看 Bug
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StageCardProps {
  stage: any;
  isActive: boolean;
  approval?: any;
}

function StageCard({ stage, isActive, approval }: StageCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "in_progress":
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        isActive
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        {getStatusIcon(stage.status)}
        <h3 className="font-semibold text-sm">
          {STAGE_NAMES[stage.stageType]}
        </h3>
      </div>
      <Badge className={STAGE_COLORS[stage.status] || ""}>
        {stage.status}
      </Badge>
      {approval && approval.status === "pending" && (
        <div className="mt-2 text-xs text-orange-600 font-semibold">
          待老板确认
        </div>
      )}
    </div>
  );
}
