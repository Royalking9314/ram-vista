import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, Mail, ArrowRight, Loader2, ShieldCheck, Database, Fingerprint, Sparkles, AlertCircle } from 'lucide-react';
import { User as UserType } from '../types.ts';

interface AuthProps {
  onLogin: (user: UserType) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Mouse tracking for glow effect
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!email || !password || (!isLogin && !name)) {
      setError('Required authentication fields missing');
      setLoading(false);
      return;
    }

    const user: UserType = {
      email,
      name: isLogin ? email.split('@')[0] : name,
    };

    localStorage.setItem('cloud_ram_user', JSON.stringify(user));
    onLogin(user);
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const user: UserType = { email: 'google.user@gmail.com', name: 'Google User' };
    localStorage.setItem('cloud_ram_user', JSON.stringify(user));
    onLogin(user);
    setGoogleLoading(false);
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen flex items-center justify-center bg-[#030303] relative overflow-hidden px-4 selection:bg-doodle-blue selection:text-white"
    >
      {/* Interactive Mouse Glow */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(66, 133, 244, 0.08), transparent 80%)`
        }}
      />
      
      {/* Static Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-doodle-blue/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-doodle-purple/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[1.75rem] bg-[#0A0A0A] border border-white/10 mb-2 shadow-2xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-doodle-blue/20 to-doodle-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Database className="w-10 h-10 text-doodle-blue relative z-10" />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-doodle-purple/20 blur-xl"></div>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-5xl font-black text-white tracking-tighter flex items-center justify-center gap-2">
              RAM <span className="text-transparent bg-clip-text bg-gradient-to-r from-doodle-blue to-doodle-purple">Vista</span>
            </h1>
            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-doodle-muted">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Secure Virtual Node
            </div>
          </div>
        </div>

        <div className="bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
          <div className="flex justify-center mb-8">
            <div className="bg-[#050505] p-1.5 rounded-2xl border border-white/5 flex w-full shadow-inner">
              <button
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-500 ${
                  isLogin 
                    ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-[1.02]' 
                    : 'text-doodle-muted hover:text-white'
                }`}
              >
                Access
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-500 ${
                  !isLogin 
                    ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-[1.02]' 
                    : 'text-doodle-muted hover:text-white'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <Fingerprint className="w-5 h-5 text-doodle-muted group-focus-within:text-doodle-blue transition-colors" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#050505] border border-white/5 rounded-2xl py-4 pl-14 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-doodle-blue/30 focus:bg-black transition-all font-bold text-sm shadow-inner"
                  placeholder="IDENTITY NAME"
                />
              </div>
            )}

            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-doodle-muted group-focus-within:text-doodle-blue transition-colors" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#050505] border border-white/5 rounded-2xl py-4 pl-14 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-doodle-blue/30 focus:bg-black transition-all font-bold text-sm shadow-inner"
                placeholder="EMAIL ADDRESS"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-doodle-muted group-focus-within:text-doodle-blue transition-colors" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#050505] border border-white/5 rounded-2xl py-4 pl-14 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-doodle-blue/30 focus:bg-black transition-all font-bold text-sm shadow-inner"
                placeholder="SECURITY KEY"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Fixed missing import for AlertCircle */}
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <span className="text-red-500 text-[10px] font-black uppercase tracking-wider">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-doodle-blue hover:bg-blue-600 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/10 active:scale-95 mt-6 uppercase tracking-[0.2em] text-xs relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {isLogin ? 'Establish Link' : 'Initialize Node'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/5"></div>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Direct Auth</span>
            <div className="flex-1 h-px bg-white/5"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full bg-white hover:bg-gray-100 text-black font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 border border-transparent shadow-md active:scale-95 group text-xs uppercase tracking-widest"
          >
            {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Identity Sync
              </>
            )}
          </button>
        </div>
        
        <p className="mt-8 text-center text-[9px] font-black text-white/20 uppercase tracking-[0.4em] animate-pulse">
          Secure Tunnel AES-256 Verified
        </p>
      </div>
    </div>
  );
};

export default Auth;