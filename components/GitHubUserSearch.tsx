import React, { useState } from 'react';
import { Search, X, Loader2, GitFork, Star, Calendar, User, ArrowRight } from 'lucide-react';
import { fetchUserRepositories } from '../services/githubService';
import { UserRepo } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectRepo: (url: string) => void;
}

const GitHubUserSearch: React.FC<Props> = ({ isOpen, onClose, onSelectRepo }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repos, setRepos] = useState<UserRepo[]>([]);
  const [connectedUser, setConnectedUser] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    setRepos([]);
    setConnectedUser(null);

    try {
      const data = await fetchUserRepositories(username.trim());
      setRepos(data);
      setConnectedUser(username.trim());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch repositories');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (repoUrl: string) => {
    onSelectRepo(repoUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-slate-100 dark:border-slate-700 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              GitHub Integration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Import repositories from a public profile</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter GitHub Username (e.g., YamunaR3152)"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || !username.trim()}
              className="bg-slate-900 dark:bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch Repos'}
            </button>
          </form>

          {error && (
            <div className="p-3 mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm rounded-lg flex items-center gap-2">
               <span>⚠️ {error}</span>
            </div>
          )}

          {!connectedUser && !loading && !error && (
             <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                <GitFork className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Enter a username to browse public repositories.</p>
             </div>
          )}

          {connectedUser && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span>Connected: <strong className="text-slate-700 dark:text-slate-200">@{connectedUser}</strong></span>
                <span>{repos.length} Public Repos Found</span>
              </div>
              
              <div className="grid gap-3">
                {repos.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => handleSelect(repo.html_url)}
                    className="flex flex-col text-left p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:shadow-sm transition-all group bg-white dark:bg-slate-800"
                  >
                    <div className="flex justify-between items-start w-full mb-1">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">
                        {repo.name}
                      </h3>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                    </div>
                    
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 h-10">
                      {repo.description || 'No description provided.'}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-primary/60"></span>
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {repo.stargazers_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(repo.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
                
                {repos.length === 0 && !loading && (
                    <div className="text-center py-8 text-slate-500">
                        No public repositories found for this user.
                    </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 text-[10px] text-center text-slate-400 border-t border-slate-100 dark:border-slate-700">
            We only access public data. No authentication required.
        </div>
      </div>
    </div>
  );
};

export default GitHubUserSearch;