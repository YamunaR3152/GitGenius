import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { loginUser, registerUser } from '../services/authService';
import { Github, Loader2, ArrowRight, Eye, EyeOff, Plus } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

const AuthPage: React.FC<Props> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [role, setRole] = useState<UserRole>('Student');
  const [customRole, setCustomRole] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic Validation
    if (!email || !password) {
        setError("Please fill in all fields.");
        return;
    }

    if (isRegistering) {
        if (!name) {
            setError("Name is required.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
    }

    setIsLoading(true);

    // Simulate network delay for better UX
    setTimeout(() => {
      try {
        let user: User;
        if (isRegistering) {
          const finalRole = isCustomRole ? customRole : role;
          if (isCustomRole && !finalRole.trim()) {
            throw new Error("Please specify your role");
          }
          user = registerUser(name, email, password, finalRole);
        } else {
          user = loginUser(email, password);
        }
        onLogin(user);
      } catch (err: any) {
        setError(err.message || 'Authentication failed');
      } finally {
        setIsLoading(false);
      }
    }, 800);
  };

  const toggleMode = () => {
      setIsRegistering(!isRegistering);
      setError('');
      setShowPassword(false);
      setPassword('');
      setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-700">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent p-8 text-center text-white">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mb-4 backdrop-blur-sm">
            <Github className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold mb-2">GitGenius</h1>
          <p className="opacity-90">AI-Powered Repository Audit</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <div className="flex gap-4 mb-6 border-b border-slate-100 dark:border-slate-700">
            <button 
              className={`flex-1 pb-2 font-medium text-sm transition-colors ${!isRegistering ? 'text-primary border-b-2 border-primary' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
              onClick={() => !isRegistering || toggleMode()}
            >
              Sign In
            </button>
            <button 
              className={`flex-1 pb-2 font-medium text-sm transition-colors ${isRegistering ? 'text-primary border-b-2 border-primary' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
              onClick={() => isRegistering || toggleMode()}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Password</label>
                 <div className="relative">
                   <input
                     type={showPassword ? "text" : "password"}
                     required
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full px-4 py-2 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                     placeholder="••••••••"
                   />
                   <button
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                     tabIndex={-1}
                   >
                     {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                   </button>
                 </div>
            </div>

            {isRegistering && (
                <div className="space-y-1 animate-fade-in">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Confirm Password</label>
                    <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white ${
                            confirmPassword && password !== confirmPassword ? 'border-rose-300 dark:border-rose-800' : 'border-slate-200 dark:border-slate-700'
                        }`}
                        placeholder="••••••••"
                    />
                     {confirmPassword && password !== confirmPassword && (
                        <p className="text-[10px] text-rose-500 mt-1">Passwords do not match</p>
                    )}
                </div>
            )}

            {isRegistering && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">I am a...</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Student', 'Mentor', 'Recruiter', 'Developer']).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => { setRole(r as UserRole); setIsCustomRole(false); }}
                      className={`py-2 px-3 text-sm rounded-lg border text-left transition-all ${
                        !isCustomRole && role === r 
                          ? 'bg-primary/10 border-primary text-primary font-semibold' 
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                  <button
                      type="button"
                      onClick={() => setIsCustomRole(true)}
                      className={`py-2 px-3 text-sm rounded-lg border text-left transition-all flex items-center justify-center gap-2 ${
                        isCustomRole
                          ? 'bg-primary/10 border-primary text-primary font-semibold' 
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                       <Plus className="w-4 h-4" /> Other
                  </button>
                </div>
                
                {isCustomRole && (
                    <input 
                        type="text"
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        placeholder="Type your role (e.g. Product Manager)"
                        className="w-full mt-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                        autoFocus
                    />
                )}
              </div>
            )}
            
            {error && (
              <p className="text-rose-500 text-sm bg-rose-50 dark:bg-rose-900/20 p-2 rounded border border-rose-100 dark:border-rose-800">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-slate-900 dark:bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {isRegistering ? 'Create Account' : 'Sign In'} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;