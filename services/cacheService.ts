import { RepoMetadata, GeminiAnalysis } from '../types';

interface CacheEntry {
  repoData: RepoMetadata;
  aiAnalysis: GeminiAnalysis;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

export const getCachedAnalysis = (repoKey: string): CacheEntry | undefined => {
  return cache.get(repoKey.toLowerCase());
};

export const setCachedAnalysis = (repoKey: string, data: { repoData: RepoMetadata; aiAnalysis: GeminiAnalysis }) => {
  cache.set(repoKey.toLowerCase(), { ...data, timestamp: Date.now() });
};

export const generateCacheKey = (owner: string, repo: string): string => {
  return `${owner}/${repo}`;
};