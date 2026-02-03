import React, { useEffect, useState } from 'react';
import { API } from './api';
import { Competitor, Alert } from './types';
import { TrendingDown, TrendingUp, AlertTriangle, Home, DollarSign, Loader2, Play } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [compsData, alertsData] = await Promise.all([
          API.getCompetitors(),
          API.getAlerts()
      ]);
      setCompetitors(compsData);
      setAlerts(alertsData);
    } catch (e) {
        console.error("Failed to load dashboard data", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Poll for updates occasionally
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
      return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  // Empty State
  if (competitors.length === 0 && alerts.length === 0) {
      return (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 ml-1" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Analyze</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                  The system is connected to the BDX Feed but hasn't analyzed any data yet. 
                  Run the agent to sync communities and scout for competitors.
              </p>
              <div className="text-sm text-gray-400">
                  (Click "Run Analysis Agent" above)
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard 
          title="Active Competitors" 
          value={competitors.length.toString()} 
          icon={<Home className="w-5 h-5 text-blue-600" />} 
          trend={competitors.length > 0 ? "+New" : undefined}
          trendUp={true}
        />
        <KPICard 
          title="Avg Price" 
          value={competitors.length > 0 ? `$${Math.floor(competitors.reduce((acc, c) => acc + c.priceMin, 0)/competitors.length/1000)}k` : '-'}
          icon={<DollarSign className="w-5 h-5 text-green-600" />} 
          subtext="Entry Level"
        />
        <KPICard 
          title="Critical Alerts" 
          value={alerts.filter(a => a.severity === 'high').length.toString()} 
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />} 
          trend={alerts.length > 0 ? "Action Needed" : "Stable"}
          urgent={alerts.some(a => a.severity === 'high')}
        />
        <KPICard 
          title="Data Freshness" 
          value="Now" 
          icon={<TrendingUp className="w-5 h-5 text-indigo-600" />} 
          subtext="Live Feed"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
           {/* Alerts Section */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
               <h3 className="font-semibold text-gray-900">Recent Alerts</h3>
               <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{alerts.length} New</span>
             </div>
             <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto custom-scrollbar">
               {alerts.length === 0 ? (
                   <div className="p-8 text-center text-gray-400">No active alerts. Market is stable.</div>
               ) : alerts.map(alert => (
                 <div key={alert.id} className="p-4 hover:bg-gray-50 transition-colors flex gap-4">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                      alert.severity === 'high' ? 'bg-red-500' : alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-gray-900">{alert.competitorName}</span>
                        <span className="text-xs text-gray-400">{alert.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      {alert.valueChange && (
                        <div className={`text-xs font-semibold mt-2 ${alert.valueChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {alert.valueChange < 0 ? 'Price Drop: ' : 'Price Increase: '} 
                          ${Math.abs(alert.valueChange).toLocaleString()}
                        </div>
                      )}
                    </div>
                 </div>
               ))}
             </div>
           </div>
        </div>

        {/* Sidebar / Top Competitors */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Top Competitors</h3>
          </div>
          <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
             {competitors.length === 0 ? (
                 <div className="text-center text-gray-400 py-4">No competitors found. Check Scout.</div>
             ) : competitors.map(comp => (
               <div key={comp.id} className="group cursor-pointer">
                 <div className="flex justify-between items-center mb-1">
                   <span className="font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">{comp.name}</span>
                   <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{comp.builder}</span>
                 </div>
                 <div className="text-sm text-gray-500 flex justify-between">
                    <span>${(comp.priceMin/1000).toFixed(0)}k - ${(comp.priceMax/1000).toFixed(0)}k</span>
                    <span className="text-xs text-indigo-500 font-medium">Alignment: {comp.alignmentScore}%</span>
                 </div>
                 <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${comp.alignmentScore}%` }} />
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  subtext?: string;
  trend?: string;
  trendUp?: boolean;
  urgent?: boolean;
}> = ({ title, value, icon, subtext, trend, trendUp, urgent }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
      {trend && (
        <div className={`text-xs font-medium px-2 py-1 rounded-full ${
          urgent ? 'bg-red-100 text-red-700' : trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {trend}
        </div>
      )}
    </div>
    <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
    <div className="text-sm text-gray-500">{title}</div>
    {subtext && <div className="text-xs text-gray-400 mt-2">{subtext}</div>}
  </div>
);