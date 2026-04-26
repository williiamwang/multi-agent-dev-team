/**
 * AOP Layer - Aspect-Oriented Programming Interceptors
 *
 * Enforces cross-cutting concerns through aspect interception.
 */

export type AspectType = 'BEFORE' | 'AROUND' | 'AFTER';

export interface AspectDefinition {
  name: string;
  type: AspectType;
  applyOn: string[]; // Agent names or state transitions
  handler: AspectHandler;
}

export interface AspectContext {
  agentName: string;
  state: string;
  input: string;
  output?: string;
  metadata: Record<string, any>;
}

export type AspectHandler = (
  context: AspectContext,
  next?: () => Promise<void>
) => Promise<AspectResult>;

export interface AspectResult {
  allowed: boolean;
  message?: string;
  output?: string;
  rollback?: boolean;
}

/**
 * AOP Weaver - Manages and executes aspects
 */
export class AOPWeaver {
  private aspects: Map<string, AspectDefinition> = new Map();

  /**
   * Register an aspect
   */
  registerAspect(aspect: AspectDefinition): void {
    this.aspects.set(aspect.name, aspect);
  }

  /**
   * Execute aspects for a given context
   */
  async executeAspects(
    type: AspectType,
    context: AspectContext,
    next?: () => Promise<void>
  ): Promise<AspectResult> {
    const applicableAspects = Array.from(this.aspects.values()).filter(
      a => a.type === type && a.applyOn.includes(context.agentName)
    );

    // Sort by order (optional, based on registration)
    for (const aspect of applicableAspects) {
      const result = await aspect.handler(context, next);

      if (!result.allowed) {
        if (result.rollback) {
          await this.triggerRollback(context);
        }
        return result;
      }

      // Update context if aspect modified output
      if (result.output && context.output === undefined) {
        context.output = result.output;
      }
    }

    return { allowed: true };
  }

  /**
   * Trigger rollback on failure
   */
  private async triggerRollback(context: AspectContext): Promise<void> {
    // In real implementation, this would:
    // 1. Revert database transactions
    // 2. Rollback git changes
    // 3. Clean up temporary files
    console.error(`Rollback triggered for agent: ${context.agentName}`);
  }
}

/**
 * Dependency Guard - BEFORE Advice
 *
 * Scans AST to identify coupling between existing functionality and new code.
 */
export class DependencyGuard {
  constructor(private weaver: AOPWeaver) {
    this.weaver.registerAspect({
      name: 'dependency-guard',
      type: 'BEFORE',
      applyOn: ['Dev', 'Arch'],
      handler: this.guardHandler.bind(this),
    });
  }

  private async guardHandler(
    context: AspectContext,
    next?: () => Promise<void>
  ): Promise<AspectResult> {
    console.log(`[DependencyGuard] Scanning for coupling...`);

    // Simulated AST scanning
    const couplingDetected = await this.scanForCoupling(context.input);

    if (couplingDetected) {
      return {
        allowed: false,
        message:
          'Strong coupling detected. Must refactor to Dependency Injection.',
      };
    }

    return { allowed: true };
  }

  private async scanForCoupling(code: string): Promise<boolean> {
    // In real implementation, use tree-sitter for AST analysis
    // This checks for:
    // - Direct imports from B modules
    // - Direct function calls to B modules
    // - Shared state mutation

    return false; // Placeholder
  }
}

/**
 * Anti-Regression - AROUND Advice
 *
 * Continuously runs regression tests. Rollback on assertion failure.
 */
export class AntiRegression {
  private testResults: Map<string, boolean> = new Map();

  constructor(private weaver: AOPWeaver) {
    this.weaver.registerAspect({
      name: 'anti-regression',
      type: 'AROUND',
      applyOn: ['Dev', 'QA'],
      handler: this.regressionHandler.bind(this),
    });
  }

  private async regressionHandler(
    context: AspectContext,
    next?: () => Promise<void>
  ): Promise<AspectResult> {
    console.log(`[AntiRegression] Running B module tests...`);

    // Run regression tests before execution
    const beforeTests = await this.runRegressionTests(context);
    this.testResults.set('before', beforeTests);

    // Execute the actual operation
    if (next) {
      await next();
    }

    // Run regression tests after execution
    const afterTests = await this.runRegressionTests(context);
    this.testResults.set('after', afterTests);

    // Check for test failures
    if (beforeTests !== afterTests || !afterTests) {
      return {
        allowed: false,
        message: 'Regression test failed. Transaction rollback triggered.',
        rollback: true,
      };
    }

    return { allowed: true };
  }

  private async runRegressionTests(
    context: AspectContext
  ): Promise<boolean> {
    // In real implementation, run B module feature tests
    // This ensures existing functionality is not broken
    return true; // Placeholder
  }
}

/**
 * No-Silent-Failure - Throughout
 *
 * Enforces structured logging. Prohibits empty catch blocks.
 */
export class NoSilentFailure {
  constructor(private weaver: AOPWeaver) {
    this.weaver.registerAspect({
      name: 'no-silent-failure',
      type: 'AFTER',
      applyOn: ['PM', 'Arch', 'DDE', 'QA', 'Dev', 'Ops'],
      handler: this.loggingHandler.bind(this),
    });
  }

  private async loggingHandler(
    context: AspectContext,
    next?: () => Promise<void>
  ): Promise<AspectResult> {
    console.log(`[NoSilentFailure] Checking for structured logging...`);

    if (context.output) {
      const hasLogging = this.checkForStructuredLogging(context.output);

      if (!hasLogging) {
        return {
          allowed: false,
          message:
            'Code lacks structured logging. Add proper error handling and logging.',
        };
      }
    }

    return { allowed: true };
  }

  private checkForStructuredLogging(code: string): boolean {
    // Check for:
    // - Proper try/catch blocks
    // - Error logging with context
    // - No empty catch blocks

    const hasEmptyCatch = /catch\s*\([^)]*\)\s*\{\s*\}/.test(code);
    const hasLogging = /logger\.(log|info|warn|error|debug)/.test(code);

    return !hasEmptyCatch && hasLogging;
  }
}

/**
 * Create pre-configured AOP Weaver with all aspects
 */
export function createAOPWeaver(): AOPWeaver {
  const weaver = new AOPWeaver();

  new DependencyGuard(weaver);
  new AntiRegression(weaver);
  new NoSilentFailure(weaver);

  return weaver;
}
