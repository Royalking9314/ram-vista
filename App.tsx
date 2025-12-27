
import React, { useState, useEffect } from 'react';
import { AppTab, User } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import Chat from './components/Chat.tsx';
import Auth from './components/Auth.tsx';
import Profile from './components/Profile.tsx';
import ContactUs from './components/ContactUs.tsx';
import Generator from './components/Generator.tsx';
import { LayoutDashboard, MessageSquare, Database, LogOut, User as UserIcon, Code2, Sun, Moon } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('cloud_ram_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('cloud_ram_user');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    localStorage.removeItem('cloud_ram_user');
    setUser(null);
    setActiveTab(AppTab.DASHBOARD);
    setShowGenerator(false);
  };

  const handleDeleteAccount = () => {
    localStorage.removeItem('cloud_ram_user');
    setUser(null);
    setActiveTab(AppTab.DASHBOARD);
    setShowGenerator(false);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('cloud_ram_user', JSON.stringify(updatedUser));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-doodle-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-100 dark:border-doodle-surface border-t-doodle-blue"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  const renderContent = () => {
    if (showGenerator) return <Generator />;

    switch (activeTab) {
      case AppTab.DASHBOARD:
        return <Dashboard />;
      case AppTab.CHAT:
        return (
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
            <div className="flex-1 min-w-0">
              <Chat />
            </div>
            <ContactUs />
          </div>
        );
      case AppTab.PROFILE:
        return (
          <Profile 
            user={user} 
            onUpdate={handleUpdateUser} 
            onBack={() => setActiveTab(AppTab.DASHBOARD)} 
            onDelete={handleDeleteAccount}
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-doodle-black text-gray-900 dark:text-doodle-text font-sans selection:bg-doodle-purple selection:text-white transition-colors duration-300">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-doodle-base/90 backdrop-blur-xl border-b border-gray-200 dark:border-doodle-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo Area */}
            <div 
              className="flex items-center gap-4 cursor-pointer group" 
              onClick={() => { setActiveTab(AppTab.DASHBOARD); setShowGenerator(false); }}
            >
              <div className="bg-doodle-gradient p-2.5 rounded-2xl shadow-lg shadow-doodle-blue/20 group-hover:scale-105 transition-transform duration-300">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  RAM <span className="text-doodle-blue">Vista</span>
                </h1>
                <p className="text-[10px] text-gray-400 dark:text-doodle-muted font-mono tracking-widest uppercase">Prototype v2.0</p>
              </div>
            </div>
            
            {/* Nav Links */}
            <div className="flex items-center space-x-2">
              <div className="hidden md:flex bg-gray-50 dark:bg-doodle-surface/50 p-1.5 rounded-full border border-gray-200 dark:border-doodle-border">
                <button
                  onClick={() => { setActiveTab(AppTab.DASHBOARD); setShowGenerator(false); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    activeTab === AppTab.DASHBOARD && !showGenerator
                      ? 'bg-doodle-blue text-white shadow-md' 
                      : 'text-gray-500 dark:text-doodle-muted hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-doodle-highlight'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Monitor
                </button>
                <button
                  onClick={() => { setShowGenerator(true); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    showGenerator
                      ? 'bg-doodle-purple text-white shadow-md' 
                      : 'text-gray-500 dark:text-doodle-muted hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-doodle-highlight'
                  }`}
                >
                  <Code2 className="w-4 h-4" />
                  Artifacts
                </button>
                <button
                  onClick={() => { setActiveTab(AppTab.CHAT); setShowGenerator(false); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    activeTab === AppTab.CHAT && !showGenerator
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-doodle-black shadow-md' 
                      : 'text-gray-500 dark:text-doodle-muted hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-doodle-highlight'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Assistant
                </button>
              </div>

              <div className="h-8 w-px bg-gray-200 dark:bg-doodle-border mx-4 hidden md:block"></div>

              {/* Controls & User */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleTheme}
                  className="p-2.5 text-gray-500 dark:text-doodle-muted hover:text-doodle-blue hover:bg-gray-100 dark:hover:bg-doodle-surface rounded-full transition-all"
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <button 
                  onClick={() => { setActiveTab(AppTab.PROFILE); setShowGenerator(false); }}
                  className={`flex items-center gap-3 pl-2 pr-2 py-1.5 rounded-full transition-all border ${
                    activeTab === AppTab.PROFILE 
                    ? 'bg-gray-50 dark:bg-doodle-surface border-doodle-purple' 
                    : 'hover:bg-gray-50 dark:hover:bg-doodle-surface border-transparent'
                  }`}
                >
                  <div className="hidden sm:flex flex-col items-end mr-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{user.name}</span>
                    <span className="text-[9px] text-doodle-blue font-mono">{user.role || 'Admin'}</span>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-doodle-blue to-doodle-purple p-[2px]">
                    <div className="h-full w-full rounded-full bg-white dark:bg-doodle-base flex items-center justify-center">
                       <UserIcon className="w-4 h-4 text-gray-900 dark:text-white" />
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={handleLogout}
                  className="p-2.5 text-gray-500 dark:text-doodle-muted hover:text-doodle-purple hover:bg-gray-100 dark:hover:bg-doodle-surface rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === AppTab.PROFILE && (
          <div className="mb-8 flex items-center gap-2 pl-2">
            <button 
              onClick={() => setActiveTab(AppTab.DASHBOARD)}
              className="text-xs font-bold text-gray-500 dark:text-doodle-muted hover:text-doodle-blue transition-colors uppercase tracking-wider"
            >
              System
            </button>
            <span className="text-gray-300 dark:text-doodle-border text-xs">/</span>
            <span className="text-xs font-bold text-doodle-purple uppercase tracking-wider">User Configuration</span>
          </div>
        )}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default App;
