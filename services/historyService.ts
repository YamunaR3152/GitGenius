import { HistoryItem, GeminiAnalysis, RepoMetadata } from '../types';

const getStorageKey = (userId: string) => `gitgenius_history_${userId}`;

export const saveToHistory = (userId: string, repoData: RepoMetadata, analysis: GeminiAnalysis): HistoryItem => {
  const key = getStorageKey(userId);
  const historyStr = localStorage.getItem(key);
  let history: HistoryItem[] = historyStr ? JSON.parse(historyStr) : [];

  // Remove duplicate if exists (move to top)
  history = history.filter(h => h.repoUrl !== repoData.full_name && h.repoUrl !== `https://github.com/${repoData.full_name}`);

  const newItem: HistoryItem = {
    id: crypto.randomUUID(),
    repoName: repoData.full_name,
    repoUrl: `https://github.com/${repoData.full_name}`,
    score: analysis.score,
    timestamp: Date.now(),
    analysis,
    repoData
  };

  history.unshift(newItem); // Add to beginning
  localStorage.setItem(key, JSON.stringify(history));
  return newItem;
};

export const getHistory = (userId: string): HistoryItem[] => {
  const key = getStorageKey(userId);
  const historyStr = localStorage.getItem(key);
  return historyStr ? JSON.parse(historyStr) : [];
};

export const deleteFromHistory = (userId: string, itemId: string) => {
  const key = getStorageKey(userId);
  const historyStr = localStorage.getItem(key);
  if (!historyStr) return;
  
  let history: HistoryItem[] = JSON.parse(historyStr);
  history = history.filter(h => h.id !== itemId);
  localStorage.setItem(key, JSON.stringify(history));
};

export const clearHistory = (userId: string) => {
  const key = getStorageKey(userId);
  localStorage.removeItem(key);
};