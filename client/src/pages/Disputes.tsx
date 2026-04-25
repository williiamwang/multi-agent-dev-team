import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, CheckCircle } from "lucide-react";

const DISPUTE_STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-700",
  in_discussion: "bg-blue-100 text-blue-700",
  architect_review: "bg-purple-100 text-purple-700",
  owner_decision: "bg-orange-100 text-orange-700",
  resolved: "bg-green-100 text-green-700",
};

export default function Disputes() {
  const [workflowId] = useState(1); // TODO: Get from context
  const [selectedDisputeId, setSelectedDisputeId] = useState<number | null>(
    null
  );

  const { data: disputes, isLoading } = trpc.disputes.listByWorkflow.useQuery({
    workflowId,
  });

  const { data: selectedDispute } = trpc.disputes.getById.useQuery(
    { disputeId: selectedDisputeId || 0 },
    { enabled: !!selectedDisputeId }
  );

  const { data: disputeRounds } = trpc.disputes.getRounds.useQuery(
    { disputeId: selectedDisputeId || 0 },
    { enabled: !!selectedDisputeId }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            争议仲裁流程
          </h1>
          <p className="text-slate-600">
            管理 Dev 与 PM 的意见分歧，通过 Architect 仲裁和老板决策解决
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dispute List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>争议列表</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : disputes && disputes.length > 0 ? (
                  <div className="space-y-2">
                    {disputes.map((dispute) => (
                      <button
                        key={dispute.id}
                        onClick={() => setSelectedDisputeId(dispute.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedDisputeId === dispute.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                            第 {dispute.roundCount}/3 轮
                          </span>
                        </div>
                        <p className="text-sm font-semibold mt-1 truncate">
                          {dispute.issue.substring(0, 30)}...
                        </p>
                        <Badge
                          className={
                            DISPUTE_STATUS_COLORS[dispute.status] || ""
                          }
                        >
                          {dispute.status}
                        </Badge>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    暂无争议
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Dispute Details */}
          <div className="lg:col-span-2">
            {selectedDispute ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>争议详情</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          发起者: {selectedDispute.initiatedRole}
                        </p>
                      </div>
                      <Badge
                        className={
                          DISPUTE_STATUS_COLORS[selectedDispute.status] || ""
                        }
                      >
                        {selectedDispute.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Issue */}
                    <div>
                      <h3 className="font-semibold text-sm mb-2">问题描述</h3>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        {selectedDispute.issue}
                      </p>
                    </div>

                    {/* Round Progress */}
                    <div>
                      <h3 className="font-semibold text-sm mb-2">
                        讨论进度
                      </h3>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-700">
                          第 {selectedDispute.roundCount} / 3 轮讨论
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${
                                (selectedDispute.roundCount / 3) * 100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Rounds */}
                    {disputeRounds && disputeRounds.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-2">
                          讨论记录
                        </h3>
                        <div className="space-y-3">
                          {disputeRounds.map((round) => (
                            <div
                              key={round.id}
                              className="border-l-4 border-blue-500 pl-4 py-2"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant="outline">
                                  第 {round.roundNumber} 轮 - {round.fromRole}
                                </Badge>
                                <p className="text-xs text-gray-500">
                                  {new Date(
                                    round.createdAt
                                  ).toLocaleString()}
                                </p>
                              </div>
                              <p className="text-sm text-gray-700">
                                {round.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Architect Decision */}
                    {selectedDispute.architectDecision && (
                      <div>
                        <h3 className="font-semibold text-sm mb-2">
                          Architect 仲裁
                        </h3>
                        <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
                          <p className="text-sm text-gray-700">
                            {selectedDispute.architectDecision}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Owner Decision */}
                    {selectedDispute.ownerDecision && (
                      <div>
                        <h3 className="font-semibold text-sm mb-2">
                          老板决策
                        </h3>
                        <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-700">
                              已解决
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {selectedDispute.ownerDecision}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {selectedDispute.status === "in_discussion" &&
                      selectedDispute.roundCount < 3 && (
                        <Button className="w-full">
                          提交第 {selectedDispute.roundCount + 1} 轮意见
                        </Button>
                      )}
                    {selectedDispute.status === "architect_review" && (
                      <Button className="w-full">提交 Architect 仲裁</Button>
                    )}
                    {selectedDispute.status === "owner_decision" && (
                      <Button className="w-full">提交老板决策</Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      选择一个争议来查看详情
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
