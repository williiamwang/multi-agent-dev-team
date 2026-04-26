# Arch-Driven SDLC

Architecture-driven Software Development Life Cycle following **Momo AI Engineering Protocol v3.0**.

## Overview

This skill implements a complete software development lifecycle (SDLC) workflow from requirements to production code, built on the following principles:

- **Inversion of Control (IoC):** Container-managed agent instantiation with dependency injection
- **Aspect-Oriented Programming (AOP):** Cross-cutting concerns enforced through aspect interception
- **Full-Stack Isolation Strategy:** Zero in-place editing with sandboxed development

## How It Works

```
Input PRD
    ↓
[Container] Initialize IoC
    ↓
AOP Interceptors (Dependency Guard, Anti-Regression, No-Silent-Failure)
    ↓
┌─────────────────────────────────────────────────────────────┐
│  Workflow States                                             │
│  DISCOVERY → CONTRACT → TDD_RED → IMPLEMENT → COMMIT       │
│     PM, Arch        DDE           QA, Dev      Ops          │
└─────────────────────────────────────────────────────────────┘
    ↓
Output: Complete code + Technical documentation
```

## Sub-Agents

| Agent | Role | Output |
|-------|------|--------|
| **PM** | Requirements analysis | PRD document, boundary context |
| **Arch** | Architecture + coupling scan | Impact analysis report |
| **DDE** | Schema + OpenAPI | Database schema, API contracts |
| **QA** | TDD_RED + regression tests | Test suite |
| **Dev** | Sandbox implementation | Feature code |
| **Ops** | CI/CD configuration | Deployment pipeline |

## AOP Aspects

| Aspect | Type | Purpose |
|--------|------|---------|
| **Dependency Guard** | Before | AST scanning for coupling detection |
| **Anti-Regression** | Around | Continuous regression testing with rollback |
| **No-Silent-Failure** | After | Enforces structured logging |

## Isolation Sandbox Rules

| Layer | Rule |
|-------|------|
| **Backend** | Hexagonal Architecture in `src/features/` |
| **Frontend** | Shadow Components (`.v2.tsx`) + CSS Modules |
| **Database** | Schema Evolution (add-only migrations) |

## Usage

### Invoke the Skill

```
I'm using arch-driven-sdlc to build this feature from requirements.
```

### Provide Requirements

```
Build a user authentication system with:
- Email/password login
- JWT token refresh
- Password reset flow
```

### Review Progress

The workflow will execute through all states:
1. **DISCOVERY** - PM refines requirements, Arch designs architecture
2. **CONTRACT** - DDE defines schema and API contracts
3. **TDD_RED** - QA writes failing tests
4. **IMPLEMENT** - Dev implements until tests pass
5. **COMMIT** - Ops configures CI/CD

## Running the Demo

```bash
cd demo
node runner.ts
```

The demo shows a mock execution of the complete workflow with sample outputs.

## Testing the Skill

The skill includes comprehensive TDD testing scenarios:

```bash
# View testing scenarios
cat tests/testing-scenarios.md
```

Each scenario tests whether agents follow the workflow rules under pressure:
- Isolation Sandbox violations
- TDD_RED enforcement
- Dependency Guard bypass attempts
- Schema modification violations
- CSS regression risks
- Anti-Regression skips
- No-Silent-Failure violations
- Complex architecture pressures

## Output Structure

```
output/
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DDE.md
│   ├── QA.md
│   ├── DEV.md
│   └── OPS.md
├── src/features/<feature>/
│   ├── domain/
│   ├── ports/
│   └── adapters/
├── components/<name>.v2.tsx
├── tests/
│   └── <feature>.test.ts
└── migrations/
    └── YYYYMMDD_add_<table>.sql
```

## Philosophy

| Principle | Application |
|-----------|-------------|
| **IoC** | Container controls all agent instantiation |
| **AOP** | Cross-cutting concerns via declarative aspects |
| **Isolation** | Zero in-place editing, all changes additive |
| **TDD** | Write failing tests first |
| **Verification** | Every state requires explicit validation |

## Comparison with Superpowers

| Feature | Arch-Driven SDLC | Superpowers |
|----------|-------------------|-------------|
| **Workflow** | DISCOVERY → COMMIT | brainstorming → writing-plans → subagent-driven-development → committing |
| **Architecture** | Built-in (Arch agent) | Via brainstorming/planning |
| **Isolation** | Enforced (Sandbox rules) | Via git-worktrees (manual) |
| **AOP** | Declarative (Dependency Guard, etc.) | Via skill instructions |
| **Testing** | TDD_RED + regression enforcement | test-driven-development skill |
| **Rollback** | Automatic (Recovery Manager) | Manual (via worktrees) |
| **Agents** | 6 specialized agents | Subagents (general-purpose) |

**Key Differentiators:**
- **Architecture-First:** Arch agent drives design decisions
- **Automatic Isolation:** Sandbox rules enforced programmatically
- **AOP-Based:** Cross-cutting concerns via aspects
- **Recovery Points:** Automatic rollback capability
- **Specialized Agents:** PM, Arch, DDE, QA, Dev, Ops (vs. generic subagents)

## File Structure

```
arch-driven-sdlc/
├── SKILL.md              # Main skill documentation
├── README.md             # This file
├── package.json          # Package configuration
├── container.ts          # IoC Container implementation
├── isolation.ts          # Isolation Sandbox strategy
├── workflow.ts           # Workflow state machine with recovery
├── aspects/
│   └── aop.ts           # AOP interceptors
├── agents/
│   ├── pm-prompt.md      # PM agent template
│   ├── arch-prompt.md    # Arch agent template
│   ├── dde-prompt.md     # DDE agent template
│   ├── qa-prompt.md      # QA agent template
│   ├── dev-prompt.md     # Dev agent template
│   └── ops-prompt.md     # Ops agent template
├── tests/
│   └── testing-scenarios.md  # TDD test scenarios
└── demo/
    └── runner.ts        # Working demo
```

## Required Skills

- **superpowers:test-driven-development** - TDD_RED methodology
- **superpowers:systematic-debugging** - Regression failure analysis
- **superpowers:using-git-worktrees** - Workspace isolation

## License

MIT
