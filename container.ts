/**
 * IoC Container - Inversion of Control Container
 *
 * Manages agent instantiation, dependency injection, and lifecycle.
 */

export interface AgentDefinition {
  name: string;
  dependencies: string[];
  promptTemplate: string;
  model?: 'haiku' | 'sonnet' | 'opus';
}

export type WorkflowState =
  | 'DISCOVERY'
  | 'CONTRACT'
  | 'TDD_RED'
  | 'IMPLEMENT'
  | 'INTEGRATION'
  | 'COMMIT';

export interface WorkflowContext {
  state: WorkflowState;
  prd?: string;
  artifacts: Record<string, string>;
  agentOutputs: Record<string, string>;
}

/**
 * IoC Container for managing agent lifecycle
 */
export class IoCContainer {
  private agents: Map<string, AgentDefinition> = new Map();
  private agentInstances: Map<string, any> = new Map();
  private context: WorkflowContext = {
    state: 'DISCOVERY',
    artifacts: {},
    agentOutputs: {},
  };

  /**
   * Register an agent definition
   */
  registerAgent(definition: AgentDefinition): void {
    this.agents.set(definition.name, definition);
  }

  /**
   * Instantiate an agent with dependency injection
   */
  instantiateAgent(agentName: string): any {
    // Check if already instantiated (singleton pattern)
    if (this.agentInstances.has(agentName)) {
      return this.agentInstances.get(agentName);
    }

    const definition = this.agents.get(agentName);
    if (!definition) {
      throw new Error(`Agent not found: ${agentName}`);
    }

    // Validate dependency chain
    this.validateDependencies(definition);

    // Create instance with resolved dependencies
    const instance = {
      name: agentName,
      promptTemplate: definition.promptTemplate,
      model: definition.model || 'sonnet',
      dependencies: definition.dependencies.map(dep => this.instantiateAgent(dep)),
      execute: async (input: string) => this.executeAgent(instance, input),
    };

    this.agentInstances.set(agentName, instance);
    return instance;
  }

  /**
   * Validate that all dependencies exist and are acyclic
   */
  private validateDependencies(definition: AgentDefinition): void {
    const visited = new Set<string>();

    const checkCycle = (name: string, path: string[]): boolean => {
      if (path.includes(name)) {
        throw new Error(
          `Circular dependency detected: ${path.join(' -> ')} -> ${name}`
        );
      }

      if (visited.has(name)) return false;

      visited.add(name);
      const dep = this.agents.get(name);
      if (!dep) {
        throw new Error(`Dependency not found: ${name}`);
      }

      for (const depName of dep.dependencies) {
        checkCycle(depName, [...path, name]);
      }

      return false;
    };

    for (const dep of definition.dependencies) {
      checkCycle(dep, [definition.name]);
    }
  }

  /**
   * Execute an agent with input
   */
  private async executeAgent(instance: any, input: string): Promise<string> {
    // Inject context into prompt
    const context = JSON.stringify({
      state: this.context.state,
      artifacts: this.context.artifacts,
      previousOutputs: this.context.agentOutputs,
    });

    const prompt = instance.promptTemplate
      .replace('{{INPUT}}', input)
      .replace('{{CONTEXT}}', context);

    // In real implementation, this would dispatch to LLM
    // For now, return the prepared prompt
    return prompt;
  }

  /**
   * Transition workflow state
   */
  transitionState(newState: WorkflowState): void {
    const transitions: Record<WorkflowState, WorkflowState[]> = {
      DISCOVERY: ['CONTRACT'],
      CONTRACT: ['TDD_RED'],
      TDD_RED: ['IMPLEMENT'],
      IMPLEMENT: ['INTEGRATION'],
      INTEGRATION: ['COMMIT'],
      COMMIT: [], // Terminal state
    };

    const allowed = transitions[this.context.state];
    if (!allowed.includes(newState)) {
      throw new Error(
        `Invalid state transition: ${this.context.state} -> ${newState}. Allowed: ${allowed.join(', ')}`
      );
    }

    this.context.state = newState;
  }

  /**
   * Store artifact from agent output
   */
  storeArtifact(key: string, value: string): void {
    this.context.artifacts[key] = value;
  }

  /**
   * Get current context
   */
  getContext(): WorkflowContext {
    return { ...this.context };
  }

  /**
   * Reset container (for new workflow)
   */
  reset(): void {
    this.agentInstances.clear();
    this.context = {
      state: 'DISCOVERY',
      artifacts: {},
      agentOutputs: {},
    };
  }
}

/**
 * Default agent definitions for Momo Dev Team
 */
export const DEFAULT_AGENTS: AgentDefinition[] = [
  {
    name: 'PM',
    dependencies: [],
    promptTemplate: './agents/pm-prompt.md',
    model: 'sonnet',
  },
  {
    name: 'Arch',
    dependencies: ['PM'],
    promptTemplate: './agents/arch-prompt.md',
    model: 'opus',
  },
  {
    name: 'DDE',
    dependencies: ['Arch'],
    promptTemplate: './agents/dde-prompt.md',
    model: 'sonnet',
  },
  {
    name: 'QA',
    dependencies: ['DDE'],
    promptTemplate: './agents/qa-prompt.md',
    model: 'sonnet',
  },
  {
    name: 'Dev',
    dependencies: ['QA'],
    promptTemplate: './agents/dev-prompt.md',
    model: 'haiku',
  },
  {
    name: 'Ops',
    dependencies: ['Dev'],
    promptTemplate: './agents/ops-prompt.md',
    model: 'sonnet',
  },
];

/**
 * Create a pre-configured container
 */
export function createContainer(): IoCContainer {
  const container = new IoCContainer();

  for (const agent of DEFAULT_AGENTS) {
    container.registerAgent(agent);
  }

  return container;
}
