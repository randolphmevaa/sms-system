import React, { useState } from 'react';
import { Phone, PhoneOff, Clock } from 'lucide-react';

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

const VoiceCallComponent: React.FC<VoiceCallProps> = ({ contact, onCallComplete }) => {
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [ , setCallId] = useState<string | null>(null);

  // Get phone number from contact
  const getPhoneNumber = () => {
    const phoneFields = ['telephone', 'phone', 'tel', 'mobile'];
    for (const field of phoneFields) {
      if (contact[field]) return String(contact[field]);
    }
    return '';
  };

  // Generate personalized script from template
  // const generateScript = () => {
  //   let script = template;
  //   Object.keys(contact).forEach(key => {
  //     if (key !== 'id') {
  //       const regex = new RegExp(`{${key}}`, 'g');
  //       script = script.replace(regex, String(contact[key]) || '');
  //     }
  //   });
  //   return script;
  // };

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="font-medium text-gray-900">
              {contact.nom || 'Contact'} - {getPhoneNumber()}
            </div>
            {callStatus === 'active' && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock size={14} />
                <span className="font-mono">{formatDuration(callDuration)}</span>
              </div>
            )}
          </div>
          {callStatus === 'connecting' && (
            <div className="text-sm text-yellow-600 mt-1">Connexion en cours...</div>
          )}
          {callStatus === 'active' && (
            <div className="text-sm text-green-600 mt-1">Appel en cours</div>
          )}
          {callStatus === 'ended' && (
            <div className="text-sm text-gray-500 mt-1">Appel terminé</div>
          )}
        </div>

        <div>
          {callStatus === 'idle' && (
            <button
              onClick={makePhoneCall}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Phone size={18} />
              <span>Appeler</span>
            </button>
          )}
          {(callStatus === 'connecting' || callStatus === 'active') && (
            <button
              onClick={endCall}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <PhoneOff size={18} />
              <span>Terminer</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Simplified Voice Campaign Section
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
      {/* Campaign Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Campagne d&apos;Appels Vocaux</h3>
            <p className="text-gray-600 text-sm mt-1">
              {contacts.length} contacts à appeler
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{callResults.size}</div>
              <div className="text-xs text-gray-500">Complétés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {callResults.size > 0 
                  ? Math.round(Array.from(callResults.values()).filter(r => r.status === 'completed').length / callResults.size * 100)
                  : 0}%
              </div>
              <div className="text-xs text-gray-500">Succès</div>
            </div>
          </div>
        </div>

        {/* Progress */}
        {isRunning && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progression</span>
              <span>{currentIndex + 1} / {contacts.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / contacts.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Launch Button */}
        <button
          onClick={startCampaign}
          disabled={contacts.length === 0 || !template || isRunning}
          className={`w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-lg font-medium transition-colors ${
            contacts.length === 0 || !template || isRunning
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isRunning ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Campagne en cours...</span>
            </>
          ) : (
            <>
              <Phone size={20} />
              <span>Lancer la Campagne</span>
            </>
          )}
        </button>
      </div>

      {/* Individual Calls */}
      <div className="space-y-3">
        {contacts.map(contact => (
          <VoiceCallComponent
            key={contact.id}
            contact={contact}
            template={template}
            onCallComplete={(result) => handleCallComplete(contact.id, result)}
          />
        ))}
      </div>
    </div>
  );
};

export default VoiceCampaignSection;