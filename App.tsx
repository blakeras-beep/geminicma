import React, { useState } from 'react';
import { LayoutDashboard, Compass, Users, Bell, Settings as SettingsIcon, PieChart } from 'lucide-react';
import { Dashboard } from './Dashboard';
import { Scout } from './Scout';
import { AgentRunner } from './AgentRunner';
import { Settings } from './Settings';

type Tab = 'dashboard' | 'scout' | 'competitors' | 'alerts' | 'settings';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight">Sandlin<span className="text-indigo-400">CMA</span></h1>
          <p className="text-xs text-slate-400 mt-1">Market Intelligence v2.0</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
          />
          <NavButton 
            active={activeTab === 'scout'} 
            onClick={() => setActiveTab('scout')} 
            icon={<Compass size={20} />} 
            label="Market Scout" 
            badge="New"
          />
          <NavButton 
            active={activeTab === 'competitors'} 
            onClick={() => setActiveTab('competitors')} 
            icon={<Users size={20} />} 
            label="Competitors" 
          />
          <NavButton 
            active={activeTab === 'alerts'} 
            onClick={() => setActiveTab('alerts')} 
            icon={<Bell size={20} />} 
            label="Alerts" 
            badge="3"
          />
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-1">
          <NavButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            icon={<SettingsIcon size={20} />} 
            label="Settings" 
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
            {/* Header Area */}
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {activeTab === 'dashboard' && 'Market Overview'}
                        {activeTab === 'scout' && 'Competitor Scout'}
                        {activeTab === 'competitors' && 'Competitive Analysis'}
                        {activeTab === 'alerts' && 'Market Alerts'}
                        {activeTab === 'settings' && 'System Configuration'}
                    </h2>
                    <p className="text-gray-500 text-sm">Real-time market data for Sandlin Homes</p>
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-xs font-mono text-gray-400">System Status: Online</span>
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                </div>
            </header>

            {/* Global Agent Runner Widget - Hide on Settings page */}
            {activeTab !== 'settings' && <AgentRunner />}

            {/* Tab Content */}
            <div className="animate-fade-in">
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'scout' && <Scout />}
                {activeTab === 'settings' && <Settings />}
                {activeTab === 'competitors' && (
                    <div className="bg-white p-12 text-center rounded-xl border border-dashed border-gray-300">
                        <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-gray-500 font-medium">Detailed Analysis View</h3>
                        <p className="text-gray-400 text-sm">Select a competitor from the dashboard to view details.</p>
                    </div>
                )}
                {activeTab === 'alerts' && (
                     <div className="bg-white p-12 text-center rounded-xl border border-dashed border-gray-300">
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-gray-500 font-medium">Alert History</h3>
                        <p className="text-gray-400 text-sm">Full history of price changes and inventory alerts.</p>
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
};

const NavButton: React.FC<{ 
    active: boolean; 
    onClick: () => void; 
    icon: React.ReactNode; 
    label: string;
    badge?: string;
}> = ({ active, onClick, icon, label, badge }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            active 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
        <div className="flex items-center gap-3">
            {icon}
            <span>{label}</span>
        </div>
        {badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                active ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'
            }`}>
                {badge}
            </span>
        )}
    </button>
);