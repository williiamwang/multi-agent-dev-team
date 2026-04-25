import { EventEmitter } from 'events';

/**
 * 实时协作系统
 * 支持多用户同时编辑任务和文档
 */

export interface CollaborationSession {
  id: string;
  type: 'task' | 'document';
  resourceId: number;
  users: Set<number>;
  cursors: Map<number, CursorPosition>;
  operations: Operation[];
  version: number;
}

export interface CursorPosition {
  userId: number;
  line: number;
  column: number;
  userName: string;
  color: string;
}

export interface Operation {
  id: string;
  userId: number;
  type: 'insert' | 'delete' | 'update';
  position: number;
  content?: string;
  length?: number;
  timestamp: number;
  version: number;
}

export interface ConflictResolution {
  operation1: Operation;
  operation2: Operation;
  resolved: Operation;
}

class RealtimeCollaborationManager extends EventEmitter {
  private sessions = new Map<string, CollaborationSession>();
  private operationHistory = new Map<string, Operation[]>();
  private conflictLog: ConflictResolution[] = [];

  /**
   * 创建协作会话
   */
  createSession(resourceId: number, type: 'task' | 'document'): CollaborationSession {
    const sessionId = `${type}-${resourceId}-${Date.now()}`;
    const session: CollaborationSession = {
      id: sessionId,
      type,
      resourceId,
      users: new Set(),
      cursors: new Map(),
      operations: [],
      version: 0,
    };

    this.sessions.set(sessionId, session);
    this.operationHistory.set(sessionId, []);

    console.log(`[Collaboration] Session created: ${sessionId}`);
    return session;
  }

  /**
   * 用户加入协作会话
   */
  joinSession(sessionId: string, userId: number, userName: string): CollaborationSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.users.add(userId);
    session.cursors.set(userId, {
      userId,
      line: 0,
      column: 0,
      userName,
      color: this.generateUserColor(userId),
    });

    this.emit('user:joined', { sessionId, userId, userName });
    console.log(`[Collaboration] User ${userId} joined session ${sessionId}`);

    return session;
  }

  /**
   * 用户离开协作会话
   */
  leaveSession(sessionId: string, userId: number): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.users.delete(userId);
    session.cursors.delete(userId);

    if (session.users.size === 0) {
      this.sessions.delete(sessionId);
      this.emit('session:closed', { sessionId });
      console.log(`[Collaboration] Session closed: ${sessionId}`);
    } else {
      this.emit('user:left', { sessionId, userId });
    }
  }

  /**
   * 应用操作（处理冲突）
   */
  applyOperation(sessionId: string, operation: Operation): Operation {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    operation.version = session.version;

    // 获取操作历史
    const history = this.operationHistory.get(sessionId) || [];

    // 检查冲突
    const conflicts = this.detectConflicts(operation, history);

    if (conflicts.length > 0) {
      // 解决冲突
      const resolved = this.resolveConflicts(operation, conflicts);
      operation = resolved;

      // 记录冲突解决
      conflicts.forEach((conflict) => {
        this.conflictLog.push({
          operation1: conflict,
          operation2: operation,
          resolved: operation,
        });
      });
    }

    // 应用操作
    session.operations.push(operation);
    history.push(operation);
    session.version++;

    this.emit('operation:applied', { sessionId, operation });
    console.log(`[Collaboration] Operation applied to session ${sessionId}:`, operation.type);

    return operation;
  }

  /**
   * 更新光标位置
   */
  updateCursor(sessionId: string, userId: number, line: number, column: number): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const cursor = session.cursors.get(userId);
    if (cursor) {
      cursor.line = line;
      cursor.column = column;
      this.emit('cursor:updated', { sessionId, userId, line, column });
    }
  }

  /**
   * 获取会话状态
   */
  getSessionState(sessionId: string): CollaborationSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * 获取操作历史
   */
  getOperationHistory(sessionId: string): Operation[] {
    return this.operationHistory.get(sessionId) || [];
  }

  /**
   * 检测冲突
   */
  private detectConflicts(operation: Operation, history: Operation[]): Operation[] {
    return history.filter((op) => {
      // 同一位置的不同操作视为冲突
      if (op.position === operation.position && op.userId !== operation.userId) {
        return true;
      }
      // 删除和插入在同一范围内的操作视为冲突
      if (
        op.type === 'delete' &&
        operation.type === 'insert' &&
        op.position <= operation.position &&
        operation.position <= op.position + (op.length || 0)
      ) {
        return true;
      }
      return false;
    });
  }

  /**
   * 解决冲突（使用操作转换 OT 算法）
   */
  private resolveConflicts(operation: Operation, conflicts: Operation[]): Operation {
    let resolved = { ...operation };

    for (const conflict of conflicts) {
      if (conflict.type === 'insert' && resolved.type === 'insert') {
        // 两个插入操作：按用户 ID 排序
        if (conflict.userId < resolved.userId) {
          resolved.position += conflict.content?.length || 0;
        }
      } else if (conflict.type === 'delete' && resolved.type === 'delete') {
        // 两个删除操作：调整位置
        if (conflict.position < resolved.position) {
          resolved.position -= conflict.length || 0;
        }
      } else if (conflict.type === 'insert' && resolved.type === 'delete') {
        // 插入和删除：调整删除位置
        if (conflict.position < resolved.position) {
          resolved.position += conflict.content?.length || 0;
        }
      } else if (conflict.type === 'delete' && resolved.type === 'insert') {
        // 删除和插入：调整插入位置
        if (conflict.position < resolved.position) {
          resolved.position -= conflict.length || 0;
        }
      }
    }

    return resolved;
  }

  /**
   * 生成用户颜色
   */
  private generateUserColor(userId: number): string {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#FFA07A',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E2',
    ];
    return colors[userId % colors.length];
  }

  /**
   * 获取冲突日志
   */
  getConflictLog(): ConflictResolution[] {
    return this.conflictLog;
  }

  /**
   * 清除会话
   */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.operationHistory.delete(sessionId);
    console.log(`[Collaboration] Session cleared: ${sessionId}`);
  }
}

// 导出单例
export const collaborationManager = new RealtimeCollaborationManager();

/**
 * 示例使用
 */
export function exampleUsage() {
  // 创建会话
  const session = collaborationManager.createSession(1, 'document');

  // 用户加入
  collaborationManager.joinSession(session.id, 1, 'Alice');
  collaborationManager.joinSession(session.id, 2, 'Bob');

  // 应用操作
  const op1: Operation = {
    id: '1',
    userId: 1,
    type: 'insert',
    position: 0,
    content: 'Hello',
    timestamp: Date.now(),
    version: 0,
  };

  const op2: Operation = {
    id: '2',
    userId: 2,
    type: 'insert',
    position: 0,
    content: 'World',
    timestamp: Date.now(),
    version: 0,
  };

  collaborationManager.applyOperation(session.id, op1);
  collaborationManager.applyOperation(session.id, op2);

  // 更新光标
  collaborationManager.updateCursor(session.id, 1, 0, 5);
  collaborationManager.updateCursor(session.id, 2, 0, 5);

  // 获取状态
  const state = collaborationManager.getSessionState(session.id);
  console.log('Session state:', state);

  // 获取冲突日志
  const conflicts = collaborationManager.getConflictLog();
  console.log('Conflicts:', conflicts);
}
