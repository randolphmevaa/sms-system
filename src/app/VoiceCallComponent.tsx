import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Clock, 
  Settings, 
  Save, 
  RefreshCw, 
  Sparkles, 
  Shield, 
  CheckCircle,
  Headphones,
  Activity,
  TrendingUp,
  Zap,
  ChevronDown,
  // ChevronUp
} from 'lucide-react';

// TypeScript interfaces
interface VoiceCallProps {
  contact: {
    id: number;
    [key: string]: string | number;
  };
  template: string;
  onCallComplete?: (result: CallResult) => void;
}

interface CallResult {
  duration: number;
  status: 'completed' | 'failed' | 'no-answer';
  transcript?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface AssistantSettings {
  firstMessage: string;
  name: string;
}

// Voice Call Component
const VoiceCallComponent: React.FC<VoiceCallProps> = ({ contact, onCallComplete }) => {
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [, setCallId] = useState<string | null>(null);

  // Get phone number from contact
  const getPhoneNumber = () => {
    const phoneFields = ['telephone', 'phone', 'tel', 'mobile'];
    for (const field of phoneFields) {
      if (contact[field]) return String(contact[field]);
    }
    return '';
  };

  // Make phone call
  const makePhoneCall = async () => {
    const phoneNumber = getPhoneNumber();
    if (!phoneNumber) {
      alert('Numéro de téléphone manquant');
      return;
    }

    // Clean and format phone number
    let formattedNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (!formattedNumber.startsWith('+')) {
      if (formattedNumber.startsWith('0')) {
        formattedNumber = '+33' + formattedNumber.substring(1);
      } else {
        formattedNumber = '+33' + formattedNumber;
      }
    }

    setCallStatus('connecting');

    try {
      const response = await fetch('/api/vapi/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedNumber,
          contactName: contact.nom || 'Client'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'appel');
      }

      setCallId(data.callId);
      setCallStatus('active');
      
      // Start duration timer
      const startTime = Date.now();
      const durationInterval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      // Poll for call status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/vapi/call?callId=${data.callId}`);
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            if (statusData.status === 'ended' || statusData.status === 'failed') {
              clearInterval(pollInterval);
              clearInterval(durationInterval);
              setCallStatus('ended');
              
              if (onCallComplete) {
                onCallComplete({
                  duration: statusData.duration || callDuration,
                  status: statusData.status === 'ended' ? 'completed' : 'failed',
                  transcript: statusData.transcript,
                  sentiment: 'neutral'
                });
              }
            }
          }
        } catch (error) {
          console.error('Error polling status:', error);
        }
      }, 3000);

      // Clear intervals after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        clearInterval(durationInterval);
      }, 300000);

    } catch (error) {
      console.error('Failed to make phone call:', error);
      setCallStatus('ended');
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message?: string }).message
        : undefined;
      alert(`Erreur: ${errorMessage || 'Erreur lors de l\'appel'}`);
    }
  };

  // End call
  const endCall = () => {
    setCallStatus('ended');
    // In a real implementation, you would call an API to end the call
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="group relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-3xl p-6 border border-purple-500/20 hover:border-purple-500/30 transition-all duration-300 transform hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="font-bold text-lg text-white">
              {contact.nom || 'Contact'} 
            </div>
            <div className="text-purple-300 font-mono text-sm">
              {getPhoneNumber()}
            </div>
            {callStatus === 'active' && (
              <div className="flex items-center space-x-2 text-sm text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                <Clock size={14} className="animate-pulse" />
                <span className="font-mono font-bold">{formatDuration(callDuration)}</span>
              </div>
            )}
          </div>
          {callStatus === 'connecting' && (
            <div className="text-sm text-yellow-400 mt-2 flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span>Connexion en cours...</span>
            </div>
          )}
          {callStatus === 'active' && (
            <div className="text-sm text-green-400 mt-2 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Appel en cours avec l&apos;assistant IA</span>
            </div>
          )}
          {callStatus === 'ended' && (
            <div className="text-sm text-gray-400 mt-2 flex items-center space-x-2">
              <CheckCircle size={14} />
              <span>Appel terminé</span>
            </div>
          )}
        </div>

        <div>
          {callStatus === 'idle' && (
            <button
              onClick={makePhoneCall}
              className="group/btn relative overflow-hidden flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-2xl font-bold transition-all duration-300 shadow-2xl hover:shadow-green-500/25 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
              <Phone size={20} className="relative z-10" />
              <span className="relative z-10">Appeler</span>
            </button>
          )}
          {(callStatus === 'connecting' || callStatus === 'active') && (
            <button
              onClick={endCall}
              className="group/btn relative overflow-hidden flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-2xl font-bold transition-all duration-300 shadow-2xl hover:shadow-red-500/25 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
              <PhoneOff size={20} className="relative z-10" />
              <span className="relative z-10">Terminer</span>
            </button>
          )}
          {callStatus === 'ended' && (
            <div className="flex items-center space-x-2 text-gray-400 bg-gray-800/50 px-4 py-2 rounded-xl">
              <CheckCircle size={18} />
              <span className="font-medium">Terminé</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Integrated Assistant Settings Component
const AssistantSettingsSection: React.FC = () => {
  const [settings, setSettings] = useState<AssistantSettings>({
    firstMessage: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Load assistant settings
  const loadAssistantSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vapi/call?getAssistant=true');
      if (response.ok) {
        const data = await response.json();
        setSettings({
          firstMessage: data.firstMessage || '',
          name: data.name || ''
        });
      }
    } catch (error) {
      console.error('Error loading assistant settings:', error);
      alert('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  // Save assistant settings
  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/vapi/call', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstMessage: settings.firstMessage,
          name: settings.name
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      alert('Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('Error saving settings:', error);
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message?: string }).message
        : 'Erreur lors de la sauvegarde';
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // Load settings when expanded
  useEffect(() => {
    if (isExpanded && !settings.name && !settings.firstMessage) {
      loadAssistantSettings();
    }
  }, [isExpanded]);

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-3xl border border-purple-500/20 overflow-hidden mb-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-purple-500/20 rounded-2xl backdrop-blur-xl">
            <Settings size={24} className="text-purple-400" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold text-white">Paramètres de l&apos;Assistant IA</h3>
            <p className="text-sm text-gray-400 mt-1">Configurez le nom et le message d&apos;introduction de votre assistant</p>
          </div>
        </div>
        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDown size={24} className="text-purple-400" />
        </div>
      </button>

      {isExpanded && (
        <div className="p-8 border-t border-purple-500/20 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="relative">
                <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                <div className="absolute inset-0 animate-ping w-12 h-12 border-4 border-purple-500/30 rounded-full"></div>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-bold text-purple-300 mb-3 uppercase tracking-wider">
                  Nom de l&apos;Assistant
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="w-full px-5 py-3 bg-black/30 backdrop-blur-xl border border-purple-500/20 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-500"
                  placeholder="Ex: Morgan"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-purple-300 mb-3 uppercase tracking-wider">
                  Message d&apos;Introduction
                </label>
                <textarea
                  value={settings.firstMessage}
                  onChange={(e) => setSettings({ ...settings, firstMessage: e.target.value })}
                  rows={6}
                  className="w-full px-5 py-3 bg-black/30 backdrop-blur-xl border border-purple-500/20 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none text-white placeholder-gray-500"
                  placeholder="Bonjour, c'est Morgan de GrowthPartners..."
                />
                <p className="text-sm text-gray-400 mt-2 flex items-center">
                  <Sparkles size={14} className="mr-2 text-yellow-400" />
                  Ce message sera lu au début de chaque appel
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={loadAssistantSettings}
                  className="group flex items-center space-x-2 px-5 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl transition-all duration-200 text-gray-300 hover:text-white"
                >
                  <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                  <span className="font-medium">Recharger</span>
                </button>

                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-2xl font-bold transition-all duration-300 transform ${
                    saving
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-2xl hover:shadow-purple-500/25 hover:scale-105'
                  }`}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Sauvegarde...</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Sauvegarder les Modifications</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-5 bg-purple-500/10 backdrop-blur-xl rounded-2xl border border-purple-500/20 mt-6">
                <p className="text-sm text-gray-300 flex items-center">
                  <Shield size={16} className="mr-2 text-purple-400" />
                  <strong className="text-purple-300">Note:</strong>
                  <span className="ml-1">Les modifications s&apos;appliqueront aux nouveaux appels uniquement.</span>
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Voice Campaign Section with integrated settings
export const VoiceCampaignSection: React.FC<{
  contacts: Array<{ id: number; [key: string]: string | number }>;
  template: string;
}> = ({ contacts, template }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [callResults, setCallResults] = useState<Map<number, CallResult>>(new Map());

  const handleCallComplete = (contactId: number, result: CallResult) => {
    setCallResults(prev => new Map(prev).set(contactId, result));
  };

  const startCampaign = async () => {
    if (contacts.length === 0 || !template) {
      alert('Veuillez ajouter des contacts et créer un modèle de message');
      return;
    }

    setIsRunning(true);
    
    // Process contacts sequentially
    for (let i = 0; i < contacts.length; i++) {
      setCurrentIndex(i);
      
      // Wait for each call to complete before starting the next
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (callResults.has(contacts[i].id)) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 1000);
        
        // Timeout after 5 minutes per call
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 300000);
      });
      
      // 5 second delay between calls
      if (i < contacts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      {contacts.length === 0 ? (
        <div className="text-center py-24">
          <div className="relative inline-block mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mb-6 mx-auto backdrop-blur-xl border border-white/10">
              <Phone className="h-16 w-16 text-purple-400" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/25">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-white mb-4">Assistant Vocal IA en Attente</h3>
          <p className="text-gray-400 max-w-md mx-auto text-lg">
            Importez des contacts pour débloquer la puissance de l&apos;assistant vocal propulsé par l&apos;IA
          </p>
        </div>
      ) : (
        <>
          {/* Assistant Settings Section */}
          <AssistantSettingsSection />

          {/* Campaign Header */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-3xl border border-purple-500/20 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />
            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 space-y-4 lg:space-y-0">
                <div>
                  <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2 flex items-center space-x-3">
                    <div className="p-3 bg-purple-500/20 rounded-2xl backdrop-blur-xl">
                      <Phone size={32} className="text-purple-400" />
                    </div>
                    <span>Campagne d&apos;Appels Vocaux</span>
                  </h3>
                  <p className="text-gray-300 text-lg flex items-center space-x-2 ml-16">
                    <Sparkles size={16} className="text-yellow-400 animate-pulse" />
                    <span>{contacts.length} contacts prêts à être appelés par l&apos;IA</span>
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Stats Cards */}
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-2xl p-5 border border-green-500/20 min-w-[120px] transform hover:scale-105 transition-transform duration-200">
                      <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">{callResults.size}</div>
                      <div className="text-xs text-green-300 font-medium mt-1 uppercase tracking-wider">Complétés</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-2xl p-5 border border-blue-500/20 min-w-[120px] transform hover:scale-105 transition-transform duration-200">
                      <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center">
                        <TrendingUp size={24} className="mr-1" />
                        {callResults.size > 0 
                          ? Math.round(Array.from(callResults.values()).filter(r => r.status === 'completed').length / callResults.size * 100)
                          : 0}%
                      </div>
                      <div className="text-xs text-blue-300 font-medium mt-1 uppercase tracking-wider">Succès</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {isRunning && (
                <div className="mb-8">
                  <div className="flex justify-between text-sm text-purple-300 mb-3">
                    <span className="font-medium flex items-center space-x-2">
                      <Activity size={16} className="animate-pulse" />
                      <span>Progression de la campagne</span>
                    </span>
                    <span className="font-black text-white">{currentIndex + 1} / {contacts.length}</span>
                  </div>
                  <div className="relative w-full bg-black/30 backdrop-blur-xl rounded-full h-4 overflow-hidden border border-white/10">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out shadow-lg shadow-purple-500/50"
                      style={{ width: `${((currentIndex + 1) / contacts.length) * 100}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                  </div>
                </div>
              )}

              {/* Launch Button */}
              <button
                onClick={startCampaign}
                disabled={contacts.length === 0 || !template || isRunning}
                className={`group relative w-full overflow-hidden flex items-center justify-center space-x-4 py-6 px-10 rounded-3xl font-black text-xl transition-all duration-500 transform ${
                  contacts.length === 0 || !template || isRunning
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-2xl hover:shadow-purple-500/50 hover:scale-105'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {isRunning ? (
                  <>
                    <div className="relative z-10 animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
                    <span className="relative z-10">Campagne d&apos;appels en cours...</span>
                    <TrendingUp size={24} className="relative z-10 animate-pulse" />
                  </>
                ) : (
                  <>
                    <Zap size={28} className="relative z-10 group-hover:animate-pulse" />
                    <span className="relative z-10">Lancer la Campagne Vocale</span>
                    <Phone size={24} className="relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Individual Calls */}
          <div className="space-y-4 mt-8">
            <h4 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
              <Headphones size={24} className="text-purple-400" />
              <span>File d&apos;Appels Active</span>
              {isRunning && (
                <span className="text-sm text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 animate-pulse">
                  En cours
                </span>
              )}
            </h4>
            {contacts.map(contact => (
              <VoiceCallComponent
                key={contact.id}
                contact={contact}
                template={template}
                onCallComplete={(result) => handleCallComplete(contact.id, result)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default VoiceCampaignSection;