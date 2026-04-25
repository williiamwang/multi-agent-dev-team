import { ENV } from "../_core/env";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using SMTP
 * For production, integrate with nodemailer or SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // For now, just log the email
  // In production, implement actual email sending with nodemailer

  console.log("[Email] Would send email:", {
    to: options.to,
    subject: options.subject,
    from: ENV.smtpUser,
  });

  // TODO: Implement actual email sending
  // const transporter = nodemailer.createTransport({
  //   host: ENV.smtpHost,
  //   port: ENV.smtpPort,
  //   secure: ENV.smtpPort === 465,
  //   auth: {
  //     user: ENV.smtpUser,
  //     pass: ENV.smtpPass,
  //   },
  // });
  //
  // await transporter.sendMail({
  //   from: ENV.smtpUser,
  //   to: options.to,
  //   subject: options.subject,
  //   html: options.html,
  //   text: options.text,
  // });

  return true;
}

/**
 * Send stage completion notification
 */
export async function sendStageCompletionEmail(
  userEmail: string,
  stageName: string,
  workflowName: string
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    subject: `[${workflowName}] 阶段完成: ${stageName}`,
    html: `
      <h2>${workflowName}</h2>
      <p>阶段 <strong>${stageName}</strong> 已完成。</p>
      <p>请访问系统查看详细信息。</p>
    `,
    text: `${workflowName}\n阶段 ${stageName} 已完成。`,
  });
}

/**
 * Send approval needed notification
 */
export async function sendApprovalNeededEmail(
  userEmail: string,
  stageName: string,
  workflowName: string
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    subject: `[${workflowName}] 需要您的审批: ${stageName}`,
    html: `
      <h2>${workflowName}</h2>
      <p>阶段 <strong>${stageName}</strong> 需要您的审批。</p>
      <p>请访问系统进行审批。</p>
    `,
    text: `${workflowName}\n阶段 ${stageName} 需要您的审批。`,
  });
}

/**
 * Send bug assigned notification
 */
export async function sendBugAssignedEmail(
  userEmail: string,
  bugId: number,
  bugTitle: string,
  severity: string
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    subject: `[Bug #${bugId}] 新缺陷分配给您: ${bugTitle}`,
    html: `
      <h2>新缺陷分配</h2>
      <p>缺陷 <strong>#${bugId}</strong> 已分配给您。</p>
      <p><strong>标题:</strong> ${bugTitle}</p>
      <p><strong>严重程度:</strong> ${severity}</p>
      <p>请访问系统查看详细信息。</p>
    `,
    text: `新缺陷分配\n缺陷 #${bugId}: ${bugTitle}\n严重程度: ${severity}`,
  });
}

/**
 * Send dispute escalation notification
 */
export async function sendDisputeEscalationEmail(
  userEmail: string,
  disputeId: number,
  description: string
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    subject: `[争议 #${disputeId}] 需要您的仲裁`,
    html: `
      <h2>争议升级</h2>
      <p>争议 <strong>#${disputeId}</strong> 已升级至您进行仲裁。</p>
      <p><strong>描述:</strong> ${description}</p>
      <p>请访问系统进行仲裁。</p>
    `,
    text: `争议升级\n争议 #${disputeId}\n描述: ${description}`,
  });
}
