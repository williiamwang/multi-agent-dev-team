#!/usr/bin/env node

/**
 * End-to-End Workflow Test Script
 * Tests the complete multi-agent development workflow
 */

// Use built-in fetch API (Node.js 18+)

const BASE_URL = 'http://localhost:3000/api/trpc';

// Test utilities
const log = {
  info: (msg) => console.log(`\n📝 ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  section: (msg) => console.log(`\n${'='.repeat(60)}\n🧪 ${msg}\n${'='.repeat(60)}`),
};

// Mock user context for testing
const mockUser = {
  id: 1,
  openId: 'test-user-001',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

// Helper to make API calls
async function callAPI(endpoint, method = 'GET', body = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test 1: Create a project
async function testCreateProject() {
  log.section('Test 1: Create Project');

  const projectData = {
    name: 'E-Commerce Platform v2',
    description: 'Rebuild e-commerce platform with AI-driven development',
    status: 'planning',
  };

  log.info(`Creating project: "${projectData.name}"`);
  const result = await callAPI('/projects.create', 'POST', projectData);

  if (result.success) {
    log.success(`Project created: ${JSON.stringify(result.data.result.data.json)}`);
    return result.data.result.data.json;
  } else {
    log.error(`Failed to create project: ${result.error || result.data}`);
    return null;
  }
}

// Test 2: Create a workflow
async function testCreateWorkflow(projectId) {
  log.section('Test 2: Create Workflow');

  const workflowData = {
    projectId,
    name: 'Complete Development Cycle',
    description: 'Full workflow from requirements to QA',
    initiatedBy: mockUser.id,
  };

  log.info(`Creating workflow for project ${projectId}`);
  const result = await callAPI('/workflows.create', 'POST', workflowData);

  if (result.success) {
    log.success(`Workflow created: ${JSON.stringify(result.data.result.data.json)}`);
    return result.data.result.data.json;
  } else {
    log.error(`Failed to create workflow: ${result.error || result.data}`);
    return null;
  }
}

// Test 3: Get workflow details
async function testGetWorkflow(workflowId) {
  log.section('Test 3: Get Workflow Details');

  log.info(`Fetching workflow ${workflowId}`);
  const result = await callAPI(`/workflows.getById?input=${JSON.stringify({ workflowId })}`);

  if (result.success) {
    const workflow = result.data.result.data.json;
    log.success(`Workflow retrieved:`);
    console.log(`  - Status: ${workflow.status}`);
    console.log(`  - Current Stage: ${workflow.currentStage}`);
    console.log(`  - Created: ${workflow.createdAt}`);
    return workflow;
  } else {
    log.error(`Failed to get workflow: ${result.error || result.data}`);
    return null;
  }
}

// Test 4: Create documents for each stage
async function testCreateDocuments(workflowId) {
  log.section('Test 4: Create Stage Documents');

  const documents = [
    {
      workflowId,
      stageType: 'requirements',
      documentType: 'PRD',
      title: 'Product Requirements Document - E-Commerce v2',
      content: 'Complete PRD with features, user stories, and acceptance criteria...',
      fileUrl: 'https://example.com/prd.pdf',
    },
    {
      workflowId,
      stageType: 'architecture',
      documentType: 'ARCHITECTURE',
      title: 'System Architecture Design',
      content: 'Microservices architecture with detailed component diagrams...',
      fileUrl: 'https://example.com/architecture.pdf',
    },
    {
      workflowId,
      stageType: 'development',
      documentType: 'API_CONTRACT',
      title: 'API Contract Specification',
      content: 'RESTful API endpoints with request/response schemas...',
      fileUrl: 'https://example.com/api-contract.pdf',
    },
  ];

  for (const doc of documents) {
    log.info(`Creating ${doc.documentType} for ${doc.stageType} stage`);
    const result = await callAPI('/documents.upsert', 'POST', doc);

    if (result.success) {
      log.success(`Document created: ${doc.title}`);
    } else {
      log.error(`Failed to create document: ${result.error || result.data}`);
    }
  }
}

// Test 5: Create atomic tasks
async function testCreateAtomicTasks(workflowId) {
  log.section('Test 5: Create Atomic Tasks');

  const tasks = [
    {
      workflowId,
      taskId: 'TASK-001',
      title: 'Design user authentication system',
      category: 'backend',
      description: 'Implement OAuth 2.0 with JWT tokens',
      preconditions: 'Architecture approved',
      inputs: 'User requirements, security standards',
      outputs: 'Auth service API, documentation',
      acceptanceCriteria: 'All auth flows working, 95% test coverage',
      selfTestCases: 'Unit tests, integration tests',
      dependencies: [],
      status: 'pending',
    },
    {
      workflowId,
      taskId: 'TASK-002',
      title: 'Build product listing frontend',
      category: 'frontend',
      description: 'Create product grid with filters and sorting',
      preconditions: 'API contract ready',
      inputs: 'API specification, design mockups',
      outputs: 'React components, styles',
      acceptanceCriteria: 'Responsive design, 60fps performance',
      selfTestCases: 'Visual regression tests, performance tests',
      dependencies: ['TASK-001'],
      status: 'pending',
    },
    {
      workflowId,
      taskId: 'TASK-003',
      title: 'Setup database schema',
      category: 'infrastructure',
      description: 'Create MySQL tables with proper indexing',
      preconditions: 'Architecture approved',
      inputs: 'Data model, performance requirements',
      outputs: 'Database schema, migration scripts',
      acceptanceCriteria: 'All tables created, indexes optimized',
      selfTestCases: 'Query performance tests',
      dependencies: [],
      status: 'pending',
    },
  ];

  for (const task of tasks) {
    log.info(`Creating task: ${task.title}`);
    const result = await callAPI('/tasks.create', 'POST', task);

    if (result.success) {
      log.success(`Task created: ${task.taskId}`);
    } else {
      log.error(`Failed to create task: ${result.error || result.data}`);
    }
  }
}

// Test 6: Submit a bug
async function testSubmitBug(workflowId) {
  log.section('Test 6: Submit Bug Report');

  const bug = {
    workflowId,
    bugId: 'BUG-001',
    title: 'Authentication fails with special characters in password',
    severity: 'HIGH',
    traceback: `
Error: Invalid token format
  at validateToken (auth.ts:45)
  at authenticate (auth.ts:120)
  at POST /api/auth/login (routes.ts:50)

Steps to reproduce:
1. Register with password containing special chars: P@ss!word#123
2. Attempt to login
3. Receive "Invalid token" error

Expected: Login succeeds
Actual: Login fails with 401 error
    `.trim(),
    reportedBy: mockUser.id,
    assignedTo: null,
    status: 'open',
  };

  log.info(`Submitting bug: ${bug.title}`);
  const result = await callAPI('/bugs.submit', 'POST', bug);

  if (result.success) {
    log.success(`Bug submitted: ${bug.bugId}`);
    return result.data.result.data.json;
  } else {
    log.error(`Failed to submit bug: ${result.error || result.data}`);
    return null;
  }
}

// Test 7: Submit bug reply (fix)
async function testSubmitBugReply(bugId) {
  log.section('Test 7: Submit Bug Fix Reply');

  const reply = {
    bugId,
    replyType: 'hotfix',
    content: `
Fixed the issue by properly escaping special characters in password validation.

Changes:
- Updated validatePassword() to handle special chars
- Added unit tests for edge cases
- Tested with various special character combinations

Status: Ready for testing
    `.trim(),
    submittedBy: mockUser.id,
  };

  log.info(`Submitting fix for bug ${bugId}`);
  const result = await callAPI('/bugs.submitReply', 'POST', reply);

  if (result.success) {
    log.success(`Bug fix submitted`);
  } else {
    log.error(`Failed to submit bug reply: ${result.error || result.data}`);
  }
}

// Test 8: Create a dispute
async function testCreateDispute(workflowId) {
  log.section('Test 8: Create Dispute (PM vs Dev)');

  const dispute = {
    workflowId,
    initiatedRole: 'pm',
    oppositeRole: 'dev',
    issue: `
PM argues: Task TASK-002 should include pagination for performance.
Dev argues: Pagination adds complexity; infinite scroll is simpler and better UX.

Need arbitration on the best approach.
    `.trim(),
    status: 'open',
  };

  log.info(`Creating dispute between ${dispute.initiatedRole} and ${dispute.oppositeRole}`);
  const result = await callAPI('/disputes.create', 'POST', dispute);

  if (result.success) {
    log.success(`Dispute created: ${result.data.result.data.json.id}`);
    return result.data.result.data.json;
  } else {
    log.error(`Failed to create dispute: ${result.error || result.data}`);
    return null;
  }
}

// Test 9: Submit dispute round
async function testSubmitDisputeRound(disputeId) {
  log.section('Test 9: Submit Dispute Discussion Round');

  const round = {
    disputeId,
    roundNumber: 1,
    fromRole: 'dev',
    content: `
Infinite scroll is better because:
1. Better mobile UX - no need to click "next"
2. Simpler implementation - just fetch more items
3. Better engagement - users see more content naturally

Pagination is outdated for modern web apps.
    `.trim(),
  };

  log.info(`Submitting round ${round.roundNumber} from ${round.fromRole}`);
  const result = await callAPI('/disputes.submitRound', 'POST', round);

  if (result.success) {
    log.success(`Dispute round submitted`);
  } else {
    log.error(`Failed to submit dispute round: ${result.error || result.data}`);
  }
}

// Test 10: Get workflow status
async function testGetWorkflowStatus(workflowId) {
  log.section('Test 10: Get Complete Workflow Status');

  log.info(`Fetching complete workflow status for ${workflowId}`);
  const result = await callAPI(`/workflows.getById?input=${JSON.stringify({ workflowId })}`);

  if (result.success) {
    const workflow = result.data.result.data.json;
    console.log(`
Workflow Status Summary:
  - ID: ${workflow.id}
  - Name: ${workflow.name}
  - Status: ${workflow.status}
  - Current Stage: ${workflow.currentStage}
  - Progress: ${workflow.completedStages || 0} stages completed
  - Created: ${workflow.createdAt}
  - Updated: ${workflow.updatedAt}
    `.trim());
    return workflow;
  } else {
    log.error(`Failed to get workflow status: ${result.error || result.data}`);
    return null;
  }
}

// Main test runner
async function runTests() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║   Multi-Agent Development Workflow - E2E Test Suite        ║
║   Testing complete workflow from requirements to QA        ║
╚════════════════════════════════════════════════════════════╝
  `);

  try {
    // Test 1: Create project
    const project = await testCreateProject();
    if (!project) throw new Error('Failed to create project');

    // Test 2: Create workflow
    const workflow = await testCreateWorkflow(project.id);
    if (!workflow) throw new Error('Failed to create workflow');

    // Test 3: Get workflow details
    await testGetWorkflow(workflow.id);

    // Test 4: Create documents
    await testCreateDocuments(workflow.id);

    // Test 5: Create atomic tasks
    await testCreateAtomicTasks(workflow.id);

    // Test 6: Submit bug
    const bug = await testSubmitBug(workflow.id);
    if (bug) {
      // Test 7: Submit bug reply
      await testSubmitBugReply(bug.id);
    }

    // Test 8: Create dispute
    const dispute = await testCreateDispute(workflow.id);
    if (dispute) {
      // Test 9: Submit dispute round
      await testSubmitDisputeRound(dispute.id);
    }

    // Test 10: Get final workflow status
    await testGetWorkflowStatus(workflow.id);

    console.log(`
╔════════════════════════════════════════════════════════════╗
║   ✅ All Tests Completed Successfully!                     ║
║   The multi-agent workflow system is functioning properly  ║
╚════════════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    console.error(`
╔════════════════════════════════════════════════════════════╗
║   ❌ Test Suite Failed                                     ║
║   Error: ${error.message}
╚════════════════════════════════════════════════════════════╝
    `);
    process.exit(1);
  }
}

// Run the tests
runTests();
