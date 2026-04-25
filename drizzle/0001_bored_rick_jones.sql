CREATE TABLE `agentMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentTaskId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` longtext NOT NULL,
	`attachments` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agentTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stageId` int NOT NULL,
	`agentId` int NOT NULL,
	`manusTaskId` varchar(255) NOT NULL,
	`prompt` longtext NOT NULL,
	`status` enum('created','running','completed','failed') NOT NULL DEFAULT 'created',
	`result` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agentTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aiAgents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role` enum('CPO','Architect','PM','Dev','QA','OSS') NOT NULL,
	`persona` longtext NOT NULL,
	`manusProjectId` varchar(255) NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiAgents_id` PRIMARY KEY(`id`),
	CONSTRAINT `aiAgents_role_unique` UNIQUE(`role`)
);
--> statement-breakpoint
CREATE TABLE `approvalNodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`nodeType` enum('requirement','architecture','decomposition','development','testing') NOT NULL,
	`stageId` int NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvalComment` text,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approvalNodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `atomicTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`taskId` varchar(50) NOT NULL,
	`taskName` varchar(255) NOT NULL,
	`category` enum('frontend','backend','infrastructure') NOT NULL,
	`prerequisites` text,
	`inputs` longtext,
	`outputs` longtext,
	`acceptanceCriteria` longtext,
	`selfTestCases` longtext,
	`dependencies` text,
	`status` enum('pending','in_progress','completed','blocked') NOT NULL DEFAULT 'pending',
	`assignedTo` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `atomicTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bugReplies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bugId` int NOT NULL,
	`replyType` enum('hotfix','refactor_proposal') NOT NULL,
	`content` longtext NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bugReplies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bugs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`bugId` varchar(50) NOT NULL,
	`relatedTask` varchar(50),
	`severity` enum('HIGH','MEDIUM','LOW') NOT NULL,
	`reproducingSteps` longtext NOT NULL,
	`expected` text NOT NULL,
	`actual` text NOT NULL,
	`traceback` longtext,
	`status` enum('open','in_progress','fixed','verified','closed') NOT NULL DEFAULT 'open',
	`createdBy` int NOT NULL,
	`assignedTo` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bugs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disputeRounds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`disputeId` int NOT NULL,
	`roundNumber` int NOT NULL,
	`fromRole` enum('Dev','PM') NOT NULL,
	`content` longtext NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `disputeRounds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disputes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`relatedTask` varchar(50),
	`initiatedBy` int NOT NULL,
	`initiatedRole` enum('Dev','PM') NOT NULL,
	`issue` longtext NOT NULL,
	`status` enum('open','in_discussion','architect_review','owner_decision','resolved') NOT NULL DEFAULT 'open',
	`roundCount` int NOT NULL DEFAULT 0,
	`architectDecision` longtext,
	`ownerDecision` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `disputes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`stageId` int NOT NULL,
	`docType` enum('PRD','Architecture','APIContract','TaskList','SelfTestReport','TestReport','ResearchReport') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` longtext NOT NULL,
	`fileUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`userId` int NOT NULL,
	`notificationType` enum('stage_completed','approval_required','bug_assigned','dispute_escalated') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text,
	`relatedEntityId` int,
	`status` enum('unread','read') NOT NULL DEFAULT 'unread',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`ownerId` int NOT NULL,
	`status` enum('draft','active','completed','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`stageType` enum('requirement','architecture','decomposition','development','testing','bugfix','release') NOT NULL,
	`role` enum('CPO','Architect','PM','Dev','QA','OSS') NOT NULL,
	`status` enum('pending','in_progress','completed','failed') NOT NULL DEFAULT 'pending',
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`currentStage` enum('requirement','architecture','decomposition','development','testing','bugfix','release') NOT NULL DEFAULT 'requirement',
	`status` enum('pending','in_progress','paused','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflows_id` PRIMARY KEY(`id`)
);
