/**
 * Manus API Client Wrapper
 * Provides unified interface for interacting with Manus AI agents
 */

import axios, { AxiosInstance } from "axios";

interface ManusConfig {
  apiKey: string;
  baseUrl: string;
}

interface ProjectCreateRequest {
  name: string;
  instruction: string;
}

interface TaskCreateRequest {
  message: {
    content: Array<{
      type: "text" | "file";
      text?: string;
      file_id?: string;
    }>;
    connectors?: string[];
  };
  project_id: string;
  title: string;
}

interface TaskListMessagesRequest {
  task_id: string;
  limit?: number;
  order?: "asc" | "desc";
}

interface ManusResponse<T> {
  ok: boolean;
  request_id: string;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export class ManusClient {
  private client: AxiosInstance;
  private config: ManusConfig;

  constructor(config: ManusConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        "x-manus-api-key": config.apiKey,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Create a new Manus Project for an AI Agent
   */
  async createProject(request: ProjectCreateRequest) {
    try {
      const response = await this.client.post<ManusResponse<any>>(
        "/v2/project.create",
        request
      );

      if (!response.data.ok) {
        throw new Error(
          `Manus API Error: ${response.data.error?.message || "Unknown error"}`
        );
      }

      return response.data.data;
    } catch (error) {
      console.error("[Manus] Failed to create project:", error);
      throw error;
    }
  }

  /**
   * Create a new AI task
   */
  async createTask(request: TaskCreateRequest) {
    try {
      const response = await this.client.post<ManusResponse<any>>(
        "/v2/task.create",
        request
      );

      if (!response.data.ok) {
        throw new Error(
          `Manus API Error: ${response.data.error?.message || "Unknown error"}`
        );
      }

      return response.data.data;
    } catch (error) {
      console.error("[Manus] Failed to create task:", error);
      throw error;
    }
  }

  /**
   * List messages for a task (polling for results)
   */
  async listMessages(request: TaskListMessagesRequest) {
    try {
      const params = new URLSearchParams();
      params.append("task_id", request.task_id);
      if (request.limit) params.append("limit", request.limit.toString());
      if (request.order) params.append("order", request.order);

      const response = await this.client.get<ManusResponse<any>>(
        `/v2/task.listMessages?${params.toString()}`
      );

      if (!response.data.ok) {
        throw new Error(
          `Manus API Error: ${response.data.error?.message || "Unknown error"}`
        );
      }

      return response.data.data;
    } catch (error) {
      console.error("[Manus] Failed to list messages:", error);
      throw error;
    }
  }

  /**
   * Send a message to an existing task (multi-turn conversation)
   */
  async sendMessage(
    taskId: string,
    message: {
      content: Array<{
        type: "text" | "file";
        text?: string;
        file_id?: string;
      }>;
    }
  ) {
    try {
      const response = await this.client.post<ManusResponse<any>>(
        "/v2/task.sendMessage",
        {
          task_id: taskId,
          message,
        }
      );

      if (!response.data.ok) {
        throw new Error(
          `Manus API Error: ${response.data.error?.message || "Unknown error"}`
        );
      }

      return response.data.data;
    } catch (error) {
      console.error("[Manus] Failed to send message:", error);
      throw error;
    }
  }

  /**
   * Upload a file for use in tasks
   */
  async uploadFile(filename: string) {
    try {
      const response = await this.client.post<ManusResponse<any>>(
        "/v2/file.upload",
        { filename }
      );

      if (!response.data.ok) {
        throw new Error(
          `Manus API Error: ${response.data.error?.message || "Unknown error"}`
        );
      }

      return response.data.data;
    } catch (error) {
      console.error("[Manus] Failed to upload file:", error);
      throw error;
    }
  }
}

/**
 * Global Manus client instance
 */
let manusClient: ManusClient | null = null;

export function initManusClient(apiKey: string, baseUrl: string) {
  manusClient = new ManusClient({
    apiKey,
    baseUrl,
  });
  return manusClient;
}

export function getManusClient(): ManusClient {
  if (!manusClient) {
    throw new Error(
      "Manus client not initialized. Call initManusClient first."
    );
  }
  return manusClient;
}
