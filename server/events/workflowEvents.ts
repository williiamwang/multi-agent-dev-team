import { EventEmitter } from 'events';
import { sendNotificationToUser, broadcastNotification } from '../notifications/websocket';
import { sendEmail } from '../notifications/email';
import { getDb } from '../db';
import { eq } from 'drizzle-orm';
import { workflows, users, projects } from '../../drizzle/schema';

/**
 * 工作流事件发射器
 * 用于在工作流的各个关键节点触发事件，进而发送通知
 */
export const workflowEvents = new EventEmitter();

/**
 * 阶段完成事件
 */
export async function emitStageCompleted(workflowId: number, stageName: string, stageId: string) {
  workflowEvents.emit('stage:completed', { workflowId, stageName, stageId });
  
  // 获取工作流信息
  const db = await getDb();
  if (!db) return;
  
  const workflow = await db.select().from(workflows).where(eq(workflows.id, workflowId)).limit(1);
  if (!workflow.length) return;
  
  const workflowData = workflow[0];
  
  // 获取项目信息
  const project = await db.select().from(projects).where(eq(projects.id, workflowData.projectId)).limit(1);
  if (!project.length) return;
  
  const projectData = project[0];
  
  // 获取项目所有者
  const owner = await db.select().from(users).where(eq(users.id, projectData.ownerId)).limit(1);
  if (!owner.length) return;
  
  const ownerData = owner[0];
  
  // 发送 WebSocket 通知
  sendNotificationToUser(projectData.ownerId, {
    type: 'notification',
    title: `阶段 ${stageName} 已完成`,
    content: `工作流的 ${stageName} 阶段已完成`,
    data: { workflowId, stageName, stageId },
    timestamp: Date.now(),
  });
  
  // 发送邮件通知
  if (ownerData.email) {
    await sendEmail({
      to: ownerData.email,
      subject: `阶段完成通知 - ${projectData.name}`,
      html: `<p>阶段 ${stageName} 已完成</p>`,
    });
  }
}

/**
 * 老板确认节点事件
 */
export async function emitApprovalNodePending(workflowId: number, stageId: string) {
  workflowEvents.emit('approval:pending', { workflowId, stageId });
  
  const db = await getDb();
  if (!db) return;
  
  const workflow = await db.select().from(workflows).where(eq(workflows.id, workflowId)).limit(1);
  if (!workflow.length) return;
  
  const workflowData = workflow[0];
  
  const project = await db.select().from(projects).where(eq(projects.id, workflowData.projectId)).limit(1);
  if (!project.length) return;
  
  const projectData = project[0];
  const owner = await db.select().from(users).where(eq(users.id, projectData.ownerId)).limit(1);
  if (!owner.length) return;
  
  const ownerData = owner[0];
  
  // 发送 WebSocket 通知
  sendNotificationToUser(projectData.ownerId, {
    type: 'notification',
    title: `需要确认 - ${stageId} 阶段`,
    content: `工作流的 ${stageId} 阶段需要您的确认`,
    data: { workflowId, stageId },
    timestamp: Date.now(),
  });
  
  // 发送邮件通知
  if (ownerData.email) {
    await sendEmail({
      to: ownerData.email,
      subject: `需要确认 - ${projectData.name}`,
      html: `<p>阶段 ${stageId} 需要您的确认</p>`,
    });
  }
}

/**
 * Bug 分配事件
 */
export async function emitBugAssigned(bugId: number, developerId: number, bugTitle: string) {
  workflowEvents.emit('bug:assigned', { bugId, developerId, bugTitle });
  
  const db = await getDb();
  if (!db) return;
  
  const developer = await db.select().from(users).where(eq(users.id, developerId)).limit(1);
  if (!developer.length) return;
  
  const developerData = developer[0];
  
  // 发送 WebSocket 通知
  sendNotificationToUser(developerId, {
    type: 'notification',
    title: `新 Bug 分配给您`,
    content: `Bug: ${bugTitle}`,
    data: { bugId, bugTitle },
    timestamp: Date.now(),
  });
  
  // 发送邮件通知
  if (developerData.email) {
    await sendEmail({
      to: developerData.email,
      subject: `新 Bug 分配 - ${bugTitle}`,
      html: `<p>Bug: ${bugTitle}</p>`,
    });
  }
}

/**
 * 争议升级事件
 */
export async function emitDisputeEscalated(disputeId: number, architectId: number, pmId: number, devId: number) {
  workflowEvents.emit('dispute:escalated', { disputeId, architectId, pmId, devId });
  
  const db = await getDb();
  if (!db) return;
  
  // 通知 Architect
  sendNotificationToUser(architectId, {
    type: 'notification',
    title: `争议需要仲裁`,
    content: `争议 #${disputeId} 已升级到 Architect 仲裁阶段`,
    data: { disputeId },
    timestamp: Date.now(),
  });
  
  // 通知 PM 和 Dev
  sendNotificationToUser(pmId, {
    type: 'notification',
    title: `争议已升级`,
    content: `您的争议 #${disputeId} 已升级到 Architect 仲裁`,
    data: { disputeId },
    timestamp: Date.now(),
  });
  
  sendNotificationToUser(devId, {
    type: 'notification',
    title: `争议已升级`,
    content: `您的争议 #${disputeId} 已升级到 Architect 仲裁`,
    data: { disputeId },
    timestamp: Date.now(),
  });
}

/**
 * 工作流完成事件
 */
export async function emitWorkflowCompleted(workflowId: number) {
  workflowEvents.emit('workflow:completed', { workflowId });
  
  const db = await getDb();
  if (!db) return;
  
  const workflow = await db.select().from(workflows).where(eq(workflows.id, workflowId)).limit(1);
  if (!workflow.length) return;
  
  const workflowData = workflow[0];
  
  const project = await db.select().from(projects).where(eq(projects.id, workflowData.projectId)).limit(1);
  if (!project.length) return;
  
  const projectData = project[0];
  const owner = await db.select().from(users).where(eq(users.id, projectData.ownerId)).limit(1);
  if (!owner.length) return;
  
  const ownerData = owner[0];
  
  // 广播完成通知
  broadcastNotification({
    type: 'notification',
    title: `工作流完成`,
    content: `工作流已完成`,
    data: { workflowId },
    timestamp: Date.now(),
  });
  
  // 发送邮件通知
  if (ownerData.email) {
    await sendEmail({
      to: ownerData.email,
      subject: `工作流完成 - ${projectData.name}`,
      html: `<p>工作流已完成</p>`,
    });
  }
}

/**
 * 监听事件并执行相应的操作
 */
// Event listeners
workflowEvents.on('stage:completed', async (data) => {
  console.log('[WorkflowEvents] Stage completed:', data);
});

workflowEvents.on('approval:pending', async (data) => {
  console.log('[WorkflowEvents] Approval pending:', data);
});

workflowEvents.on('bug:assigned', async (data) => {
  console.log('[WorkflowEvents] Bug assigned:', data);
});

workflowEvents.on('dispute:escalated', async (data) => {
  console.log('[WorkflowEvents] Dispute escalated:', data);
});

workflowEvents.on('workflow:completed', async (data) => {
  console.log('[WorkflowEvents] Workflow completed:', data);
});
