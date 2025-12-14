import React from 'react';
import { HistoryItem, User } from '../types';
import { Plus, MessageSquare, LogOut, LayoutGrid, Clock, ChevronRight, Trash2 } from 'lucide-react';

interface Props {
  user: User;
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onDeleteHistory: (id: string) => void;
  onNewAnalysis: () => void;
  onLogout: () => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<Props> = ({ user, history, onSelectHistory, onDeleteHistory, onNewAnalysis, onLogout, isOpen, toggleSidebar }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar Container */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-64'
      }`}>
        
        {/* Header / New Analysis */}
        <div className="p-4">
          <button 
            onClick={() => { onNewAnalysis(); if(window.innerWidth < 768) toggleSidebar(); }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-all shadow-sm group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span className="font-semibold text-sm">New Analysis</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          
          {/* Recent */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
               <Clock className="w-3 h-3" /> Recent History
            </h3>
            <div className="space-y-1">
              {history.length === 0 ? (
                 <div className="px-3 py-4 text-sm text-slate-600 italic text-center">
                    No history yet. Start your first analysis!
                 </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="relative group/item">
                    <button
                        onClick={() => { onSelectHistory(item); if(window.innerWidth < 768) toggleSidebar(); }}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-3 group pr-9"
                    >
                        <MessageSquare className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors flex-shrink-0" />
                        <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-slate-200 truncate">{item.repoName.split('/')[1]}</p>
                        <p className="text-[10px] text-slate-500 truncate">{new Date(item.timestamp).toLocaleDateString()}</p>
                        </div>
                        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            item.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                            item.score >= 50 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-rose-500/20 text-rose-400'
                        }`}>
                            {item.score}
                        </div>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDeleteHistory(item.id); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-rose-400 opacity-0 group-hover/item:opacity-100 transition-opacity rounded-md hover:bg-slate-700/50"
                        title="Delete from history"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
           <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                  {user.name.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate capitalize">{user.role}</p>
              </div>
           </div>
           
           <button 
             onClick={onLogout}
             className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-white transition-colors py-2"
           >
              <LogOut className="w-3 h-3" /> Sign Out
           </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;