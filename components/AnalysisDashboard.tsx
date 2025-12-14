import React, { useState } from 'react';
import { RepoMetadata, GeminiAnalysis, AgentScores } from '../types';
import ScoreGauge from './ScoreGauge';
import ChatBot from './ChatBot';
import { Star, GitFork, FileText, ArrowRight, Trophy, Layers, Check, CheckCircle2, XCircle, Code, Book, GitCommit, TestTube, Server, X, Info } from 'lucide-react';

interface Props {
  repo: RepoMetadata;
  analysis: GeminiAnalysis;
}

const AnalysisDashboard: React.FC<Props> = ({ repo, analysis }) => {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [selectedAgent, setSelectedAgent] = useState<{key: keyof AgentScores, label: string} | null>(null);

  const toggleStep = (index: number) => {
    const newSteps = new Set(completedSteps);
    if (newSteps.has(index)) {
      newSteps.delete(index);
    } else {
      newSteps.add(index);
    }
    setCompletedSteps(newSteps);
  };

  const progress = Math.round((completedSteps.size / analysis.roadmap.length) * 100);

  // Determine Tier
  let tier = { 
    name: 'Bronze Tier', 
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', 
    iconColor: 'text-orange-500 dark:text-orange-400', 
    message: 'Keep improving!' 
  };
  if (analysis.score >= 50) tier = { 
    name: 'Silver Tier', 
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', 
    iconColor: 'text-slate-500 dark:text-slate-400', 
    message: 'Great start!' 
  };
  if (analysis.score >= 80) tier = { 
    name: 'Gold Tier', 
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', 
    iconColor: 'text-yellow-500 dark:text-yellow-400', 
    message: 'Excellent work!' 
  };

  const getScoreColor = (s: number) => s >= 80 ? 'text-emerald-500 dark:text-emerald-400' : s >= 50 ? 'text-amber-500 dark:text-amber-400' : 'text-rose-500 dark:text-rose-400';

  const agentsList: { key: keyof AgentScores; label: string; icon: React.ElementType }[] = [
    { key: 'codeQuality', label: 'Code Quality', icon: Code },
    { key: 'documentation', label: 'Docs', icon: Book },
    { key: 'testCoverage', label: 'Testing', icon: TestTube },
    { key: 'commitHealth', label: 'Commits', icon: GitCommit },
    { key: 'techStack', label: 'Tech Stack', icon: Server },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in-up pb-12 relative">
      
      {/* 1. Repo Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-center gap-6 transition-colors duration-300">
         <img 
          src={repo.owner.avatar_url} 
          alt={repo.owner.login} 
          className="w-16 h-16 rounded-full ring-4 ring-slate-50 dark:ring-slate-700"
        />
        <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{repo.name}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-2xl">{repo.description || 'No description provided.'}</p>
        </div>
        <div className="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
             <div className="flex flex-col items-center">
                 <Star className="w-5 h-5 text-yellow-500 mb-1" />
                 <span className="font-semibold text-slate-800 dark:text-slate-200">{repo.stargazers_count}</span>
             </div>
             <div className="flex flex-col items-center">
                 <GitFork className="w-5 h-5 text-blue-500 mb-1" />
                 <span className="font-semibold text-slate-800 dark:text-slate-200">{repo.forks_count}</span>
             </div>
             <div className="flex flex-col items-center">
                 <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">{repo.language || 'N/A'}</span>
             </div>
        </div>
      </div>

      {/* 2. Score Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-300">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-6">Repository Score</h3>
        <div className="flex flex-col md:flex-row items-center justify-around gap-8">
            <div className="flex-shrink-0">
                <ScoreGauge score={analysis.score} />
            </div>
            <div className="hidden md:block w-px h-24 bg-slate-100 dark:bg-slate-700"></div>
            <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${tier.color} mb-3`}>
                    <Trophy className={`w-8 h-8 ${tier.iconColor}`} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{tier.name}</h2>
                <p className="text-slate-500 dark:text-slate-400">{tier.message}</p>
            </div>
        </div>
      </div>

      {/* 3. Agent Breakdown Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {agentsList.map((agent, idx) => (
          <div 
            key={idx} 
            onClick={() => setSelectedAgent({key: agent.key, label: agent.label})}
            className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center transition-all duration-300 cursor-pointer hover:border-primary/50 hover:shadow-md group"
          >
            <div className="relative">
                <agent.icon className="w-6 h-6 text-slate-400 dark:text-slate-500 mb-2 group-hover:text-primary transition-colors" />
                <div className="absolute -top-1 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Info className="w-3 h-3 text-primary" />
                </div>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold text-center">{agent.label}</span>
            <span className={`text-xl font-bold ${getScoreColor(analysis.agentScores[agent.key])}`}>{analysis.agentScores[agent.key]}</span>
          </div>
        ))}
      </div>

      {/* 4. Analysis Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Analysis Summary</h3>
              </div>
              {analysis.summaryStyle && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                      {analysis.summaryStyle}
                  </span>
              )}
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {analysis.summary}
          </p>
      </div>

      {/* 5. Strengths & Weaknesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-300">
            <h3 className="text-emerald-600 dark:text-emerald-400 font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Strengths
            </h3>
            <ul className="space-y-3">
                {analysis.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-300 text-sm">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 flex-shrink-0" />
                        {s}
                    </li>
                ))}
            </ul>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-300">
            <h3 className="text-rose-500 dark:text-rose-400 font-bold mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5" /> Areas for Improvement
            </h3>
                <ul className="space-y-3">
                {analysis.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-300 text-sm">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 flex-shrink-0" />
                        {w}
                    </li>
                ))}
            </ul>
        </div>
      </div>

      {/* 6. Personalized Roadmap (Interactive) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-300">
         <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                <Layers className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Personalized Roadmap</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Step-by-step guide to improve your repo</p>
            </div>
        </div>

        <div className="space-y-4">
            {analysis.roadmap.map((item, idx) => (
                <div 
                    key={idx} 
                    className={`group flex items-start gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer border
                        ${completedSteps.has(idx) 
                          ? 'bg-slate-50 dark:bg-slate-900 border-transparent' 
                          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-violet-200 dark:hover:border-violet-700 hover:shadow-sm'}
                    `}
                    onClick={() => toggleStep(idx)}
                >
                    <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                        ${completedSteps.has(idx) 
                          ? 'bg-violet-600 border-violet-600 dark:bg-violet-500 dark:border-violet-500' 
                          : 'border-slate-300 dark:border-slate-600 group-hover:border-violet-400 dark:group-hover:border-violet-500'}
                    `}>
                        {completedSteps.has(idx) && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className={`font-semibold text-base ${completedSteps.has(idx) ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                                {item.title}
                            </h4>
                            <div className="flex gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider
                                    ${item.difficulty === 'Beginner' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                                      item.difficulty === 'Intermediate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                                      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                    {item.difficulty}
                                </span>
                            </div>
                        </div>
                        <p className={`text-sm ${completedSteps.has(idx) ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>
                            {item.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-2 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">Progress: {completedSteps.size} of {analysis.roadmap.length} completed</span>
                <span className="text-slate-500 dark:text-slate-400">{progress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-violet-600 dark:bg-violet-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
      </div>
      
      {/* Footer Link */}
      <div className="text-center pt-4">
        <a 
          href={`https://github.com/${repo.full_name}`} 
          target="_blank" 
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-primary hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
        >
          View repository on GitHub <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {/* ChatBot Overlay */}
      <ChatBot repo={repo} analysis={analysis} />

      {/* Details Modal */}
      {selectedAgent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={() => setSelectedAgent(null)}
              ></div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-fade-in-up overflow-hidden border border-slate-100 dark:border-slate-700">
                  <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                              {selectedAgent.label} Analysis
                          </h3>
                          <button 
                            onClick={() => setSelectedAgent(null)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          >
                              <X className="w-5 h-5" />
                          </button>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-6">
                           <div className="text-4xl font-bold text-primary dark:text-indigo-400">
                               {analysis.agentScores[selectedAgent.key]}
                               <span className="text-lg text-slate-400 dark:text-slate-500 font-medium ml-1">/100</span>
                           </div>
                           <div className="text-sm text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-4">
                               Automated Heuristic Score
                           </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Detailed Factors</h4>
                          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                            {analysis.agentDetails?.[selectedAgent.key] || "No detailed breakdown available for this agent."}
                          </p>
                      </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/80 px-6 py-4 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 text-center">
                      Scores are calculated based on deterministic rules and file analysis.
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AnalysisDashboard;