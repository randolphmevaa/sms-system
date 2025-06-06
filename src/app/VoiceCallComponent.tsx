import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Activity, Clock } from 'lucide-react';

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

interface VapiMessage {
  type: string;
  value?: boolean;
}

interface VapiConfig {
  assistant: {
    firstMessage: string;
    model: {
      provider: string;
      model: string;
      temperature: number;
    };
    voice: {
      provider: string;
      voiceId: string;
      language: string;
    };
    transcriber: {
      provider: string;
      model: string;
      language: string;
    };
  };
  phoneNumber: string;
  customer: {
    name: string;
  };
}

interface TranscriptData {
  text: string;
  speaker: string;
}

type VapiEventCallback = () => void;
type VapiTranscriptCallback = (data: TranscriptData) => void;
type VapiAudioLevelCallback = (level: number) => void;
type VapiErrorCallback = (error: Error) => void;

interface VapiCall {
  start: () => Promise<void>;
  stop: () => void;
  send: (message: VapiMessage) => void;
  on: {
    (event: 'call-start' | 'call-end', callback: VapiEventCallback): void;
    (event: 'transcript', callback: VapiTranscriptCallback): void;
    (event: 'audio-level', callback: VapiAudioLevelCallback): void;
    (event: 'error', callback: VapiErrorCallback): void;
  };
}

// Mock Vapi for demonstration - replace with actual Vapi SDK
const mockVapi = {
  createCall: (config: VapiConfig): VapiCall => ({
    start: async () => console.log('Starting call with config:', config),
    stop: () => console.log('Stopping call'),
    send: (message: VapiMessage) => console.log('Sending message:', message),
    on: ((event: string, callback: VapiEventCallback | VapiTranscriptCallback | VapiAudioLevelCallback | VapiErrorCallback) => {
      console.log('Registered event:', event);
      // Simulate events for demo
      if (event === 'call-start') setTimeout(() => (callback as VapiEventCallback)(), 1000);
      if (event === 'transcript') {
        setTimeout(() => (callback as VapiTranscriptCallback)({ 
          text: "Bonjour, je suis votre assistant AI. Comment puis-je vous aider?",
          speaker: 'assistant'
        }), 2000);
      }
    }) as VapiCall['on']
  })
};

const VoiceCallComponent: React.FC<VoiceCallProps> = ({ contact, template, onCallComplete }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<Array<{text: string, speaker: string}>>([]);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle');
  const [currentCall, setCurrentCall] = useState<VapiCall | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Get phone number from contact
  const getPhoneNumber = () => {
    const phoneFields = ['telephone', 'phone', 'tel', 'mobile'];
    for (const field of phoneFields) {
      if (contact[field]) return String(contact[field]);
    }
    return '';
  };

  // Generate personalized script from template
  const generateScript = () => {
    let script = template;
    Object.keys(contact).forEach(key => {
      if (key !== 'id') {
        const regex = new RegExp(`{${key}}`, 'g');
        script = script.replace(regex, String(contact[key]) || '');
      }
    });
    return script;
  };

  // Start voice call
  const startCall = async () => {
    const phoneNumber = getPhoneNumber();
    if (!phoneNumber) {
      alert('Numéro de téléphone manquant');
      return;
    }

    setCallStatus('connecting');
    
    try {
      // In production, use actual Vapi SDK
      // import Vapi from '@vapi-ai/web';
      // const vapi = new Vapi('YOUR_PUBLIC_KEY');
      
      const call = mockVapi.createCall({
        assistant: {
          firstMessage: generateScript(),
          model: {
            provider: 'openai',
            model: 'gpt-4',
            temperature: 0.7,
          },
          voice: {
            provider: 'elevenlabs',
            voiceId: 'rachel', // Professional French voice
            language: 'fr-FR',
          },
          transcriber: {
            provider: 'deepgram',
            model: 'nova-2',
            language: 'fr',
          }
        },
        phoneNumber: phoneNumber,
        customer: {
          name: contact.nom as string || 'Client',
        }
      });

      // Set up event listeners
      call.on('call-start', () => {
        setIsCallActive(true);
        setCallStatus('active');
        console.log('Call started');
      });

      call.on('call-end', () => {
        setIsCallActive(false);
        setCallStatus('ended');
        if (onCallComplete) {
          onCallComplete({
            duration: callDuration,
            status: 'completed',
            transcript: transcript.map(t => t.text).join(' '),
            sentiment: 'positive' // Would be analyzed by AI
          });
        }
      });

      call.on('transcript', (data: TranscriptData) => {
        setTranscript(prev => [...prev, data]);
      });

      call.on('audio-level', (level: number) => {
        setAudioLevel(level);
      });

      call.on('error', (error: Error) => {
        console.error('Call error:', error);
        setCallStatus('ended');
        setIsCallActive(false);
      });

      await call.start();
      setCurrentCall(call);
      
    } catch (error) {
      console.error('Failed to start call:', error);
      setCallStatus('ended');
      alert('Erreur lors du démarrage de l&apos;appel');
    }
  };

  // End call
  const endCall = () => {
    if (currentCall) {
      currentCall.stop();
      setCurrentCall(null);
    }
    setIsCallActive(false);
    setCallStatus('ended');
  };

  // Toggle mute
  const toggleMute = () => {
    if (currentCall) {
      currentCall.send({ type: 'mute', value: !isMuted });
      setIsMuted(!isMuted);
    }
  };

  // Update call duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Appel Vocal AI</h3>
          <p className="text-gray-600 text-sm">
            {contact.nom || 'Contact'} - {getPhoneNumber()}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          callStatus === 'active' ? 'bg-green-100 text-green-800' :
          callStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
          callStatus === 'ended' ? 'bg-gray-100 text-gray-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {callStatus === 'active' ? 'En cours' :
           callStatus === 'connecting' ? 'Connexion...' :
           callStatus === 'ended' ? 'Terminé' :
           'Prêt'}
        </div>
      </div>

      {/* Call Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        {!isCallActive ? (
          <button
            onClick={startCall}
            className="flex items-center space-x-3 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Phone size={24} />
            <span>Démarrer l&apos;appel</span>
          </button>
        ) : (
          <>
            <button
              onClick={toggleMute}
              className={`p-4 rounded-xl transition-all duration-200 ${
                isMuted 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <button
              onClick={endCall}
              className="flex items-center space-x-3 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <PhoneOff size={24} />
              <span>Terminer</span>
            </button>
          </>
        )}
      </div>

      {/* Call Stats */}
      {isCallActive && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <Clock size={20} className="text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{formatDuration(callDuration)}</div>
            <div className="text-sm text-gray-600">Durée</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <Activity size={20} className="text-green-600 mx-auto mb-2" />
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-4">
              <div 
                className="h-full bg-green-500 transition-all duration-100"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
            <div className="text-sm text-gray-600 mt-2">Niveau audio</div>
          </div>
        </div>
      )}

      {/* Transcript */}
      {transcript.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
            <Activity size={16} />
            <span>Transcription en direct</span>
          </h4>
          <div className="space-y-2">
            {transcript.map((entry, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg ${
                  entry.speaker === 'assistant' 
                    ? 'bg-blue-100 text-blue-800 ml-8' 
                    : 'bg-white text-gray-800 mr-8'
                }`}
              >
                <div className="text-xs font-medium mb-1">
                  {entry.speaker === 'assistant' ? '🤖 Assistant' : '👤 Client'}
                </div>
                <div className="text-sm">{entry.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Script Preview */}
      {!isCallActive && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">Script personnalisé :</h4>
          <p className="text-sm text-blue-700">{generateScript()}</p>
        </div>
      )}
    </div>
  );
};

// Integration Example for the Campaign Tab
export const VoiceCampaignSection: React.FC<{
  contacts: Array<{ id: number; [key: string]: string | number }>;
  template: string;
}> = ({ contacts, template }) => {
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [callResults, setCallResults] = useState<Map<number, CallResult>>(new Map());
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleCallComplete = (contactId: number, result: CallResult) => {
    setCallResults(prev => new Map(prev).set(contactId, result));
  };

  const handleSelectContact = (contactId: number) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const startVoiceCampaign = async () => {
    setIsRunning(true);
    const selected = selectedContacts.length > 0 ? selectedContacts : contacts.map(c => c.id);
    
    for (let i = 0; i < selected.length; i++) {
      setCurrentIndex(i);
      // Process each call sequentially or in parallel based on your needs
      // await processCall(selected[i]);
    }
    
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-3">
          <Phone className="text-blue-600" />
          <span>Campagne d&apos;Appels Vocaux AI</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{contacts.length}</div>
            <div className="text-gray-600">Contacts disponibles</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{callResults.size}</div>
            <div className="text-gray-600">Appels complétés</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {callResults.size > 0 
                ? Math.round(Array.from(callResults.values()).filter(r => r.status === 'completed').length / callResults.size * 100)
                : 0}%
            </div>
            <div className="text-gray-600">Taux de succès</div>
          </div>
        </div>

        <button
          onClick={startVoiceCampaign}
          disabled={contacts.length === 0 || !template || isRunning}
          className={`w-full flex items-center justify-center space-x-3 py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-300 ${
            contacts.length === 0 || !template || isRunning
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {isRunning ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Campagne en cours... ({currentIndex + 1}/{selectedContacts.length || contacts.length})</span>
            </>
          ) : (
            <>
              <Phone size={24} />
              <span>Lancer la Campagne Vocale</span>
            </>
          )}
        </button>
      </div>

      {/* Contact Selection */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3">Sélectionner les contacts :</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {contacts.map(contact => (
            <label key={contact.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={selectedContacts.includes(contact.id)}
                onChange={() => handleSelectContact(contact.id)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {contact.nom || `Contact ${contact.id}`} - {contact.telephone || contact.phone || 'N/A'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Individual Call Controls */}
      {contacts.slice(0, 3).map(contact => (
        <VoiceCallComponent
          key={contact.id}
          contact={contact}
          template={template}
          onCallComplete={(result) => handleCallComplete(contact.id, result)}
        />
      ))}
    </div>
  );
};

export default VoiceCallComponent;