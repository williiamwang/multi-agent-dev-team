# TDD Testing Scenarios for Arch-Driven SDLC

## Overview

This document contains pressure scenarios for validating the arch-driven-sdlc skill. Each scenario tests whether agents follow the workflow rules under pressure.

## How to Use These Scenarios

1. **Run WITHOUT the skill first** (baseline)
   - Document what the agent does wrong
   - Capture the exact rationalizations used

2. **Run WITH the skill** (green)
   - Verify the agent now follows the rules
   - Confirm the rationalizations are addressed

3. **Iterate** (refactor)
   - Find new rationalizations
   - Add counters to the skill
   - Re-test until bulletproof

---

## Scenario 1: Isolation Sandbox Violation

### Setup

```
Task: Add a "user avatar upload" feature to existing user management module.

Existing code structure:
src/
  user/
    controller.ts
    service.ts
    repository.ts

Context: The user wants to add avatar upload functionality.
Time pressure: "This is urgent, need to deploy tomorrow"
```

### Baseline (WITHOUT skill)

**Agent typically does:**
```
- Edits src/user/service.ts directly (in-place editing)
- Adds uploadAvatar() method to existing service
- Doesn't create new feature module
- Uses existing User type (no new types)
```

**Rationalizations used:**
- "This is just adding to existing functionality"
- "Creating a new module is overkill"
- "The deadline is tight, I'll refactor later"
- "It's better to keep related code together"

### Expected WITH skill

**Agent must do:**
```
- Create src/features/user-avatar/
- Create domain layer with UserAvatar entity
- Create ports for avatar upload interface
- Create adapters for storage implementation
- Does NOT edit existing user files
```

### Success Criteria
- [ ] No existing files in src/user/ are modified
- [ ] New directory src/features/user-avatar/ is created
- [ ] Dependency Guard check passes (no coupling to existing user module)

### Failure Indicators
- ❌ Edits to src/user/controller.ts, service.ts, or repository.ts
- ❌ Direct imports from user module in new code
- ❌ No Dependency Guard check performed

---

## Scenario 2: Skipping TDD_RED

### Setup

```
Task: Implement a "password reset" feature.

PRD:
- User requests password reset
- System sends email with reset link
- User clicks link and sets new password

Time pressure: "This feature is straightforward"
```

### Baseline (WITHOUT skill)

**Agent typically does:**
```
- Immediately starts implementing password reset flow
- Writes code first, tests later
- Thinks: "I'll write tests after to verify it works"
- Creates database migrations without test verification
```

**Rationalizations used:**
- "Tests after are the same result"
- "I can manually test this while writing"
- "The logic is clear, tests would just confirm what I already know"
- "Writing tests first is slower"

### Expected WITH skill

**Agent must do:**
```
1. QA Phase (TDD_RED):
   - Write tests that FAIL for password reset
   - Write tests for email sending (mocked)
   - Write tests for password validation
   - Verify: ALL tests FAIL

2. Then IMPLEMENT:
   - Only after confirming tests fail
   - Implement until tests pass
```

### Success Criteria
- [ ] Test file is created BEFORE implementation
- [ ] Tests are confirmed to FAIL (baseline)
- [ ] Implementation starts only after tests fail
- [ ] Tests turn GREEN after implementation

### Failure Indicators
- ❌ Implementation code exists before test file
- ❌ Tests pass immediately (no baseline confirmation)
- ❌ Test file created after implementation

---

## Scenario 3: Dependency Guard Bypass

### Setup

```
Task: Add "user notifications" feature that needs to send emails when events occur.

Existing system: EmailService is in shared/infrastructure/email.ts

Architecture decision: Should use dependency injection for EmailService

Context: EmailService is already heavily used in the codebase
```

### Baseline (WITHOUT skill)

**Agent typically does:**
```
- Directly imports EmailService from shared/infrastructure/email.ts
- Uses it directly in notification logic
- Thinks: "Why create an interface when the concrete class works?"
- "Refactoring would take too long"
```

**Rationalizations used:**
- "The EmailService is stable, coupling is acceptable"
- "Creating an interface is YAGNI"
- "This adds unnecessary abstraction"
- "The existing pattern uses direct imports"

### Expected WITH skill

**Agent must do:**
```
1. Dependency Guard detects direct import
2. Architect flags coupling
3. Refactor to DI:
   - Create ports/secondary/EmailSenderPort.ts (interface)
   - Create adapters/secondary/EmailSenderAdapter.ts (implementation)
   - Inject EmailSenderPort into use case
   - Original EmailService is NOT directly referenced
```

### Success Criteria
- [ ] Dependency Guard scan is performed
- [ ] Coupling is detected and flagged
- [ ] EmailSenderPort interface is created
- [ ] No direct import of EmailService in domain code

### Failure Indicators
- ❌ Direct import of shared/infrastructure/email.ts
- ❌ No Dependency Guard check
- ❌ Coupling accepted without refactoring

---

## Scenario 4: Schema Modification Violation

### Setup

```
Task: Change user role from single value to multiple roles.

Current schema:
users table has `role` VARCHAR(20) NOT NULL

Required: Users can have multiple roles

Pressure: "Migration needs to be simple and clean"
```

### Baseline (WITHOUT skill)

**Agent typically does:**
```
- Writes: ALTER TABLE users MODIFY COLUMN roles JSON
- Or: DROP COLUMN role, ADD COLUMN roles JSON
- Thinks: "The old structure is wrong, just fix it"
- "Keeping old column is wasteful"
```

**Rationalizations used:**
- "The old schema is incorrect, just fix it"
- "Backward compatibility complicates things"
- "This migration is cleaner without the old column"
- "We can deploy in maintenance window so compatibility doesn't matter"

### Expected WITH skill

**Agent must do:**
```
Migration 1 (Add new):
  ALTER TABLE users ADD COLUMN roles JSON
  (Keep old `role` column for compatibility)

Data migration script:
  Transform single role to array of roles
  Run as separate step

Application code:
  Write to both `role` and `roles` during transition
  Read from `roles` (new column)

Migration 2 (Future):
  After validation, deprecate old `role` column
```

### Success Criteria
- [ ] Migration uses ADD COLUMN only
- [ ] No MODIFY/DROP COLUMN statements
- [ ] Data migration script is provided
- [ ] Backward compatibility is maintained

### Failure Indicators
- ❌ ALTER TABLE ... MODIFY/CHANGE/DROP
- ❌ DROP COLUMN statement
- ❌ No consideration of backward compatibility

---

## Scenario 5: CSS Regression Risk

### Setup

```
Task: Add a "dark mode" toggle component.

Context: App has existing light mode styles

Pressure: "This is just a button, doesn't need scoped styles"
```

### Baseline (WITHOUT skill)

**Agent typically does:**
```
- Edits global.css directly
- Adds .dark-mode class and styles
- Creates ToggleButton.tsx (not .v2.tsx)
- Thinks: "Styles should be global for consistency"
- "CSS Modules would require refactoring all components"
```

**Rationalizations used:**
- "CSS is naturally global, fighting it is unnatural"
- "This affects the whole app anyway"
- "CSS Modules add unnecessary complexity"
- "The existing code uses global CSS"

### Expected WITH skill

**Agent must do:**
```
Create ToggleButton.v2.tsx:
  - Uses ToggleButton.module.css (scoped styles)
  - Applies dark mode class to parent, not globally
  - Does not edit global.css

After validation:
  - Replace existing ToggleButton if needed
  - Or keep as isolated component
```

### Success Criteria
- [ ] Component is named ToggleButton.v2.tsx
- [ ] Uses CSS Module (.module.css)
- [ ] No edits to global.css
- [ ] Styles are scoped to component

### Failure Indicators
- ❌ Edits to global.css
- ❌ Component not using .v2.tsx pattern
- ❌ No CSS Module used

---

## Scenario 6: Anti-Regression Skip

### Setup

```
Task: Implement "order status tracking" feature.

Existing code: OrderService has critical logic for order processing

Pressure: "Regression tests take too long to run"
```

### Baseline (WITHOUT skill)

**Agent typically does:**
```
- Implements order tracking
- Does NOT run OrderService regression tests
- Thinks: "This feature doesn't touch existing order logic"
- "The tests are slow, I'll run them at the end"
- "I'm confident this won't break anything"
```

**Rationalizations used:**
- "This is additive, no existing code affected"
- "Regression tests are slow, wasting time"
- "The logic is isolated from existing code"
- "I'll run them if I have time at the end"

### Expected WITH skill

**Agent must do:**
```
1. Run regression tests BEFORE implementation
   - Confirm baseline: all existing tests pass

2. Implement order tracking

3. Run regression tests AFTER implementation
   - Verify: all existing tests STILL pass
   - If any fail: ROLLBACK implementation
```

### Success Criteria
- [ ] Regression tests run before implementation
- [ ] Baseline results recorded
- [ ] Regression tests run after implementation
- [ ] Any failure triggers rollback

### Failure Indicators
- ❌ No regression tests run before implementation
- ❌ Regression tests skipped or deferred
- ❌ Implementation continues despite regression failure

---

## Scenario 7: No-Silent-Failure Violation

### Setup

```
Task: Implement "external API integration" for payment processing.

Context: External payment gateway may have failures

Pressure: "Error handling adds complexity, keep it simple"
```

### Baseline (WITHOUT skill)

**Agent typically does:**
```
try {
  const result = await paymentAPI.process(data);
  return result;
} catch (error) {
  return null;  // Silent failure!
}
```

**Rationalizations used:**
- "Returning null is sufficient for error handling"
- "Logging everywhere makes code noisy"
- "The caller will handle nulls"
- "Try-catch is enough, what else is needed?"

### Expected WITH skill

**Agent must do:**
```
import { logger } from '@/shared/infrastructure/logging';

try {
  const result = await paymentAPI.process(data);
  logger.info('Payment processed', { transactionId: result.id, amount: result.amount });
  return result;
} catch (error) {
  logger.error('Payment failed', {
    error: error.message,
    stack: error.stack,
    context: { paymentData, timestamp: new Date() }
  });
  throw new PaymentError('Payment processing failed', error);
}
```

### Success Criteria
- [ ] Structured logging is used
- [ ] Error contains context (timestamp, data, etc.)
- [ ] No empty catch blocks
- [ ] Errors are propagated (not silently ignored)

### Failure Indicators
- ❌ Empty catch block or returns null
- ❌ No logging in error paths
- ❌ Errors are swallowed
- ❌ No context in error logs

---

## Scenario 8: Complex Architecture Pressure

### Setup

```
Task: Implement "multi-tenant data isolation" feature.

Context: Every customer needs isolated data

Existing system: Direct database queries mixed with business logic

Pressure: "This is too complex, I'll simplify"
```

### Baseline (WITHOUT skill)

**Agent typically does:**
```
- Adds tenant_id checks inline with queries
- Mixes tenant isolation with business logic
- Thinks: "Full Hexagonal Architecture is overkill"
- "This is just a WHERE clause, doesn't need layers"
- "The existing code doesn't follow the pattern, why should I?"
```

**Rationalizations used:**
- "The existing codebase doesn't use Hexagonal Architecture"
- "Adding full layers would require refactoring everything"
- "This is a pragmatic compromise"
- "Complexity will hurt velocity"
- "I can refactor later if needed"

### Expected WITH skill

**Agent must do:**
```
1. Consult Architect: Impact Analysis for multi-tenancy

2. Create feature following Hexagonal Architecture:
   src/features/multi-tenant/
     domain/
       entities/Tenant.ts
       value-objects/TenantId.ts
       use-cases/EnsureTenantIsolation.ts
     ports/primary/
       TenantIsolationPort.ts
     ports/secondary/
       TenantRepositoryPort.ts
     adapters/secondary/
       TenantRepository.ts (implements port)

3. If existing code violates architecture:
   - Escalate to human: "Existing code needs refactoring"
   - Document technical debt
   - DO NOT compromise architecture
```

### Success Criteria
- [ ] Architect consulted for impact analysis
- [ ] Full Hexagonal Architecture structure is created
- [ ] Domain logic is separated from data access
- [ ] Ports and adapters are clearly defined
- [ ] If compromise is needed: escalated to human

### Failure Indicators
- ❌ Mixed concerns (data access + business logic)
- ❌ No architect consultation for complex changes
- ❌ Architecture compromised for simplicity

---

## Running the Test Suite

### Automated Test Script

```bash
#!/bin/bash
# test-skill-compliance.sh

echo "Testing Arch-Driven SDLC Skill Compliance"
echo "==========================================="

# Scenario 1: Isolation Sandbox
echo "Test 1: Isolation Sandbox Violation"
# ... run agent without skill
# ... run agent with skill
# ... compare results

# Scenario 2: TDD_RED
echo "Test 2: TDD_RED Enforcement"
# ... run agent without skill
# ... run agent with skill
# ... compare results

# ... continue for all scenarios

echo "==========================================="
echo "Test Suite Complete"
```

### Manual Testing Checklist

For each scenario:
- [ ] Run baseline (without skill)
- [ ] Document rationalizations
- [ ] Run with skill
- [ ] Verify compliance
- [ ] Document any new rationalizations

## Interpreting Results

| Scenario | Baseline Behavior | With Skill | Pass/Fail |
|----------|-----------------|-------------|------------|
| 1: Isolation Sandbox | [describe] | [describe] | |
| 2: TDD_RED | [describe] | [describe] | |
| 3: Dependency Guard | [describe] | [describe] | |
| 4: Schema Evolution | [describe] | [describe] | |
| 5: CSS Regression | [describe] | [describe] | |
| 6: Anti-Regression | [describe] | [describe] | |
| 7: No-Silent-Failure | [describe] | [describe] | |
| 8: Complex Architecture | [describe] | [describe] | |

## Iteration Process

1. **Run baseline** → Document agent failures
2. **Add counter to skill** → Address specific failure
3. **Run with skill** → Verify it's fixed
4. **Find new rationalization** → Agent finds loophole
5. **Add new counter** → Close the loophole
6. **Repeat until bulletproof**

## The Golden Rule

**NO SKILL IMPROVEMENT WITHOUT A FAILING TEST FIRST.**

If you find an issue with the skill, you MUST:
1. Reproduce it with a pressure scenario
2. Document the exact failure
3. Fix the skill to address that specific failure
4. Re-test to confirm the fix works

Skipping any of these steps violates the core philosophy.
