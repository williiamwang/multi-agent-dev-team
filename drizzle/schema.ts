import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, longtext, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============= Projects & Workflows =============

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ownerId: int("ownerId").notNull(),
  status: mysqlEnum("status", ["draft", "active", "completed", "archived"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

export const workflows = mysqlTable("workflows", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  currentStage: mysqlEnum("currentStage", ["requirement", "architecture", "decomposition", "development", "testing", "bugfix", "release"]).default("requirement").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "paused", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

export const stages = mysqlTable("stages", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  stageType: mysqlEnum("stageType", ["requirement", "architecture", "decomposition", "development", "testing", "bugfix", "release"]).notNull(),
  role: mysqlEnum("role", ["CPO", "Architect", "PM", "Dev", "QA", "OSS"]).notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed"]).default("pending").notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Stage = typeof stages.$inferSelect;
export type InsertStage = typeof stages.$inferInsert;

// ============= AI Agents & Tasks =============

export const aiAgents = mysqlTable("aiAgents", {
  id: int("id").autoincrement().primaryKey(),
  role: mysqlEnum("role", ["CPO", "Architect", "PM", "Dev", "QA", "OSS"]).notNull().unique(),
  persona: longtext("persona").notNull(),
  manusProjectId: varchar("manusProjectId", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AIAgent = typeof aiAgents.$inferSelect;
export type InsertAIAgent = typeof aiAgents.$inferInsert;

export const agentTasks = mysqlTable("agentTasks", {
  id: int("id").autoincrement().primaryKey(),
  stageId: int("stageId").notNull(),
  agentId: int("agentId").notNull(),
  manusTaskId: varchar("manusTaskId", { length: 255 }).notNull(),
  prompt: longtext("prompt").notNull(),
  status: mysqlEnum("status", ["created", "running", "completed", "failed"]).default("created").notNull(),
  result: longtext("result"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgentTask = typeof agentTasks.$inferSelect;
export type InsertAgentTask = typeof agentTasks.$inferInsert;

export const agentMessages = mysqlTable("agentMessages", {
  id: int("id").autoincrement().primaryKey(),
  agentTaskId: int("agentTaskId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: longtext("content").notNull(),
  attachments: json("attachments"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentMessage = typeof agentMessages.$inferSelect;
export type InsertAgentMessage = typeof agentMessages.$inferInsert;

// ============= Documents =============

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  stageId: int("stageId").notNull(),
  docType: mysqlEnum("docType", ["PRD", "Architecture", "APIContract", "TaskList", "SelfTestReport", "TestReport", "ResearchReport"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: longtext("content").notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ============= Atomic Tasks =============

export const atomicTasks = mysqlTable("atomicTasks", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  taskId: varchar("taskId", { length: 50 }).notNull(),
  taskName: varchar("taskName", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["frontend", "backend", "infrastructure"]).notNull(),
  prerequisites: text("prerequisites"),
  inputs: longtext("inputs"),
  outputs: longtext("outputs"),
  acceptanceCriteria: longtext("acceptanceCriteria"),
  selfTestCases: longtext("selfTestCases"),
  dependencies: text("dependencies"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "blocked"]).default("pending").notNull(),
  assignedTo: int("assignedTo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AtomicTask = typeof atomicTasks.$inferSelect;
export type InsertAtomicTask = typeof atomicTasks.$inferInsert;

// ============= Bugs =============

export const bugs = mysqlTable("bugs", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  bugId: varchar("bugId", { length: 50 }).notNull(),
  relatedTask: varchar("relatedTask", { length: 50 }),
  severity: mysqlEnum("severity", ["HIGH", "MEDIUM", "LOW"]).notNull(),
  reproducingSteps: longtext("reproducingSteps").notNull(),
  expected: text("expected").notNull(),
  actual: text("actual").notNull(),
  traceback: longtext("traceback"),
  status: mysqlEnum("status", ["open", "in_progress", "fixed", "verified", "closed"]).default("open").notNull(),
  createdBy: int("createdBy").notNull(),
  assignedTo: int("assignedTo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bug = typeof bugs.$inferSelect;
export type InsertBug = typeof bugs.$inferInsert;

export const bugReplies = mysqlTable("bugReplies", {
  id: int("id").autoincrement().primaryKey(),
  bugId: int("bugId").notNull(),
  replyType: mysqlEnum("replyType", ["hotfix", "refactor_proposal"]).notNull(),
  content: longtext("content").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BugReply = typeof bugReplies.$inferSelect;
export type InsertBugReply = typeof bugReplies.$inferInsert;

// ============= Disputes & Arbitration =============

export const disputes = mysqlTable("disputes", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  relatedTask: varchar("relatedTask", { length: 50 }),
  initiatedBy: int("initiatedBy").notNull(),
  initiatedRole: mysqlEnum("initiatedRole", ["Dev", "PM"]).notNull(),
  issue: longtext("issue").notNull(),
  status: mysqlEnum("status", ["open", "in_discussion", "architect_review", "owner_decision", "resolved"]).default("open").notNull(),
  roundCount: int("roundCount").default(0).notNull(),
  architectDecision: longtext("architectDecision"),
  ownerDecision: longtext("ownerDecision"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = typeof disputes.$inferInsert;

export const disputeRounds = mysqlTable("disputeRounds", {
  id: int("id").autoincrement().primaryKey(),
  disputeId: int("disputeId").notNull(),
  roundNumber: int("roundNumber").notNull(),
  fromRole: mysqlEnum("fromRole", ["Dev", "PM"]).notNull(),
  content: longtext("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DisputeRound = typeof disputeRounds.$inferSelect;
export type InsertDisputeRound = typeof disputeRounds.$inferInsert;

// ============= Approval Nodes =============

export const approvalNodes = mysqlTable("approvalNodes", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  nodeType: mysqlEnum("nodeType", ["requirement", "architecture", "decomposition", "development", "testing"]).notNull(),
  stageId: int("stageId").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  approvedBy: int("approvedBy"),
  approvalComment: text("approvalComment"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApprovalNode = typeof approvalNodes.$inferSelect;
export type InsertApprovalNode = typeof approvalNodes.$inferInsert;

// ============= Notifications =============

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  userId: int("userId").notNull(),
  notificationType: mysqlEnum("notificationType", ["stage_completed", "approval_required", "bug_assigned", "dispute_escalated"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  relatedEntityId: int("relatedEntityId"),
  status: mysqlEnum("status", ["unread", "read"]).default("unread").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;