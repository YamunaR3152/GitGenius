export interface RepoMetadata {
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string;
  owner: {
    avatar_url: string;
    login: string;
  };
  updated_at: string;
  license: {
    name: string;
  } | null;
  default_branch: string;
}

export interface UserRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
}

export interface RoadmapItem {
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'Documentation' | 'Code Quality' | 'DevOps' | 'Features';
}

export interface AgentScores {
  codeQuality: number;
  documentation: number;
  commitHealth: number;
  testCoverage: number;
  techStack: number;
}

export interface AgentDetails {
  codeQuality: string;
  documentation: string;
  commitHealth: string;
  testCoverage: string;
  techStack: string;
}

export interface GeminiAnalysis {
  score: number;
  agentScores: AgentScores;
  agentDetails: AgentDetails;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  roadmap: RoadmapItem[];
  summaryStyle?: SummaryStyle;
}

export interface AnalysisState {
  status: 'idle' | 'loading_github' | 'loading_ai' | 'success' | 'error';
  error?: string;
  repoData?: RepoMetadata;
  aiAnalysis?: GeminiAnalysis;
}

export interface CommitData {
  sha: string;
  message: string;
  author_name: string;
  date: string;
}

export interface FileData {
  name: string;
  type: 'file' | 'dir';
  path: string;
}

export type SummaryStyle = 'Clarity' | 'Naturalness' | 'Professional' | 'Informativeness';

export type UserRole = 'Student' | 'Mentor' | 'Recruiter' | 'Developer' | string;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface HistoryItem {
  id: string;
  repoName: string;
  repoUrl: string;
  score: number;
  timestamp: number;
  analysis: GeminiAnalysis;
  repoData: RepoMetadata;
}