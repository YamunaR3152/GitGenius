import React, { useEffect, useState } from 'react';
import { Code, FileText, TestTube, GitCommit, BrainCircuit, CheckCircle2, Circle, Loader2, Server } from 'lucide-react';

interface AgentStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'waiting' | 'running' | 'completed';
}

const AgentProgress: React.FC = () => {
  // Start countdown from ~9.5s to accommodate extra step
  const [timeLeft, setTimeLeft] = useState(9.5);
  
  const [steps, setSteps] = useState<AgentStep[]>([
    { id: 'code', label: 'Code Quality Agent', icon: <Code className="w-4 h-4" />, status: 'running' },
    { id: 'docs', label: 'Documentation Agent', icon: <FileText className="w-4 h-4" />, status: 'waiting' },
    { id: 'test', label: 'Test Coverage Agent', icon: <TestTube className="w-4 h-4" />, status: 'waiting' },
    { id: 'commit', label: 'Commit History Agent', icon: <GitCommit className="w-4 h-4" />, status: 'waiting' },
    { id: 'tech', label: 'Tech Stack Agent', icon: <Server className="w-4 h-4" />, status: 'waiting' },
    { id: 'summary', label: 'Executive Summary Agent', icon: <BrainCircuit className="w-4 h-4" />, status: 'waiting' },
  ]);

  useEffect(() => {
    // Countdown Timer
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 0.1;
        return next > 0 ? next : 0;
      });
    }, 100);

    // Simulate Agent Progression visually
    const progressTimers = [
      setTimeout(() => updateStep('code', 'completed'), 1500),
      setTimeout(() => updateStep('docs', 'running'), 1500),
      setTimeout(() => updateStep('docs', 'completed'), 3000),
      setTimeout(() => updateStep('test', 'running'), 3000),
      setTimeout(() => updateStep('test', 'completed'), 4500),
      setTimeout(() => updateStep('commit', 'running'), 4500),
      setTimeout(() => updateStep('commit', 'completed'), 6000),
      setTimeout(() => updateStep('tech', 'running'), 6000),
      setTimeout(() => updateStep('tech', 'completed'), 7500),
      setTimeout(() => updateStep('summary', 'running'), 7500),
    ];

    return () => {
      clearInterval(timerInterval);
      progressTimers.forEach(t => clearTimeout(t));
    };
  }, []);

  const updateStep = (id: string, status: 'running' | 'completed') => {
    setSteps(prev => prev.map(step => {
      if (step.id === id) return { ...step, status };
      return step;
    }));
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 w-full max-w-md relative overflow-hidden transition-colors duration-300">
        {/* Header with Timer */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-primary" />
                    Agent System
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-400">Analyzing repository...</p>
            </div>
            <div className="font-mono text-xl font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-600">
                {timeLeft.toFixed(1)}s
            </div>
        </div>

        {/* Steps List */}
        <div className="space-y-4">
            {steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-4">
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                        {step.status === 'completed' && (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-scale-in">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        )}
                        {step.status === 'running' && (
                            <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-indigo-400 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin" />
                            </div>
                        )}
                        {step.status === 'waiting' && (
                            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-300 dark:text-slate-600 flex items-center justify-center border border-slate-100 dark:border-slate-600">
                                <Circle className="w-5 h-5" />
                            </div>
                        )}
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                        <p className={`font-medium text-sm transition-colors duration-300 ${
                            step.status === 'completed' ? 'text-slate-800 dark:text-slate-200' : 
                            step.status === 'running' ? 'text-primary dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'
                        }`}>
                            {step.label}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 h-4">
                            {step.status === 'running' ? 'Processing data...' : 
                             step.status === 'completed' ? 'Done' : ''}
                        </p>
                    </div>
                </div>
            ))}
        </div>
        
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 dark:bg-primary/10 blur-[50px] -z-10 rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 dark:bg-accent/10 blur-[50px] -z-10 rounded-full pointer-events-none"></div>
      </div>
    </div>
  );
};

export default AgentProgress;