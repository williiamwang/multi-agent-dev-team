/**
 * GitHub/GitLab 集成模块
 * 自动拉取 PR、Issue 和 Commit 信息
 */

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  baseUrl?: string;
}

export interface GitLabConfig {
  token: string;
  projectId: string;
  baseUrl?: string;
}

export interface PullRequest {
  id: number;
  title: string;
  description: string;
  author: string;
  status: 'open' | 'closed' | 'merged';
  createdAt: Date;
  updatedAt: Date;
  url: string;
  files: number;
  additions: number;
  deletions: number;
}

export interface Issue {
  id: number;
  title: string;
  description: string;
  author: string;
  status: 'open' | 'closed';
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
  url: string;
}

export interface Commit {
  sha: string;
  message: string;
  author: string;
  date: Date;
  url: string;
  files: number;
  additions: number;
  deletions: number;
}

class GitHubIntegration {
  private config: GitHubConfig;
  private baseUrl: string;

  constructor(config: GitHubConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.github.com';
  }

  /**
   * 获取所有 PR
   */
  async getPullRequests(state: 'open' | 'closed' | 'all' = 'open'): Promise<PullRequest[]> {
    const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/pulls?state=${state}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.map((pr: any) => ({
        id: pr.number,
        title: pr.title,
        description: pr.body,
        author: pr.user.login,
        status: pr.merged ? 'merged' : pr.state,
        createdAt: new Date(pr.created_at),
        updatedAt: new Date(pr.updated_at),
        url: pr.html_url,
        files: pr.changed_files,
        additions: pr.additions,
        deletions: pr.deletions,
      }));
    } catch (error) {
      console.error('[GitHub] Error fetching PRs:', error);
      return [];
    }
  }

  /**
   * 获取所有 Issue
   */
  async getIssues(state: 'open' | 'closed' | 'all' = 'open'): Promise<Issue[]> {
    const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/issues?state=${state}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.map((issue: any) => ({
        id: issue.number,
        title: issue.title,
        description: issue.body,
        author: issue.user.login,
        status: issue.state,
        labels: issue.labels.map((l: any) => l.name),
        createdAt: new Date(issue.created_at),
        updatedAt: new Date(issue.updated_at),
        url: issue.html_url,
      }));
    } catch (error) {
      console.error('[GitHub] Error fetching issues:', error);
      return [];
    }
  }

  /**
   * 获取最近的 Commit
   */
  async getCommits(branch: string = 'main', limit: number = 10): Promise<Commit[]> {
    const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/commits?sha=${branch}&per_page=${limit}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.map((commit: any) => ({
        sha: commit.sha.substring(0, 7),
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: new Date(commit.commit.author.date),
        url: commit.html_url,
        files: 0, // 需要额外 API 调用获取
        additions: 0,
        deletions: 0,
      }));
    } catch (error) {
      console.error('[GitHub] Error fetching commits:', error);
      return [];
    }
  }

  /**
   * 获取特定 PR 的详细信息
   */
  async getPullRequestDetails(prNumber: number): Promise<PullRequest | null> {
    const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/pulls/${prNumber}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const pr = await response.json();

      return {
        id: pr.number,
        title: pr.title,
        description: pr.body,
        author: pr.user.login,
        status: pr.merged ? 'merged' : pr.state,
        createdAt: new Date(pr.created_at),
        updatedAt: new Date(pr.updated_at),
        url: pr.html_url,
        files: pr.changed_files,
        additions: pr.additions,
        deletions: pr.deletions,
      };
    } catch (error) {
      console.error('[GitHub] Error fetching PR details:', error);
      return null;
    }
  }
}

class GitLabIntegration {
  private config: GitLabConfig;
  private baseUrl: string;

  constructor(config: GitLabConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://gitlab.com/api/v4';
  }

  /**
   * 获取所有 MR（Merge Request）
   */
  async getMergeRequests(state: 'opened' | 'closed' | 'merged' | 'all' = 'opened'): Promise<PullRequest[]> {
    const url = `${this.baseUrl}/projects/${this.config.projectId}/merge_requests?state=${state}`;

    try {
      const response = await fetch(url, {
        headers: {
          'PRIVATE-TOKEN': this.config.token,
        },
      });

      if (!response.ok) {
        throw new Error(`GitLab API error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.map((mr: any) => ({
        id: mr.iid,
        title: mr.title,
        description: mr.description,
        author: mr.author.username,
        status: mr.state,
        createdAt: new Date(mr.created_at),
        updatedAt: new Date(mr.updated_at),
        url: mr.web_url,
        files: mr.changes_count,
        additions: mr.additions,
        deletions: mr.deletions,
      }));
    } catch (error) {
      console.error('[GitLab] Error fetching MRs:', error);
      return [];
    }
  }

  /**
   * 获取所有 Issue
   */
  async getIssues(state: 'opened' | 'closed' | 'all' = 'opened'): Promise<Issue[]> {
    const url = `${this.baseUrl}/projects/${this.config.projectId}/issues?state=${state}`;

    try {
      const response = await fetch(url, {
        headers: {
          'PRIVATE-TOKEN': this.config.token,
        },
      });

      if (!response.ok) {
        throw new Error(`GitLab API error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.map((issue: any) => ({
        id: issue.iid,
        title: issue.title,
        description: issue.description,
        author: issue.author.username,
        status: issue.state,
        labels: issue.labels,
        createdAt: new Date(issue.created_at),
        updatedAt: new Date(issue.updated_at),
        url: issue.web_url,
      }));
    } catch (error) {
      console.error('[GitLab] Error fetching issues:', error);
      return [];
    }
  }

  /**
   * 获取最近的 Commit
   */
  async getCommits(branch: string = 'main', limit: number = 10): Promise<Commit[]> {
    const url = `${this.baseUrl}/projects/${this.config.projectId}/repository/commits?ref_name=${branch}&per_page=${limit}`;

    try {
      const response = await fetch(url, {
        headers: {
          'PRIVATE-TOKEN': this.config.token,
        },
      });

      if (!response.ok) {
        throw new Error(`GitLab API error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.map((commit: any) => ({
        sha: commit.short_id,
        message: commit.message,
        author: commit.author_name,
        date: new Date(commit.created_at),
        url: commit.web_url,
        files: 0,
        additions: 0,
        deletions: 0,
      }));
    } catch (error) {
      console.error('[GitLab] Error fetching commits:', error);
      return [];
    }
  }
}

/**
 * 创建 GitHub 集成实例
 */
export function createGitHubIntegration(config: GitHubConfig): GitHubIntegration {
  return new GitHubIntegration(config);
}

/**
 * 创建 GitLab 集成实例
 */
export function createGitLabIntegration(config: GitLabConfig): GitLabIntegration {
  return new GitLabIntegration(config);
}

/**
 * 示例使用
 */
export async function exampleUsage() {
  // GitHub 集成
  const github = createGitHubIntegration({
    token: 'your-github-token',
    owner: 'your-org',
    repo: 'your-repo',
  });

  const prs = await github.getPullRequests('open');
  const issues = await github.getIssues('open');
  const commits = await github.getCommits('main', 10);

  console.log('GitHub PRs:', prs);
  console.log('GitHub Issues:', issues);
  console.log('GitHub Commits:', commits);

  // GitLab 集成
  const gitlab = createGitLabIntegration({
    token: 'your-gitlab-token',
    projectId: 'your-project-id',
  });

  const mrs = await gitlab.getMergeRequests('opened');
  const gitlabIssues = await gitlab.getIssues('opened');
  const gitlabCommits = await gitlab.getCommits('main', 10);

  console.log('GitLab MRs:', mrs);
  console.log('GitLab Issues:', gitlabIssues);
  console.log('GitLab Commits:', gitlabCommits);
}
