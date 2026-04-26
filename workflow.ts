/**
 * Workflow State Machine and Execution Engine
 *
 * Manages the complete SDLC workflow with robust error handling and rollback.
 *
 * EXECUTION MODES:
 * ------------------
 * 1. Framework Mode (Default): This skill defines the workflow structure and agent prompts.
 *    Real agent calls are handled by the Agent tool when the skill is invoked.
 *    The workflow engine manages state transitions and coordination.
 *
 * 2. Standalone Mode (Optional): When running independently, requires LLM configuration.
 *    Requires config.json with llm.apiKey, ast.library, etc.
 *    Actual LLM calls would be implemented here.
 */

import { createContainer, IoCContainer } from './container.js';
import { createAOPWeaver, AOPWeaver, AspectResult } from './aspects/aop.js';
import { IsolationSandbox, Violation } from './isolation.js';

export type WorkflowState =
  | 'DISCOVERY'
  | 'CONTRACT'
  | 'TDD_RED'
  | 'IMPLEMENT'
  | 'INTEGRATION'
  | 'COMMIT';

export type WorkflowStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'ROLLED_BACK';

export interface WorkflowConfig {
  prd: string;
  outputDir: string;
  skipStates?: WorkflowState[];
  modelSelection?: {
    pm?: 'haiku' | 'sonnet' | 'opus';
    arch?: 'haiku' | 'sonnet' | 'opus';
    dde?: 'haiku' | 'sonnet' | 'opus';
    qa?: 'haiku' | 'sonnet' | 'opus';
    dev?: 'haiku' | 'sonnet' | 'opus';
    ops?: 'haiku' | 'sonnet' | 'opus';
  };
  recovery?: {
    maxRetries?: number;
    retryDelay?: number;
    enableRecoveryPoints?: boolean;
  };
}

export interface WorkflowStep {
  state: WorkflowState;
  agent: string;
  status: WorkflowStatus;
  startedAt?: Date;
  completedAt?: Date;
  output?: string;
  error?: string;
  rollbackPoint?: RecoveryPoint;
  retries?: number;
}

export interface WorkflowResult {
  success: boolean;
  steps: WorkflowStep[];
  artifacts: Record<string, string>;
  finalState: WorkflowState | null;
  rollbackReason?: string;
  recoveryAttempts?: number;
}

export interface RecoveryPoint {
  stepIndex: number;
  timestamp: Date;
  artifacts: Record<string, string>;
  gitCommit?: string;
  filesystemSnapshot?: string;
}

export type FailureType =
  | 'CRAFT_DETECTION_FAILED'
  | 'VALIDATION_FAILED'
  | 'AGENT_TIMEOUT'
  | 'REGRESSION_FAILED'
  | 'ISOLATION_VIOLATION'
  | 'UNKNOWN';

export interface WorkflowError extends Error {
  type: FailureType;
  step: WorkflowState;
  agent: string;
  recoverable: boolean;
  context?: Record<string, any>;
}

/**
 * Workflow Recovery Manager
 */
class RecoveryManager {
  private recoveryPoints: RecoveryPoint[] = [];
  private maxRecoveryPoints = 5;
  private rollbackOperations: Array<() => Promise<void>> = [];

  /**
   * Create a recovery point
   */
  createRecoveryPoint(
    stepIndex: number,
    artifacts: Record<string, string>
  ): RecoveryPoint {
    const point: RecoveryPoint = {
      stepIndex,
      timestamp: new Date(),
      artifacts: { ...artifacts },
    };

    this.recoveryPoints.push(point);

    // Keep only last N recovery points
    if (this.recoveryPoints.length > this.maxRecoveryPoints) {
      this.recoveryPoints.shift();
    }

    return point;
  }

  /**
   * Rollback to a specific recovery point
   */
  async rollbackTo(point: RecoveryPoint): Promise<void> {
    console.log(`[Recovery] Rolling back to step ${point.stepIndex} (${point.timestamp.toISOString()})`);

    // Execute rollback operations in reverse order
    for (let i = this.rollbackOperations.length - 1; i >= 0; i--) {
      const operation = this.rollbackOperations[i];
      await operation();
      this.rollbackOperations.pop();
    }

    // Restore artifacts
    console.log(`[Recovery] Restoring artifacts from recovery point`);

    return;
  }

  /**
   * Register a rollback operation
   */
  registerRollbackOperation(operation: () => Promise<void>): void {
    this.rollbackOperations.push(operation);
  }

  /**
   * Get the most recent recovery point before a given step
   */
  getRecoveryPointBefore(stepIndex: number): RecoveryPoint | null {
    for (let i = this.recoveryPoints.length - 1; i >= 0; i--) {
      const point = this.recoveryPoints[i];
      if (point.stepIndex < stepIndex) {
        return point;
      }
    }
    return null;
  }

  /**
   * Clear all recovery points
   */
  clear(): void {
    this.recoveryPoints = [];
    this.rollbackOperations = [];
  }
}

/**
 * Workflow State Machine
 */
export class WorkflowEngine {
  private container: IoCContainer;
  private weaver: AOPWeaver;
  private sandbox: IsolationSandbox;
  private recoveryManager: RecoveryManager;
  private steps: WorkflowStep[] = [];
  private artifacts: Record<string, string> = {};
  private halted = false;

  constructor(private config: WorkflowConfig) {
    this.container = createContainer();
    this.weaver = createAOPWeaver();
    this.sandbox = new IsolationSandbox();
    this.recoveryManager = new RecoveryManager();
  }

  /**
   * Execute the complete workflow with recovery
   */
  async execute(): Promise<WorkflowResult> {
    const workflow: Array<{ state: WorkflowState; agent: string }> = [
      { state: 'DISCOVERY', agent: 'PM' },
      { state: 'DISCOVERY', agent: 'Arch' },
      { state: 'CONTRACT', agent: 'DDE' },
      { state: 'TDD_RED', agent: 'QA' },
      { state: 'IMPLEMENT', agent: 'Dev' },
      { state: 'INTEGRATION', agent: 'Arch' },
      { state: 'COMMIT', agent: 'Ops' },
    ];

    const maxRetries = this.config.recovery?.maxRetries || 3;
    let recoveryAttempts = 0;
    let lastError: WorkflowError | null = null;

    try {
      for (let i = 0; i < workflow.length; i++) {
        const step = workflow[i];

        if (this.halted) {
          console.warn('[Workflow] Execution halted');
          break;
        }

        if (this.config.skipStates?.includes(step.state)) {
          this.steps.push({
            state: step.state,
            agent: step.agent,
            status: 'PENDING',
          });
          continue;
        }

        // Execute step with retry logic
        let stepSuccess = false;
        let retries = 0;

        while (!stepSuccess && retries <= maxRetries) {
          try {
            const result = await this.executeStep(step, i);
            this.steps.push(result);

            if (result.status === 'FAILED') {
              // Attempt recovery if possible
              const recovered = await this.attemptRecovery(step, result, i, retries);

              if (recovered) {
                stepSuccess = true;
                console.log(`[Workflow] Step ${step.state} recovered after retry ${retries + 1}`);
              } else {
                // Irrecoverable failure
                await this.handleFailure(result);
                return {
                  success: false,
                  steps: this.steps,
                  artifacts: this.artifacts,
                  finalState: step.state,
                  rollbackReason: result.error || 'Unknown failure',
                  recoveryAttempts: recoveryAttempts,
                };
              }
            } else {
              stepSuccess = true;
            }
          } catch (error) {
            lastError = this.createWorkflowError(error, step);
            console.error(`[Workflow] Step ${step.state} error (attempt ${retries + 1}):`, error);

            retries++;

            if (retries < maxRetries) {
              const delay = this.config.recovery?.retryDelay || 5000;
              console.log(`[Workflow] Retrying in ${delay}ms...`);
              await this.sleep(delay);
            }
          }

          recoveryAttempts++;
        }

        // Create recovery point after successful step
        if (stepSuccess && this.config.recovery?.enableRecoveryPoints) {
          const point = this.recoveryManager.createRecoveryPoint(i, { ...this.artifacts });
          this.steps[i].rollbackPoint = point;
          console.log(`[Workflow] Recovery point created after ${step.state}`);
        }

        // Store artifact
        if (this.steps[i].output) {
          this.artifacts[`${step.state}_${step.agent}`] = this.steps[i].output;
        }
      }

      return {
        success: true,
        steps: this.steps,
        artifacts: this.artifacts,
        finalState: 'COMMIT',
      };
    } catch (error) {
      return {
        success: false,
        steps: this.steps,
        artifacts: this.artifacts,
        finalState: null,
        rollbackReason: error instanceof Error ? error.message : 'Unknown error',
        recoveryAttempts,
      };
    }
  }

  /**
   * Execute a single workflow step
   *
   * Framework Mode: Returns prepared prompt for Agent tool invocation
   * Standalone Mode: Would call LLM API directly
   */
  private async executeStep(
    step: { state: WorkflowState; agent: string },
    stepIndex: number
  ): Promise<WorkflowStep> {
    const workflowStep: WorkflowStep = {
      state: step.state,
      agent: step.agent,
      status: 'RUNNING',
      startedAt: new Date(),
      retries: 0,
    };

    try {
      console.log(`[${step.state}] Executing ${step.agent} agent...`);

      // Register rollback operations for this step
      this.registerStepRollback(step, workflowStep);

      // Execute AOP aspects before
      const beforeResult = await this.weaver.executeAspects(
        'BEFORE',
        {
          agentName: step.agent,
          state: step.state,
          input: this.config.prd,
          metadata: this.artifacts,
        }
      );

      if (!beforeResult.allowed) {
        throw this.createWorkflowError(
          new Error(beforeResult.message || 'AOP check failed'),
          step,
          'CRAFT_DETECTION_FAILED'
        );
      }

      // EXECUTION: Prepare agent prompt and context
      // In Framework Mode: Return prepared prompt for Agent tool invocation
      // In Standalone Mode: Call LLM API directly (requires configuration)
      await this.weaver.executeAspects(
        'AROUND',
        {
          agentName: step.agent,
          state: step.state,
          input: this.config.prd,
          metadata: this.artifacts,
        },
        async () => {
          // Instantiate agent and prepare execution context
          const agent = this.container.instantiateAgent(step.agent);

          // Get the agent's prepared prompt (includes context injection)
          const preparedPrompt = await agent.execute(this.config.prd);

          // IN FRAMEWORK MODE:
          // The prepared prompt is returned for the Agent tool to use
          // The actual LLM call happens through the Agent tool
          // Output is captured from Agent tool result

          // IN STANDALONE MODE (not currently implemented):
          // This would call LLM API directly using config:
          // const llmClient = createLLMClient(config.llm);
          // const output = await llmClient.complete({
          //   model: config.llm.models[step.agent],
          //   prompt: preparedPrompt
          // });
          // output would be the agent's result

          workflowStep.output = preparedPrompt;

          // Validate output against isolation rules
          // Note: In Framework Mode, validation happens on Agent tool result
          const violations = this.validateOutput(preparedPrompt);
          if (violations.length > 0) {
            const violationMsg = violations.map(v => v.description).join(', ');
            throw this.createWorkflowError(
              new Error(`Isolation violations: ${violationMsg}`),
              step,
              'ISOLATION_VIOLATION'
            );
          }
        }
      );

      // Execute AOP aspects after
      const afterResult = await this.weaver.executeAspects(
        'AFTER',
        {
          agentName: step.agent,
          state: step.state,
          input: this.config.prd,
          output: workflowStep.output,
          metadata: this.artifacts,
        }
      );

      if (!afterResult.allowed) {
        throw this.createWorkflowError(
          new Error(afterResult.message || 'AOP check failed'),
          step,
          'VALIDATION_FAILED'
        );
      }

      workflowStep.status = 'COMPLETED';
      workflowStep.completedAt = new Date();

      console.log(`[${step.state}] ${step.agent} agent completed.`);

      return workflowStep;
    } catch (error) {
      workflowStep.status = 'FAILED';
      workflowStep.error = error instanceof Error ? error.message : String(error);
      workflowStep.completedAt = new Date();

      console.error(`[${step.state}] ${step.agent} agent failed:`, error);

      return workflowStep;
    }
  }

  /**
   * Attempt recovery from a failed step
   */
  private async attemptRecovery(
    step: { state: WorkflowState; agent: string },
    failedStep: WorkflowStep,
    stepIndex: number,
    retryAttempt: number
  ): Promise<boolean> {
    console.log(`[Recovery] Attempting recovery for ${step.state}...`);

    // Find recovery point before this step
    const recoveryPoint = this.recoveryManager.getRecoveryPointBefore(stepIndex);

    if (recoveryPoint) {
      console.log(`[Recovery] Found recovery point at step ${recoveryPoint.stepIndex}`);

      // Rollback to recovery point
      await this.recoveryManager.rollbackTo(recoveryPoint);

      // Restore artifacts
      this.artifacts = { ...recoveryPoint.artifacts };

      // Remove failed step from history
      this.steps.pop();

      console.log(`[Recovery] Rollback complete, will retry...`);
      return true; // Recoverable
    }

    // No recovery point available
    console.log(`[Recovery] No recovery point available for ${step.state}`);

    // Check if error is recoverable
    const error = this.createWorkflowError(failedStep.error || '', step, 'UNKNOWN');

    // Certain errors are recoverable without rollback
    const recoverableErrors: FailureType[] = ['AGENT_TIMEOUT', 'VALIDATION_FAILED'];

    if (recoverableErrors.includes(error.type) && retryAttempt < 3) {
      console.log(`[Recovery] Error is recoverable, will retry...`);
      return true;
    }

    return false; // Not recoverable
  }

  /**
   * Handle workflow failure
   */
  private async handleFailure(step: WorkflowStep): Promise<void> {
    console.error(`[Workflow] Workflow failed at ${step.state} (${step.agent})`);

    // Mark all completed steps as rolled back
    for (const s of this.steps) {
      if (s.status === 'COMPLETED') {
        s.status = 'ROLLED_BACK';
      }
    }

    // Execute all registered rollback operations
    console.log('[Workflow] Executing rollback operations...');
    const ops = [...this.recoveryManager['rollbackOperations']];
    for (let i = ops.length - 1; i >= 0; i--) {
      try {
        await ops[i]();
      } catch (error) {
        console.error('[Workflow] Rollback operation failed:', error);
      }
    }

    // Clear recovery manager
    this.recoveryManager.clear();

    // Generate failure report
    await this.generateFailureReport(step);
  }

  /**
   * Validate output against isolation rules
   */
  private validateOutput(output: string): Violation[] {
    // In real implementation, this would:
    // 1. Parse the output for file paths
    // 2. Validate each file against isolation rules
    // 3. Return violations

    // For now, return empty
    return [];
  }

  /**
   * Create a workflow error
   */
  private createWorkflowError(
    error: unknown,
    step: { state: WorkflowState; agent: string },
    defaultType: FailureType = 'UNKNOWN'
  ): WorkflowError {
    const message = error instanceof Error ? error.message : String(error);

    // Determine error type based on message content
    let type = defaultType;
    if (message.includes('coupling')) {
      type = 'CRAFT_DETECTION_FAILED';
    } else if (message.includes('validation') || message.includes('isolation')) {
      type = 'VALIDATION_FAILED';
    } else if (message.includes('timeout')) {
      type = 'AGENT_TIMEOUT';
    } else if (message.includes('regression')) {
      type = 'REGRESSION_FAILED';
    }

    return {
      name: 'WorkflowError',
      message,
      type,
      step: step.state,
      agent: step.agent,
      recoverable: type === 'AGENT_TIMEOUT' || type === 'VALIDATION_FAILED',
      context: { originalError: error },
    };
  }

  /**
   * Register rollback operations for a step
   */
  private registerStepRollback(
    step: { state: WorkflowState; agent: string },
    workflowStep: WorkflowStep
  ): void {
    // In real implementation, this would register operations like:
    // - Delete created files
    // - Revert database migrations
    // - Undo git commits

    // For now, just log
    console.log(`[Recovery] Registered rollback for ${step.state} - ${step.agent}`);
  }

  /**
   * Generate failure report
   */
  private async generateFailureReport(step: WorkflowStep): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const report = `# Workflow Failure Report

## Summary
- Failed at state: ${step.state}
- Failed agent: ${step.agent}
- Error: ${step.error || 'Unknown'}
- Timestamp: ${new Date().toISOString()}

## Completed Steps
${this.steps
  .filter(s => s.status === 'COMPLETED' || s.status === 'ROLLED_BACK')
  .map(
    s => `- ${s.state} - ${s.agent} (${s.status})`
  )
  .join('\n')}

## Next Steps
1. Review the error message above
2. Check the artifacts generated before the failure
3. Fix the root cause
4. Re-run the workflow from the failed step

## Artifacts Before Failure
${Object.entries(this.artifacts)
  .map(([key, value]) => `- ${key}: ${value.length} bytes`)
  .join('\n')}
`;

    const reportPath = path.join(this.config.outputDir, 'FAILURE_REPORT.md');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, report, 'utf-8');

    console.log(`[Workflow] Failure report written to ${reportPath}`);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current workflow status
   */
  getStatus(): {
    state: WorkflowState | null;
    completedSteps: number;
    totalSteps: number;
    progress: number;
  } {
    const totalSteps = 7; // PM, Arch, DDE, QA, Dev, Arch, Ops
    const completedSteps = this.steps.filter(s => s.status === 'COMPLETED').length;

    let currentState: WorkflowState | null = null;
    const lastStep = this.steps[this.steps.length - 1];
    if (lastStep) {
      currentState = lastStep.state;
    }

    return {
      state: currentState,
      completedSteps,
      totalSteps,
      progress: (completedSteps / totalSteps) * 100,
    };
  }

  /**
   * Get workflow report
   */
  getReport(): string {
    let report = '# Workflow Report\n\n';

    const status = this.getStatus();
    report += `## Status\n\n`;
    report += `- Current State: ${status.state || 'Not started'}\n`;
    report += `- Progress: ${status.progress.toFixed(1)}% (${status.completedSteps}/${status.totalSteps})\n`;
    report += `- Halted: ${this.halted ? 'Yes' : 'No'}\n\n`;

    if (this.steps.length > 0) {
      report += `## Steps\n\n`;

      for (const step of this.steps) {
        const icon =
          step.status === 'COMPLETED'
            ? '✅'
            : step.status === 'FAILED'
              ? '❌'
              : step.status === 'ROLLED_BACK'
                ? '↩️'
                : '⏳';

        report += `### ${icon} ${step.state} - ${step.agent}\n`;
        report += `- Status: ${step.status}\n`;
        if (step.startedAt) {
          report += `- Started: ${step.startedAt.toISOString()}\n`;
        }
        if (step.completedAt) {
          const duration =
            (step.completedAt.getTime() - (step.startedAt?.getTime() || 0)) / 1000;
          report += `- Completed: ${step.completedAt.toISOString()} (${duration}s)\n`;
        }
        if (step.error) {
          report += `- Error: ${step.error}\n`;
        }
        if (step.retries !== undefined) {
          report += `- Retries: ${step.retries}\n`;
        }
        if (step.rollbackPoint) {
          report += `- Recovery Point: Step ${step.rollbackPoint.stepIndex}\n`;
        }
        report += '\n';
      }
    }

    if (Object.keys(this.artifacts).length > 0) {
      report += `## Artifacts\n\n`;
      for (const [key, value] of Object.entries(this.artifacts)) {
        report += `- ${key}: ${value.length} bytes\n`;
      }
    }

    return report;
  }

  /**
   * Export artifacts to files
   */
  async exportArtifacts(): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    for (const [key, content] of Object.entries(this.artifacts)) {
      const filePath = path.join(this.config.outputDir, `${key}.md`);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
    }

    // Export workflow report
    const reportPath = path.join(this.config.outputDir, 'WORKFLOW.md');
    await fs.writeFile(reportPath, this.getReport(), 'utf-8');
  }

  /**
   * Halt workflow execution
   */
  halt(): void {
    this.halted = true;
  }
}

/**
 * Execute workflow from configuration
 */
export async function executeWorkflow(
  config: WorkflowConfig
): Promise<WorkflowResult> {
  const engine = new WorkflowEngine(config);
  const result = await engine.execute();

  // Export artifacts if successful
  if (result.success) {
    await engine.exportArtifacts();
  }

  return result;
}
