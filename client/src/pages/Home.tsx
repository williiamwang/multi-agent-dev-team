import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import {
  BarChart3,
  FileText,
  CheckSquare,
  AlertCircle,
  MessageSquare,
  Zap,
} from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Zap className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-2">
              多智能体开发团队
            </h1>
            <p className="text-slate-300">
              AI 驱动的协作开发工作流平台
            </p>
          </div>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <Button
                className="w-full"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                使用 Manus 登录
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: BarChart3,
      title: "工作流仪表盘",
      description: "CPO → Architect → PM → Dev → QA 完整流水线",
      path: "/dashboard",
    },
    {
      icon: FileText,
      title: "文档管理",
      description: "PRD、架构、接口、测试报告统一管理",
      path: "/documents",
    },
    {
      icon: CheckSquare,
      title: "任务看板",
      description: "原子化任务拆解、前后端分组展示",
      path: "/tasks",
    },
    {
      icon: AlertCircle,
      title: "Bug 追踪",
      description: "Traceback 格式提交，严重程度分级",
      path: "/bugs",
    },
    {
      icon: MessageSquare,
      title: "争议仲裁",
      description: "3 轮讨论 → Architect 仲裁 → 老板决策",
      path: "/disputes",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">
              多智能体开发团队
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">欢迎, {user?.name}</span>
            <Button variant="outline" size="sm">
              设置
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            开发工作流系统
          </h2>
          <p className="text-slate-600">
            通过 Manus API 驱动 6 个 AI Agent 角色，实现完整的研发流水线自动化
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.path}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(feature.path)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
