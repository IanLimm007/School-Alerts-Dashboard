import { useState, useEffect } from 'react';
import { Mail, MessageSquare, Check, Database, Edit2, X, Save, MapPin, AlertTriangle, Flame, Cloud, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { QuickActionLog } from '../types';

type EmergencyType = 'Natural Disaster' | 'Fire' | 'Threat';

export function QuickActions() {
  const { triggerQuickAction, quickActionLogs, updateQuickActionLog } = useApp();
  const [feedback, setFeedback] = useState<{ button: '1' | '2'; actions: string[] } | null>(null);
  const [editingLog, setEditingLog] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; description: string; location: string }>({
    title: '',
    description: '',
    location: '',
  });

  // Emergency confirmation flow
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationTimer, setConfirmationTimer] = useState(5);
  const [showCategorySelection, setShowCategorySelection] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (editingLog || showConfirmation || showCategorySelection) return; // Don't trigger if editing or in confirmation
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '1') {
        handleEmergencyClick();
      } else if (e.key === '2') {
        handleAction('2');
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [editingLog, showConfirmation, showCategorySelection]);

  // Countdown timer for emergency confirmation
  useEffect(() => {
    if (showConfirmation && confirmationTimer > 0) {
      const timer = setTimeout(() => {
        setConfirmationTimer(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showConfirmation, confirmationTimer]);

  const handleEmergencyClick = () => {
    setShowConfirmation(true);
    setConfirmationTimer(5);
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setConfirmationTimer(5);
  };

  const handleConfirmEmergency = () => {
    setShowConfirmation(false);
    setShowCategorySelection(true);
  };

  const handleCategorySelect = (category: EmergencyType) => {
    const actions = ['Email', 'SMS', 'Record'];
    triggerQuickAction('1', category);
    
    setShowCategorySelection(false);
    setFeedback({ button: '1', actions });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCancelCategory = () => {
    setShowCategorySelection(false);
  };

  const handleAction = (button: '2') => {
    const actions = ['Email', 'Record'];
    triggerQuickAction(button);
    
    setFeedback({ button, actions });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleEditLog = (log: QuickActionLog) => {
    setEditingLog(log.id);
    setEditForm({
      title: log.title || '',
      description: log.description || '',
      location: log.location || '',
    });
  };

  const handleSaveEdit = () => {
    if (!editingLog) return;
    updateQuickActionLog(editingLog, editForm);
    setEditingLog(null);
    setEditForm({ title: '', description: '', location: '' });
  };

  const handleCancelEdit = () => {
    setEditingLog(null);
    setEditForm({ title: '', description: '', location: '' });
  };

  const getCategoryIcon = (category: EmergencyType) => {
    switch (category) {
      case 'Fire':
        return Flame;
      case 'Natural Disaster':
        return Cloud;
      case 'Threat':
        return Shield;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-gray-900 mb-1">Quick Actions</h2>
        <p className="text-xs text-gray-500">Press keyboard key or click button to trigger notifications</p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleEmergencyClick}
          className="bg-red-50 border-2 border-red-300 rounded-xl p-6 hover:border-red-500 hover:bg-red-100 transition-all group relative"
        >
          <div className="absolute top-2 right-2">
            <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
              EMERGENCY
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-4xl font-bold text-red-700 group-hover:text-red-800">1</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-red-700">
              <Mail className="size-3" />
              <span>Send Email</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-red-700">
              <MessageSquare className="size-3" />
              <span>Send SMS</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-red-700">
              <Database className="size-3" />
              <span>Create Record</span>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleAction('2')}
          className="bg-white border-2 border-gray-300 rounded-xl p-6 hover:border-green-500 hover:bg-green-50 transition-all group"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-4xl font-bold text-gray-700 group-hover:text-green-600">2</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Mail className="size-3" />
              <span>Send Email</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Database className="size-3" />
              <span>Create Record</span>
            </div>
          </div>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 animate-fade-in">
          <div className="flex items-start gap-2">
            <Check className="size-4 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-900" style={{ fontWeight: 600 }}>
                Action {feedback.button} triggered successfully
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                {feedback.actions.join(' + ')} completed
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Log */}
      <div>
        <h3 className="text-gray-900 mb-2">Action Log</h3>
        {quickActionLogs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <p className="text-xs text-gray-500">No actions recorded yet</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
            {quickActionLogs.slice(0, 10).map((log) => {
              const CategoryIcon = log.emergencyType ? getCategoryIcon(log.emergencyType) : null;
              return (
                <div key={log.id}>
                  <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`size-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                          log.button === '1' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`} style={{ fontWeight: 600 }}>
                          {log.button}
                        </div>
                        <div className="flex-1 min-w-0">
                          {log.emergencyType && (
                            <div className="flex items-center gap-1.5 mb-1">
                              {CategoryIcon && <CategoryIcon className="size-3 text-red-600" />}
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded" style={{ fontWeight: 600 }}>
                                {log.emergencyType}
                              </span>
                            </div>
                          )}
                          {log.title || log.description || log.location ? (
                            <div className="mb-1">
                              {log.title && (
                                <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{log.title}</p>
                              )}
                              {log.description && (
                                <p className="text-xs text-gray-600 mt-0.5">{log.description}</p>
                              )}
                              {log.location && (
                                <div className="flex items-center gap-1 mt-1">
                                  <MapPin className="size-3 text-gray-400" />
                                  <p className="text-xs text-gray-500">{log.location}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic mb-1">No details added</p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs text-gray-400">{log.actions.join(' + ')}</p>
                            <span className="text-xs text-gray-300">•</span>
                            <p className="text-xs text-gray-400">{log.timestamp}</p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEditLog(log)}
                        className="shrink-0 p-1.5 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Edit2 className="size-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Emergency Confirmation Modal */}
      {showConfirmation && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-40 z-40" />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white border-2 border-red-500 rounded-xl p-6 max-w-md w-full shadow-xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="size-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>Emergency Alert Confirmation</h4>
                  <p className="text-sm text-gray-600">
                    You are about to trigger an emergency alert. This will send immediate notifications via Email and SMS.
                  </p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">
                  Are you sure you want to proceed?
                </p>
              </div>
              
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={handleCancelConfirmation}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmEmergency}
                  disabled={confirmationTimer > 0}
                  className={`px-4 py-2 text-sm rounded-lg transition-all ${
                    confirmationTimer > 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {confirmationTimer > 0 ? `Yes (${confirmationTimer}s)` : 'Yes'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Category Selection Modal */}
      {showCategorySelection && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-40 z-40" />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-gray-900" style={{ fontWeight: 600 }}>Select Emergency Type</h4>
                <button
                  onClick={handleCancelCategory}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="size-4 text-gray-400" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Choose the category that best describes this emergency:
              </p>
              
              <div className="space-y-2">
                <button
                  onClick={() => handleCategorySelect('Natural Disaster')}
                  className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200">
                    <Cloud className="size-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>Natural Disaster</p>
                    <p className="text-xs text-gray-500">Earthquake, flood, severe weather</p>
                  </div>
                </button>

                <button
                  onClick={() => handleCategorySelect('Fire')}
                  className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group"
                >
                  <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200">
                    <Flame className="size-5 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>Fire</p>
                    <p className="text-xs text-gray-500">Fire emergency or smoke detected</p>
                  </div>
                </button>

                <button
                  onClick={() => handleCategorySelect('Threat')}
                  className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group"
                >
                  <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200">
                    <Shield className="size-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>Threat</p>
                    <p className="text-xs text-gray-500">Security threat or lockdown</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editingLog && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={handleCancelEdit}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-gray-900">Add Details to Record</h4>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="size-4 text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-600 mb-1.5 block">Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Student injury in playground"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="text-xs text-gray-600 mb-1.5 block">Description</label>
                  <textarea
                    placeholder="Add details about what happened..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="text-xs text-gray-600 mb-1.5 block">Location</label>
                  <input
                    type="text"
                    placeholder="e.g., Main playground"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="size-4" />
                  Save Details
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
