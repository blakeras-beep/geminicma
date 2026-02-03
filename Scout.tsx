import React, { useEffect, useState } from 'react';
import { CompetitorAssignment } from './types';
import { API } from './api';
import { Check, X, MapPin, ExternalLink, RefreshCw, AlertCircle, Search } from 'lucide-react';

export const Scout: React.FC = () => {
  const [assignments, setAssignments] = useState<CompetitorAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await API.getAssignments();
      setAssignments(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load assignments. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll for new findings
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: string, action: 'verify' | 'reject') => {
    try {
        await API.verifyAssignment(id, action);
        // Optimistic update
        setAssignments(prev => prev.map(a => 
            a.id === id ? { ...a, status: action === 'verify' ? 'verified' : 'rejected' } : a
        ));
    } catch (e) {
        alert(`Failed to ${action} assignment.`);
    }
  };

  const pendingAssignments = assignments.filter(a => a.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Competitor Scout</h2>
          <p className="text-gray-500 text-sm mt-1">Review AI-discovered communities near Sandlin properties</p>
        </div>
        <button onClick={fetchData} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
        </div>
      )}

      {!loading && !error && assignments.length === 0 ? (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-gray-600 font-medium">No Scout Data</h3>
              <p className="text-gray-400 text-sm mt-1 mb-4">Run the Agent to sync with BDX and scout for nearby competitors.</p>
          </div>
      ) : !loading && !error && pendingAssignments.length === 0 ? (
        <div className="bg-green-50 border border-green-100 rounded-lg p-8 text-center">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6" />
            </div>
            <h3 className="text-green-800 font-medium">All Caught Up!</h3>
            <p className="text-green-600 text-sm mt-1">
                No pending potential competitors found. 
                {assignments.length > 0 && ` You have processed ${assignments.length} total findings.`}
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingAssignments.map(assignment => (
            <div key={assignment.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{assignment.builderName}</h3>
                  <p className="text-sm text-gray-500">Detected: "{assignment.detectedName}"</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold ${
                  assignment.alignmentScore > 80 ? 'bg-green-100 text-green-700' : 
                  assignment.alignmentScore > 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>
                  {assignment.alignmentScore}% Match
                </div>
              </div>

              <div className="bg-gray-50 rounded p-3 text-sm space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{assignment.distanceMiles} miles from <strong>{assignment.sandlinCommunity}</strong></span>
                </div>
                {assignment.url && (
                    <div className="flex items-center gap-2 text-blue-600 hover:underline cursor-pointer">
                        <ExternalLink className="w-4 h-4" />
                        <a href={assignment.url} target="_blank" rel="noreferrer">View Search</a>
                    </div>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => handleAction(assignment.id, 'verify')}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Verify
                </button>
                <button 
                  onClick={() => handleAction(assignment.id, 'reject')}
                  className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};