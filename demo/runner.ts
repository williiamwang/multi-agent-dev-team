/**
 * Arch-Driven SDLC - Demo Runner
 *
 * This is a working demo that executes the workflow with mock agents.
 * In production, this would call actual LLM APIs.
 */

import { WorkflowEngine, WorkflowConfig } from '../workflow.js';
import { createContainer } from '../container.js';
import { createAOPWeaver } from '../aspects/aop.js';
import { IsolationSandbox } from '../isolation.js';

/**
 * Mock Agent Response
 */
interface MockAgentResponse {
  state: string;
  agent: string;
  output: string;
  success: boolean;
}

/**
 * Mock Agent for demonstration
 */
class MockAgent {
  constructor(private name: string) {}

  async execute(input: string): Promise<string> {
    console.log(`[${this.name}] Executing with input:`, input.slice(0, 50) + '...');

    // Simulate agent processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return mock output based on agent type
    switch (this.name) {
      case 'PM':
        return this.generatePRD();
      case 'Arch':
        return this.generateArchitecture();
      case 'DDE':
        return this.generateDDE();
      case 'QA':
        return this.generateTests();
      case 'Dev':
        return this.generateCode();
      case 'Ops':
        return this.generateOpsConfig();
      default:
        return `Mock output from ${this.name}`;
    }
  }

  private generatePRD(): string {
    return `# PRD Document

## Overview
User Authentication System

## Requirements
### Functional Requirements
- [FR-001] User can register with email and password
- [FR-002] User can login with email and password
- [FR-003] User can reset password via email
- [FR-004] Session is managed via JWT tokens

### Non-Functional Requirements
- [NFR-001] Passwords must be hashed (bcrypt)
- [NFR-002] JWT tokens expire after 24 hours
- [NFR-003] Rate limiting on login attempts

## Scope
### In Scope
- User registration
- Login/logout
- Password reset
- JWT token management

### Out of Scope
- OAuth integration (future work)
- MFA (future work)
- SSO (future work)
`;
  }

  private generateArchitecture(): string {
    return `# Architecture Document

## Overview
Hexagonal Architecture for User Authentication

## Architectural Pattern
**Pattern:** Hexagonal Architecture (Ports and Adapters)

**Rationale:**
- Clean separation of concerns
- Easy to test
- Dependency injection for flexibility

## Module Structure
\`\`\`
src/features/user-auth/
  domain/
    entities/User.ts
    value-objects/UserId.ts
    use-cases/RegisterUser.ts
  ports/primary/
    AuthControllerPort.ts
  ports/secondary/
    UserRepositoryPort.ts
    EmailSenderPort.ts
  adapters/primary/
    AuthController.ts
  adapters/secondary/
    UserRepository.ts
    EmailSenderAdapter.ts
\`\`\`

## Impact Analysis
- No existing modules affected
- New feature is isolated
- No coupling detected

## Dependency Guard Report
- Scanned 50 files
- No coupling violations detected
- Isolation Sandbox compliance: ✅
`;
  }

  private generateDDE(): string {
    return `# DDE Document

## Database Schema

### New Tables
#### users
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Primary key |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email address |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hash |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

### Relationships
- users → user_sessions (one-to-many)

## Migration File
**Filename:** migrations/20260426_add_users.sql

\`\`\`sql
-- Migration: Add users table
-- Date: 2026-04-26
-- Type: CREATE (Schema Evolution - New Table)

CREATE TABLE \`users\` (
  \`id\` BIGINT PRIMARY KEY AUTO_INCREMENT,
  \`email\` VARCHAR(255) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
\`\`\`

## Domain Types

### Entities
\`\`\`typescript
export interface User {
  id: number;
  email: string;
  passwordHash: string;
  createdAt: Date;
}
\`\`\`

### Port Interfaces
\`\`\`typescript
export interface UserRepositoryPort {
  save(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
}

export interface EmailSenderPort {
  sendPasswordReset(email: string, token: string): Promise<void>;
}
\`\`\`
`;
  }

  private generateTests(): string {
    return `# QA Document

## Test Suite Overview
- Feature Tests: tests/user-auth.test.ts
- Regression Tests: None (no B modules affected)

## TDD_RED Tests

### Happy Path Tests
\`\`\`typescript
describe('RegisterUser', () => {
  it('should register a new user', async () => {
    // Arrange
    const input = { email: 'test@example.com', password: 'Password123!' };

    // Act
    const result = await registerUser.execute(input);

    // Assert
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.id).toBeGreaterThan(0);
  });
});
\`\`\`

### Edge Case Tests
\`\`\`typescript
it('should throw validation error for invalid email', async () => {
  const input = { email: 'invalid', password: 'Password123!' };

  await expect(registerUser.execute(input)).rejects.toThrow('Invalid email');
});

it('should throw error for duplicate email', async () => {
  repository.simulateDuplicate();
  const input = { email: 'existing@example.com', password: 'Password123!' };

  await expect(registerUser.execute(input)).rejects.toThrow('Email already exists');
});
\`\`\`

## Test Coverage Goals

| Metric | Target |
|--------|--------|
| Statement Coverage | 80%+ |
| Branch Coverage | 70%+ |
| Function Coverage | 90%+ |

## Expected Test Status

| Test File | Expected Status |
|-----------|-----------------|
| tests/user-auth.test.ts | FAILING (before implementation) |
`;
  }

  private generateCode(): string {
    return `# Dev Implementation

## TDD_RED Verification

### Test Results (Before Implementation)
| Test | Status | Reason |
|------|--------|--------|
| should register user | FAIL | Use case not implemented |
| should throw validation error | FAIL | Validation not implemented |
| should throw error for duplicate email | FAIL | Duplicate check not implemented |

**Confirmation:** All feature tests fail as expected. Proceeding with implementation.

## Implementation

### Domain Layer
\`\`\`typescript
export class RegisterUser {
  constructor(
    private readonly repository: UserRepositoryPort
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    logger.info('RegisterUser started', { email: input.email });

    try {
      // Validate
      if (!this.isValidEmail(input.email)) {
        logger.warn('Validation failed', { email: input.email });
        throw new ValidationError('Invalid email');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10);

      // Create entity
      const user: User = {
        id: 0,
        email: input.email,
        passwordHash,
        createdAt: new Date(),
      };

      // Persist
      const savedUser = await this.repository.save(user);

      logger.info('RegisterUser completed', { id: savedUser.id });

      return { user: savedUser };
    } catch (error) {
      logger.error('RegisterUser failed', { error, input });
      throw error;
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
  }
}
\`\`\`

### Ports Layer
\`\`\`typescript
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUser
  ) {}

  async register(request: Request): Promise<Response> {
    const dto = await request.json() as RegisterUserDto;

    logger.info('POST /api/v1/auth/register', { dto });

    try {
      const result = await this.registerUser.execute(dto);

      return new Response(
        JSON.stringify(result.user),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn('Validation error in controller', { error });
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      logger.error('Unexpected error in controller', { error });
      return new Response(
        JSON.stringify({ error: 'Internal error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
}
\`\`\`

### Adapters Layer
\`\`\`typescript
export class UserRepository implements UserRepositoryPort {
  constructor(private readonly db: Database) {}

  async save(user: User): Promise<User> {
    logger.info('Saving user to database', { email: user.email });

    try {
      const [result] = await this.db
        .insert({ email: user.email, password_hash: user.passwordHash, created_at: user.createdAt })
        .into('users')
        .returning('*');

      logger.info('User saved successfully', { id: result.id });

      return result;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        logger.warn('Duplicate email', { email: user.email });
        throw new ConflictError('Email already exists');
      }

      logger.error('Failed to save user', { error, user });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const [result] = await this.db
      .select('*')
      .from('users')
      .where({ email })
      .limit(1);

    return result || null;
  }
}
\`\`\`

## Test Results (After Implementation)

| Test | Status |
|------|--------|
| should register user | PASS |
| should throw validation error | PASS |
| should throw error for duplicate email | PASS |

**Confirmation:** All tests passing. Implementation complete.

## Isolation Sandbox Compliance

| Component | Rule | Status |
|-----------|------|--------|
| Domain | src/features/user-auth/domain/ | ✅ |
| Ports | src/features/user-auth/ports/ | ✅ |
| Adapters | src/features/user-auth/adapters/ | ✅ |
| No in-place editing | No existing files modified | ✅ |
`;
  }

  private generateOpsConfig(): string {
    return `# Ops Document

## CI/CD Pipeline

### Continuous Integration
\`\`\`yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npm run migrate

      - name: Run tests
        run: npm run test:ci

      - name: Check coverage
        run: npm run test:coverage
\`\`\`

### Quality Gates

| Check | Threshold | Action on Fail |
|-------|-----------|----------------|
| Tests | 100% passing | Block PR |
| Coverage | 80%+ | Block PR |
| Type Check | No errors | Block PR |

## Deployment

**Strategy:** Blue-Green Deployment

\`\`\`yaml
deploy-production:
  runs-on: ubuntu-latest
  environment:
    name: production
    url: https://example.com

  steps:
    - uses: actions/checkout@v4

    - name: Deploy to production
      run: kubectl apply -f k8s/production/

    - name: Smoke test
      run: npm run test:smoke-production
\`\`\`

## Monitoring

\`\`\`typescript
export const metrics = {
  requestsTotal: new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
  }),

  authOperationsTotal: new Counter({
    name: 'auth_operations_total',
    help: 'Total auth operations',
    labelNames: ['operation', 'status'],
  }),
};
\`\`\`
`;
  }
}

/**
 * Demo Runner
 */
class DemoRunner {
  private workflowEngine: WorkflowEngine | null = null;

  constructor() {
    console.log('========================================');
    console.log('Arch-Driven SDLC Demo Runner');
    console.log('========================================\n');
  }

  async runDemo(): Promise<void> {
    const config: WorkflowConfig = {
      prd: 'User Authentication System',
      outputDir: './output',
    };

    console.log('Configuration:');
    console.log(`  PRD: ${config.prd}`);
    console.log(`  Output: ${config.outputDir}\n`);

    console.log('Initializing workflow...\n');
    this.workflowEngine = new WorkflowEngine(config);

    console.log('Starting workflow execution...\n');
    const result = await this.workflowEngine.execute();

    console.log('\n========================================');
    console.log('Workflow Execution Complete');
    console.log('========================================\n');

    console.log('Result:');
    console.log(`  Success: ${result.success}`);
    console.log(`  Final State: ${result.finalState}`);
    console.log(`  Steps Completed: ${result.steps.filter(s => s.status === 'COMPLETED').length}/${result.steps.length}\n`);

    console.log('Steps:');
    for (const step of result.steps) {
      const icon = step.status === 'COMPLETED' ? '✅' : step.status === 'FAILED' ? '❌' : '⏳';
      console.log(`  ${icon} ${step.state} - ${step.agent} (${step.status})`);
      if (step.startedAt && step.completedAt) {
        const duration = (step.completedAt.getTime() - step.startedAt.getTime()) / 1000;
        console.log(`      Duration: ${duration.toFixed(2)}s`);
      }
    }

    console.log('\nArtifacts:');
    for (const [key, value] of Object.entries(result.artifacts)) {
      console.log(`  ${key}: ${value.length} bytes`);
    }

    console.log('\nReport:');
    console.log(this.workflowEngine.getReport());
  }
}

/**
 * Main execution
 */
async function main() {
  const runner = new DemoRunner();

  try {
    await runner.runDemo();
  } catch (error) {
    console.error('Demo failed:', error);
    process.exit(1);
  }
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DemoRunner };
