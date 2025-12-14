import React, { useState, useEffect } from 'react';
import { Search, Github, Loader2, Sparkles, AlertTriangle, Moon, Sun, ChevronDown, Check, Filter, UserSearch, Menu } from 'lucide-react';
import { AnalysisState, SummaryStyle, User, HistoryItem } from './types';
import { fetchRepoMetadata, fetchReadmeContent, parseGithubUrl, fetchRepoStructure, fetchRecentCommits, fetchDependencyFile } from './services/githubService';
import { analyzeRepoWithGemini } from './services/geminiService';
import { getCachedAnalysis, setCachedAnalysis } from './services/cacheService';
import { getCurrentUser, logoutUser } from './services/authService';
import { getHistory, saveToHistory, deleteFromHistory } from './services/historyService';

import AnalysisDashboard from './components/AnalysisDashboard';
import AgentProgress from './components/AgentProgress';
import GitHubUserSearch from './components/GitHubUserSearch';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';

const summaryStyles: SummaryStyle[] = ['Clarity', 'Naturalness', 'Professional', 'Informativeness'];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [url, setUrl] = useState('');
  const [style, setStyle] = useState<SummaryStyle>('Clarity');
  const [state, setState] = useState<AnalysisState>({ status: 'idle' });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);

  // Initialize theme from localStorage or system preference
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply theme changes
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Auth Initialization
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setHistory(getHistory(currentUser.id));
    }
  }, []);

  const toggleTheme = () => setIsDark(!isDark);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setHistory(getHistory(loggedInUser.id));
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setHistory([]);
    setState({ status: 'idle' });
  };

  const handleDeleteHistory = (itemId: string) => {
    if (!user) return;
    deleteFromHistory(user.id, itemId);
    setHistory(prev => prev.filter(h => h.id !== itemId));
    
    // If we deleted the currently viewed analysis, reset view?
    // Not strictly necessary, but can be done if desired.
    // For now, we keep the view open even if deleted from history sidebar.
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!user) return; // Should not happen if guarded

    const repoPath = parseGithubUrl(url);
    if (!repoPath) {
      setState({ status: 'error', error: 'Invalid GitHub URL. Please use format: https://github.com/username/repo' });
      return;
    }

    // Check Cache First (in history)
    const existingHistory = history.find(h => h.repoUrl === url || h.repoName === repoPath);
    // Optional: we could load from history if found, but user clicked Analyze, so let's re-analyze or check fresh.
    // For now, let's stick to the flow of fetching fresh unless strictly cached in memory.
    
    // Check Cache Service
    const cacheKey = `${repoPath}-${style}-${user.role}`;
    const cached = getCachedAnalysis(cacheKey);

    if (cached) {
        console.log("Cache hit for", cacheKey);
        setState({ 
            status: 'success', 
            repoData: cached.repoData, 
            aiAnalysis: cached.aiAnalysis 
        });
        
        // Update history even on cache hit to bring to top
        const newItem = saveToHistory(user.id, cached.repoData, cached.aiAnalysis);
        setHistory(prev => [newItem, ...prev.filter(h => h.id !== newItem.id)]);
        return;
    }

    setState({ status: 'loading_github' });

    try {
      const repoData = await fetchRepoMetadata(repoPath);
      
      const [readme, files, commits] = await Promise.all([
        fetchReadmeContent(repoPath, repoData.default_branch),
        fetchRepoStructure(repoPath),
        fetchRecentCommits(repoPath)
      ]);
      
      const dependencyFile = await fetchDependencyFile(repoPath, files);

      setState({ status: 'loading_ai', repoData });

      // Pass user role to Gemini Service
      const aiAnalysis = await analyzeRepoWithGemini(repoData, readme, files, commits, dependencyFile, style, user.role);

      setCachedAnalysis(cacheKey, { repoData, aiAnalysis });

      // Save to History
      const newItem = saveToHistory(user.id, repoData, aiAnalysis);
      setHistory(prev => [newItem, ...prev.filter(h => h.id !== newItem.id)]);

      setState({ 
        status: 'success', 
        repoData, 
        aiAnalysis 
      });

    } catch (error: any) {
      setState({ 
        status: 'error', 
        error: error.message || 'An unexpected error occurred.' 
      });
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setState({
        status: 'success',
        repoData: item.repoData,
        aiAnalysis: item.analysis
    });
    setUrl(item.repoUrl);
  };

  const resetAnalysis = () => {
    setState({ status: 'idle' });
    setUrl('');
  };

  // If not logged in, show Auth Page
  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  // Dashboard Layout
  return (
    <div className="h-screen flex bg-background dark:bg-slate-900 font-sans selection:bg-primary/20 transition-colors duration-300 overflow-hidden">
      
      <Sidebar 
        user={user} 
        history={history} 
        onSelectHistory={loadHistoryItem} 
        onDeleteHistory={handleDeleteHistory}
        onNewAnalysis={resetAnalysis} 
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Navbar */}
        <nav className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur shrink-0 flex items-center justify-between px-4 z-30">
            <div className="flex items-center gap-3">
                <button onClick={toggleSidebar} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                    <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 cursor-pointer" onClick={resetAnalysis}>
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-sm">
                        <Github className="text-white w-5 h-5" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white hidden sm:block">GitGenius</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Toggle Dark Mode"
                >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <a 
                    href="https://github.com" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors font-medium hidden md:block"
                >
                    Gemini 2.5
                </a>
            </div>
        </nav>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
            
            {/* Search / Hero Section */}
            <div className={`transition-all duration-700 ease-in-out max-w-4xl mx-auto ${state.status !== 'idle' ? 'py-4' : 'py-20'}`}>
            <div className={`text-center space-y-6 ${state.status !== 'idle' && 'hidden'}`}>
                <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Welcome back, {user.name.split(' ')[0]}. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Ready to audit?</span>
                </h1>
                <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
                Paste a GitHub URL below to get a {user.role.toLowerCase()}-focused analysis.
                </p>
            </div>

            <div className={`max-w-2xl mx-auto mt-10 relative z-20 ${state.status === 'success' ? 'hidden' : 'block'}`}>
                <form onSubmit={handleAnalyze} className="relative group">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                
                <div className="relative flex flex-col md:flex-row items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-visible transition-colors duration-300">
                    <div className="flex-1 flex items-center w-full">
                        <div className="pl-4 text-slate-400">
                        <Github className="w-5 h-5" />
                        </div>
                        <input 
                        type="text" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://github.com/username/repo"
                        className="w-full bg-transparent border-none py-4 px-4 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-0"
                        disabled={state.status === 'loading_github' || state.status === 'loading_ai'}
                        />
                    </div>
                    
                    <div className="flex items-center w-full md:w-auto p-2 gap-2 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700">
                        
                        {/* Custom Dropdown */}
                        <div className="relative flex-1 md:flex-none min-w-[150px]">
                            <button
                                type="button"
                                onClick={() => !state.status.startsWith('loading') && setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full md:w-auto flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-700/50 py-2 px-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-transparent focus:border-primary/20"
                                disabled={state.status === 'loading_github' || state.status === 'loading_ai'}
                            >
                                <div className="flex flex-col items-start text-left">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-tight">Summary Style</span>
                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">{style}</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-10" 
                                        onClick={() => setIsDropdownOpen(false)}
                                    ></div>
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-20 animate-fade-in-up">
                                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
                                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Select Preference</span>
                                        </div>
                                        <div className="py-1">
                                            {summaryStyles.map((option) => (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => {
                                                        setStyle(option);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between group transition-colors"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className={`font-medium ${style === option ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>
                                                            {option}
                                                        </span>
                                                    </div>
                                                    {style === option && <Check className="w-4 h-4 text-primary" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <button 
                        type="submit"
                        disabled={state.status === 'loading_github' || state.status === 'loading_ai' || !url}
                        className="flex-shrink-0 px-6 py-2.5 bg-slate-900 dark:bg-primary hover:bg-primary dark:hover:bg-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-primary/20"
                        >
                        {state.status === 'loading_github' || state.status === 'loading_ai' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>Analyze <Search className="w-4 h-4" /></>
                        )}
                        </button>
                    </div>
                </div>
                </form>
                
                {/* GitHub Connect Link */}
                <div className="mt-4 text-center">
                    <button 
                        onClick={() => setIsUserSearchOpen(true)}
                        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors font-medium"
                    >
                        <UserSearch className="w-4 h-4" />
                        Don't have a URL? Search by GitHub Username
                    </button>
                </div>
            </div>
            </div>

            {/* Loading States */}
            <div className="max-w-3xl mx-auto">
                {state.status === 'loading_github' && (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-fade-in">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Fetching files, commits, and metadata...</p>
                    </div>
                )}

                {/* Agent Progress Component */}
                {state.status === 'loading_ai' && (
                    <AgentProgress />
                )}

                {state.status === 'error' && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-6 flex items-start gap-4 mt-8 animate-fade-in">
                        <AlertTriangle className="w-6 h-6 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-red-700 dark:text-red-400 font-bold mb-1">Analysis Failed</h3>
                            <p className="text-red-600/80 dark:text-red-300">{state.error}</p>
                            <button 
                                onClick={resetAnalysis}
                                className="mt-4 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold underline"
                            >
                                Try another repository
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Results */}
            {state.status === 'success' && state.repoData && state.aiAnalysis && (
                <AnalysisDashboard repo={state.repoData} analysis={state.aiAnalysis} />
            )}
        
        <GitHubUserSearch 
            isOpen={isUserSearchOpen} 
            onClose={() => setIsUserSearchOpen(false)} 
            onSelectRepo={(repoUrl) => {
                setUrl(repoUrl);
                setIsUserSearchOpen(false);
            }} 
        />
        
        </main>
      </div>
    </div>
  );
};

export default App;