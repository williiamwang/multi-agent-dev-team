import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Eye } from "lucide-react";

const DOC_TYPE_NAMES: Record<string, string> = {
  PRD: "产品需求文档",
  Architecture: "技术架构",
  APIContract: "接口契约",
  TaskList: "任务清单",
  SelfTestReport: "自测报告",
  TestReport: "测试报告",
  ResearchReport: "调研报告",
};

const DOC_TYPE_COLORS: Record<string, string> = {
  PRD: "bg-blue-100 text-blue-700",
  Architecture: "bg-purple-100 text-purple-700",
  APIContract: "bg-green-100 text-green-700",
  TaskList: "bg-yellow-100 text-yellow-700",
  SelfTestReport: "bg-orange-100 text-orange-700",
  TestReport: "bg-red-100 text-red-700",
  ResearchReport: "bg-indigo-100 text-indigo-700",
};

export default function Documents() {
  const [workflowId] = useState(1); // TODO: Get from context
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);

  const { data: documents, isLoading } = trpc.documents.listByWorkflow.useQuery(
    { workflowId }
  );

  const { data: selectedDoc } = trpc.documents.getById.useQuery(
    { documentId: selectedDocId || 0 },
    { enabled: !!selectedDocId }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            文档管理中心
          </h1>
          <p className="text-slate-600">
            查看和管理项目各阶段输出的文档
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>文档列表</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : documents && documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDocId(doc.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedDocId === doc.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Badge
                            className={DOC_TYPE_COLORS[doc.docType] || ""}
                          >
                            {doc.docType}
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold mt-1 truncate">
                          {doc.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    暂无文档
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Document Viewer */}
          <div className="lg:col-span-2">
            {selectedDoc ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedDoc.title}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {DOC_TYPE_NAMES[selectedDoc.docType]}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {selectedDoc.fileUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            window.open(selectedDoc.fileUrl || "", "_blank")
                          }
                        >
                          <Download className="w-4 h-4 mr-1" />
                          下载
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedDoc.content}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    创建于:{" "}
                    {new Date(selectedDoc.createdAt).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      选择一个文档来查看详情
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
