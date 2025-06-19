'use client';

import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  MessageSquare, 
  Users, 
  Send, 
  Eye, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Plus,
  Trash2,
  Edit3,
  BarChart3,
  Sparkles,
  Zap,
  Target,
  Clock,
  TrendingUp,
  Settings,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Activity
} from 'lucide-react';

// TypeScript interfaces
interface Contact {
  id: number;
  [key: string]: string | number;
}

interface CampaignResults {
  sent: number;
  failed: number;
  total: number;
  errors: Array<{ contact: string; error: string }>;
}

interface CallResult {
  duration: number;
  status: 'completed' | 'failed' | 'no-answer';
  transcript?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

type CampaignStatus = 'idle' | 'running' | 'paused' | 'completed';
type TabType = 'contacts' | 'template' | 'preview' | 'campaign' | 'results' | 'voice';

interface TabButtonProps {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isActive: boolean;
  onClick: (id: TabType) => void;
  badge?: number;
  description?: string;
}

interface VoiceCallProps {
  contact: Contact;
  template: string;
  onCallComplete?: (result: CallResult) => void;
}

interface VoiceCampaignState {
  status: 'idle' | 'running' | 'paused' | 'completed';
  currentIndex: number;
  results: Map<number, CallResult>;
}

// Validation utilities
const BLOCKED_EXPEDITEUR_TERMS = [
  'BNP', 'NICKEL', 'ALERT', 'ALERTE', 'URGENT', 'BANQUE', 'BANK',
  'CIC', 'LCL', 'BNPP', 'HSBC', 'CREDIT', 'SOCIETE', 'CAISSE',
  'BRED', 'BOURSORAMA', 'FORTUNEO', 'REVOLUT', 'N26', 'ORANGE',
  'PAYPAL', 'LYDIA', 'PAYLIB'
];

const BLOCKED_MESSAGE_TERMS = [
  'paiement', 'payment', 'euro', 'euros', 'argent', 'money',
  'virement', 'carte', 'card', 'credit', 'debit', 'compte',
  'account', 'solde', 'balance', 'remboursement', 'refund',
  'frais', 'fees', 'taxe', 'tax', 'facture', 'invoice',
  'acheter', 'buy', 'payer', 'pay', 'prix', 'price',
  'gratuit', 'free', 'offre', 'offer', 'promo', 'reduction',
  'cash', 'espece', 'cheque', 'bitcoin', 'crypto',
  'casino', 'montant', 'gain', 'gagner', 'jackpot', 'mise',
  'pari', 'parier', 'jeu', 'jouer', 'loterie', 'loto'
];

const MONEY_SYMBOLS = ['€', '$', '£', '¥', '₹', '₽', '¢', '₿'];

// Validation functions
const validateExpediteur = (value: string): string => {
  // Remove any non-alphanumeric characters
  let cleaned = value.replace(/[^a-zA-Z0-9 ]/g, '');
  
  // Limit to 11 characters
  cleaned = cleaned.slice(0, 11);
  
  // Check against blocked terms
  const upperCleaned = cleaned.toUpperCase();
  for (const blocked of BLOCKED_EXPEDITEUR_TERMS) {
    if (upperCleaned.includes(blocked)) {
      // Remove the blocked term
      const regex = new RegExp(blocked, 'gi');
      cleaned = cleaned.replace(regex, '');
    }
  }
  
  return cleaned;
};

const validateMessageTemplate = (value: string): string => {
  // Limit to 160 characters first
  let cleaned = value.slice(0, 160);
  
  // Only process if there's actual content to check
  if (cleaned.length === 0) return cleaned;
  
  // URLs are now ALLOWED - no URL removal
  
  // REMOVED: Phone number blocking - now allows phone numbers in messages
  // This change allows you to include callback numbers or contact information
  
  // Remove money symbols - only if found
  const hasMoneySymbol = MONEY_SYMBOLS.some(symbol => cleaned.includes(symbol));
  if (hasMoneySymbol) {
    MONEY_SYMBOLS.forEach(symbol => {
      if (cleaned.includes(symbol)) {
        cleaned = cleaned.replace(new RegExp(`\\${symbol}`, 'g'), '');
      }
    });
  }
  
  // Check for blocked payment terms - only process if potentially found
  const lowerCleaned = cleaned.toLowerCase();
  const hasBlockedTerms = BLOCKED_MESSAGE_TERMS.some(term => 
    lowerCleaned.includes(term.toLowerCase())
  );
  
  if (hasBlockedTerms) {
    for (const blocked of BLOCKED_MESSAGE_TERMS) {
      if (lowerCleaned.includes(blocked.toLowerCase())) {
        // Use a more careful regex that preserves spaces
        const regex = new RegExp(`(^|\\s)${blocked}(\\s|$)`, 'gi');
        cleaned = cleaned.replace(regex, '$1$2');
      }
    }
    // Only clean up multiple spaces if we actually removed something
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
  }
  
  // Don't trim unless necessary - preserve user's spaces
  if (cleaned.startsWith(' ') || cleaned.endsWith(' ')) {
    // Only trim if there are multiple spaces at start/end
    if (cleaned.match(/^\s{2,}/) || cleaned.match(/\s{2,}$/)) {
      cleaned = cleaned.trim();
    }
  }
  
  return cleaned;
};

// VAPI API Response Types
// interface VAPICallResponse {
//   id: string;
//   status: 'queued' | 'ringing' | 'in-progress' | 'ended';
//   endedReason?: 'hangup' | 'error' | 'timeout' | 'other';
//   duration?: number;
//   transcript?: Array<{
//     role: 'system' | 'assistant' | 'user';
//     content: string;
//   }>;
// }

interface VAPITranscriptMessage {
  role: 'system' | 'assistant' | 'user';
  content: string;
}

declare global {
  interface Window {
    vapiPollInterval?: NodeJS.Timeout;
    fs: {
      readFile: (filename: string, options?: { encoding?: string }) => Promise<Uint8Array | string>;
    };
  }
}

// Voice Call Component with Real VAPI
const VoiceCallComponent: React.FC<VoiceCallProps> = ({ contact, template, onCallComplete }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<Array<{text: string, speaker: string}>>([]);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle');
  const [audioLevel ] = useState(0);

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

  // Simple sentiment analysis
  const analyzeSentiment = (transcript: Array<{text: string, speaker: string}>): 'positive' | 'neutral' | 'negative' => {
    const userMessages = transcript.filter(t => t.speaker === 'user').map(t => t.text).join(' ').toLowerCase();
    
    const positiveWords = ['oui', 'bien', 'parfait', 'merci', 'd\'accord', 'super', 'excellent'];
    const negativeWords = ['non', 'pas', 'jamais', 'problème', 'difficile', 'mauvais'];
    
    const positiveCount = positiveWords.filter(word => userMessages.includes(word)).length;
    const negativeCount = negativeWords.filter(word => userMessages.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };

  // Start voice call with real VAPI phone calling
  const startCall = async () => {
    const phoneNumber = getPhoneNumber();
    if (!phoneNumber) {
      alert('Numéro de téléphone manquant');
      return;
    }

    setCallStatus('connecting');
    
    try {
      // Make an actual phone call using VAPI
      const response = await fetch('https://api.vapi.ai/call/phone', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID, // You'll need to create an assistant in VAPI dashboard
          // OR use inline assistant configuration:
          assistant: {
            transcriber: {
              provider: 'deepgram',
              model: 'nova-2',
              language: 'fr',
            },
            model: {
              provider: 'openai',
              model: 'gpt-4',
              messages: [
                {
                  role: 'system',
                  content: `You are a professional assistant making calls in French. Here's your script: ${generateScript()}. Be polite, professional, and helpful. Adapt naturally to the conversation while keeping the main message.`
                }
              ],
              temperature: 0.7,
            },
            voice: {
              provider: '11labs',
              voiceId: 'rachel',
              stability: 0.5,
              similarityBoost: 0.75,
            },
            firstMessage: generateScript(),
          },
          // Phone number configuration
          phoneNumberId: process.env.NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID, // Your VAPI phone number ID
          customer: {
            number: phoneNumber,
            name: contact.nom || 'Client',
          },
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to start call');
      }

      console.log('Call initiated:', data);
      setIsCallActive(true);
      setCallStatus('active');
      
      // Store the call ID for tracking
      const callId = data.id;
      
      // Poll for call status updates
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`https://api.vapi.ai/call/${callId}`, {
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_VAPI_API_KEY}`,
            },
          });
          
          const callData = await statusResponse.json();
          console.log('Call status:', callData);
          
          // Update transcript if available
          if (callData.transcript) {
            const messages = callData.transcript.filter((msg: VAPITranscriptMessage) => msg.role !== 'system');
            setTranscript(messages.map((msg: VAPITranscriptMessage) => ({
              text: msg.content,
              speaker: msg.role === 'assistant' ? 'assistant' : 'user'
            })));
          }
          
          // Check if call ended
          if (callData.status === 'ended' || callData.endedReason) {
            clearInterval(pollInterval);
            setIsCallActive(false);
            setCallStatus('ended');
            
            if (onCallComplete) {
              onCallComplete({
                duration: callData.duration || callDuration,
                status: callData.endedReason === 'hangup' ? 'completed' : 'failed',
                transcript: callData.transcript?.map((t: VAPITranscriptMessage) => t.content).join(' ') || '',
                sentiment: analyzeSentiment(transcript),
              });
            }
          }
          
          // Update duration
          if (callData.duration) {
            setCallDuration(Math.floor(callData.duration / 1000));
          }
        } catch (error) {
          console.error('Error polling call status:', error);
        }
      }, 2000); // Poll every 2 seconds
      
      // Store interval ID for cleanup
      window.vapiPollInterval = pollInterval;

      
    } catch (error) {
      console.error('Failed to start call:', error);
      setCallStatus('ended');
      setIsCallActive(false);
      alert(`Erreur lors du démarrage de l'appel: ${(error as Error).message}`);
    }
  };

  // End call
  const endCall = async () => {
    // Clear polling interval
    if (window.vapiPollInterval) {
      clearInterval(window.vapiPollInterval);
    }
    
    // Note: VAPI doesn't provide a direct way to end calls via API
    // The call will end naturally when the user hangs up
    setIsCallActive(false);
    setCallStatus('ended');
  };

  // Toggle mute
  const toggleMute = () => {
    // Note: Muting is not available for phone calls via API
    // This would need to be handled on the phone system side
    if (isCallActive) {
      setIsMuted(!isMuted);
      alert('Le contrôle du micro n\'est pas disponible pour les appels téléphoniques');
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.vapiPollInterval) {
        clearInterval(window.vapiPollInterval);
      }
    };
  }, []);

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

// Main SMS Campaign System Component
const SMSCampaignSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [template, setTemplate] = useState<string>('');
  const [sender] = useState<string>('EFFY PART'); // Fixed sender value
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [results, setResults] = useState<CampaignResults>({ sent: 0, failed: 0, total: 0, errors: [] });
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [voiceCallResults, setVoiceCallResults] = useState<Map<number, CallResult>>(new Map());
  const [voiceCampaign, setVoiceCampaign] = useState<VoiceCampaignState>({
    status: 'idle',
    currentIndex: 0,
    results: new Map()
  });
  const [callDelay, setCallDelay] = useState<number>(5);
  const [templateError, setTemplateError] = useState<string>('');

  // Handle Template change with validation
  const handleTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawValue = e.target.value;
    const validatedValue = validateMessageTemplate(rawValue);
    
    setTemplate(validatedValue);
    
    // Set error message if validation removed content
    if (rawValue !== validatedValue && rawValue.length > 0) {
      const lowerValue = rawValue.toLowerCase();
      
      // URLs are now allowed - removed URL error
      if (MONEY_SYMBOLS.some(symbol => rawValue.includes(symbol))) {
        setTemplateError('Les symboles monétaires ne sont pas autorisés');
      } else if (BLOCKED_MESSAGE_TERMS.some(term => lowerValue.includes(term.toLowerCase()))) {
        setTemplateError('Termes interdits détectés (paiement, casino, montant, etc.)');
      } else if (rawValue.length > 160) {
        setTemplateError('Maximum 160 caractères');
      }
      
      // Clear error after 3 seconds
      setTimeout(() => setTemplateError(''), 3000);
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const text = await file.text();
      
      // Parse CSV manually to handle different formats
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('Le fichier CSV doit contenir au moins un en-tête et une ligne de données');
      }

      // Get headers from first line
      const headers = lines[0].split(',').map(header => 
        header.trim().replace(/"/g, '').toLowerCase()
      );
      
      // Parse data lines
      const contactsData: Contact[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(value => value.trim().replace(/"/g, ''));
        if (values.length === headers.length) {
          const contact: Contact = { id: Date.now() + i };
          headers.forEach((header, index) => {
            contact[header] = values[index] || '';
          });
          contactsData.push(contact);
        }
      }

      if (contactsData.length === 0) {
        throw new Error('Aucune donnée valide trouvée dans le fichier CSV');
      }

      setCsvHeaders(headers);
      setContacts(contactsData);
      
    } catch (error) {
      setUploadError((error as Error).message);
      console.error('Erreur lors du traitement du CSV:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const addContact = (): void => {
    const newContact: Contact = { id: Date.now() };
    // Initialize with empty values for all CSV headers, or default fields if no CSV loaded
    const fieldsToAdd = csvHeaders.length > 0 ? csvHeaders : ['nom', 'telephone', 'rdv', 'date'];
    fieldsToAdd.forEach(field => {
      newContact[field] = '';
    });
    setContacts([...contacts, newContact]);
  };

  const updateContact = (id: number, field: string, value: string): void => {
    setContacts(contacts.map(contact => 
      contact.id === id ? { ...contact, [field]: value } : contact
    ));
  };

  const deleteContact = (id: number): void => {
    setContacts(contacts.filter(contact => contact.id !== id));
  };

  const generatePreview = (contact: Contact): string => {
    if (!template || !contact) return '';
    
    let preview = template;
    // Replace all variables based on CSV headers or contact properties
    Object.keys(contact).forEach(key => {
      if (key !== 'id') {
        const regex = new RegExp(`{${key}}`, 'g');
        preview = preview.replace(regex, String(contact[key]) || `{${key}}`);
      }
    });
    
    return preview;
  };

  const startCampaign = async (): Promise<void> => {
    if (contacts.length === 0 || !template) return;
    
    // Find phone number field
    const phoneField = csvHeaders.find(header => 
      header.includes('telephone') || header.includes('phone') || header.includes('tel') || header.includes('mobile')
    ) || 'telephone';
    
    setCampaignStatus('running');
    setResults({ sent: 0, failed: 0, total: contacts.length, errors: [] });
    
    // Real API integration
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const personalizedMessage = generatePreview(contact);
      
      // Get phone number from the detected field
      const phoneNumber = contact[phoneField];
      
      if (!phoneNumber) {
        setResults(prev => ({ 
          ...prev, 
          failed: prev.failed + 1,
          errors: [...prev.errors, { contact: String(contact[csvHeaders[0]] || `Contact ${i + 1}`), error: 'Numéro de téléphone manquant' }]
        }));
        setProgress(((i + 1) / contacts.length) * 100);
        continue;
      }
      
      try {
        const response = await fetch('/api/sms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient: [String(phoneNumber)], // API expects array format
            message: personalizedMessage,
            sender: sender, // Using fixed sender value "EFFY PART"
            message_type: 'PRM', // Promotional message type
            returnCredits: true,
            returnRemaining: true
          })
        });

        const result = await response.json();
        
        if (response.ok && result.result === 'OK') {
          setResults(prev => ({ 
            ...prev, 
            sent: prev.sent + 1 
          }));
        } else {
          setResults(prev => ({ 
            ...prev, 
            failed: prev.failed + 1,
            errors: [...prev.errors, { 
              contact: String(contact[csvHeaders[0]] || `Contact ${i + 1}`), 
              error: result.error || result.details || 'Erreur inconnue' 
            }]
          }));
        }
      } catch (error) {
        setResults(prev => ({ 
          ...prev, 
          failed: prev.failed + 1,
          errors: [...prev.errors, { 
            contact: String(contact[csvHeaders[0]] || `Contact ${i + 1}`), 
            error: error instanceof Error ? error.message : 'Erreur réseau' 
          }]
        }));
      }
      
      setProgress(((i + 1) / contacts.length) * 100);
      // Small delay to see progress
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setCampaignStatus('completed');
  };

  const handleVoiceCallComplete = (contactId: number, result: CallResult) => {
    setVoiceCallResults(prev => new Map(prev).set(contactId, result));
    setVoiceCampaign(prev => ({
      ...prev,
      results: new Map(prev.results).set(contactId, result)
    }));
  };

  // Launch Voice Campaign
  const launchVoiceCampaign = async () => {
    if (contacts.length === 0 || !template) {
      alert('Veuillez ajouter des contacts et créer un modèle de message');
      return;
    }

    if (!process.env.NEXT_PUBLIC_VAPI_API_KEY) {
      alert('Clé API VAPI manquante. Veuillez configurer NEXT_PUBLIC_VAPI_API_KEY dans votre fichier .env.local');
      return;
    }

    if (!process.env.NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID) {
      alert('ID du numéro de téléphone VAPI manquant. Veuillez configurer NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID dans votre fichier .env.local');
      return;
    }

    setVoiceCampaign({
      status: 'running',
      currentIndex: 0,
      results: new Map()
    });

    // Process contacts one by one
    for (let i = 0; i < contacts.length; i++) {
      if (voiceCampaign.status === 'paused') {
        break;
      }

      const contact = contacts[i];
      setVoiceCampaign(prev => ({ ...prev, currentIndex: i }));

      try {
        // Create a promise that resolves when the call is complete
        await new Promise<void>((resolve) => {
          const checkCallComplete = setInterval(() => {
            if (voiceCampaign.results.has(contact.id)) {
              clearInterval(checkCallComplete);
              resolve();
            }
          }, 1000);

          // Timeout after 5 minutes
          setTimeout(() => {
            clearInterval(checkCallComplete);
            resolve();
          }, 300000);
        });

        // Wait between calls
        if (i < contacts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, callDelay * 1000));
        }
      } catch (error) {
        console.error('Error processing contact:', error);
        handleVoiceCallComplete(contact.id, {
          duration: 0,
          status: 'failed',
          transcript: '',
          sentiment: 'neutral'
        });
      }
    }

    setVoiceCampaign(prev => ({ ...prev, status: 'completed' }));
  };

  const pauseVoiceCampaign = () => {
    setVoiceCampaign(prev => ({ ...prev, status: 'paused' }));
  };

  const resumeVoiceCampaign = () => {
    setVoiceCampaign(prev => ({ ...prev, status: 'running' }));
    // Continue from where we left off
    launchVoiceCampaign();
  };

  const TabButton: React.FC<TabButtonProps> = ({ id, label, icon: Icon, isActive, onClick, badge, description }) => (
    <button
      onClick={() => onClick(id)}
      className={`group relative flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 ${
        isActive 
          ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' 
          : 'bg-white text-gray-700 hover:bg-gray-50 shadow-lg hover:shadow-xl border border-gray-100'
      }`}
    >
      <div className="relative flex-shrink-0">
        <Icon size={24} className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
        {badge && badge > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <div className="text-center sm:text-left">
        <div className="font-bold text-sm sm:text-base">{label}</div>
        {description && (
          <div className={`text-xs mt-1 ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
            {description}
          </div>
        )}
      </div>
    </button>
  );

  const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    subtitle: string; 
    color: string; 
    icon: React.ComponentType<{ size?: number; className?: string }>;
    trend?: number;
  }> = ({ title, value, subtitle, color, icon: Icon, trend }) => (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center space-x-1 text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp size={16} className={trend >= 0 ? '' : 'rotate-180'} />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-gray-600 font-medium">{title}</div>
      <div className="text-sm text-gray-500 mt-1">{subtitle}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative bg-blue-600 p-3 rounded-2xl shadow-lg">
                <MessageSquare className="h-8 w-8 text-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  NexusMessage Pro
                </h1>
                <p className="text-gray-600 flex items-center space-x-2 text-sm sm:text-base">
                  <Sparkles size={16} className="text-blue-500" />
                  <span>Plateforme de campagnes SMS & Voice AI</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center bg-gray-50 rounded-xl p-4 min-w-[100px]">
                <div className="text-sm text-gray-500 font-medium">Contacts</div>
                <div className="text-2xl font-bold text-blue-600">{contacts.length}</div>
              </div>
              <div className="text-center bg-gray-50 rounded-xl p-4 min-w-[100px]">
                <div className="text-sm text-gray-500 font-medium">Statut</div>
                <div className={`text-lg font-bold ${
                  campaignStatus === 'completed' ? 'text-green-600' :
                  campaignStatus === 'running' ? 'text-blue-600' :
                  'text-gray-400'
                }`}>
                  {campaignStatus === 'completed' ? 'Terminé' :
                   campaignStatus === 'running' ? 'Actif' :
                   'Prêt'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <TabButton 
            id="contacts" 
            label="Contacts" 
            icon={Users} 
            isActive={activeTab === 'contacts'}
            onClick={setActiveTab}
            badge={contacts.length}
            description="Gérer vos contacts"
          />
          <TabButton 
            id="template" 
            label="Message" 
            icon={Edit3} 
            isActive={activeTab === 'template'}
            onClick={setActiveTab}
            badge={template ? 1 : 0}
            description="Créer votre message"
          />
          <TabButton 
            id="preview" 
            label="Aperçu" 
            icon={Eye} 
            isActive={activeTab === 'preview'}
            onClick={setActiveTab}
            description="Vérifier le rendu"
          />
          <TabButton 
            id="campaign" 
            label="Campagne" 
            icon={Send} 
            isActive={activeTab === 'campaign'}
            onClick={setActiveTab}
            description="Lancer l'envoi"
          />
          <TabButton 
            id="results" 
            label="Résultats" 
            icon={BarChart3} 
            isActive={activeTab === 'results'}
            onClick={setActiveTab}
            badge={results.sent}
            description="Analyser les données"
          />
          <TabButton 
            id="voice" 
            label="Appels Vocaux" 
            icon={Phone} 
            isActive={activeTab === 'voice'}
            onClick={setActiveTab}
            description="Campagne vocale AI"
          />
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          
          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Gestion des Contacts
                  </h2>
                  <p className="text-gray-600">Importez vos contacts ou ajoutez-les manuellement</p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                  <label className="flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl cursor-pointer transition-all duration-200 font-semibold w-full sm:w-auto">
                    <Upload size={20} />
                    <span>Importer CSV</span>
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                  </label>
                  <button 
                    onClick={addContact}
                    className="flex items-center justify-center space-x-3 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl transition-all duration-200 font-semibold w-full sm:w-auto"
                  >
                    <Plus size={20} />
                    <span>Ajouter</span>
                  </button>
                </div>
              </div>

              {contacts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="relative inline-block mb-6">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <Users className="h-10 w-10 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Aucun contact chargé</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Commencez par importer un fichier CSV ou ajouter des contacts manuellement
                  </p>
                  
                  {uploadError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 max-w-md mx-auto">
                      <div className="flex items-center space-x-2">
                        <AlertCircle size={20} />
                        <span className="font-medium">{uploadError}</span>
                      </div>
                    </div>
                  )}
                  
                  {isUploading && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 max-w-md mx-auto">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        <span className="font-medium">Traitement du fichier CSV...</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-blue-50 rounded-2xl p-6 max-w-2xl mx-auto border border-blue-100">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center justify-center space-x-2">
                      <FileText size={20} className="text-blue-600" />
                      <span>Format CSV Recommandé</span>
                    </h4>
                    <div className="text-left space-y-3">
                      <div className="flex items-center space-x-3 text-gray-700">
                        <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                        <span>Première ligne = en-têtes des colonnes</span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-700">
                        <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                        <span>Variables automatiquement détectées</span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-700">
                        <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                        <span>Séparateur : virgule (,)</span>
                      </div>
                      <pre className="bg-white p-4 rounded-lg mt-4 text-sm font-mono text-gray-800 border border-gray-200 overflow-x-auto">
{`nom,telephone,rdv,date
Martin Dubois,+33123456789,14h30,2024-05-28`}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                          {(csvHeaders.length > 0 ? csvHeaders : ['nom', 'telephone', 'rdv', 'date']).map(header => (
                            <th key={header} className="px-6 py-4 text-left text-sm font-semibold text-gray-700 capitalize whitespace-nowrap">
                              {header.replace(/_/g, ' ')}
                            </th>
                          ))}
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {contacts.map((contact ) => (
                          <tr key={contact.id} className="hover:bg-gray-50 transition-colors duration-200">
                            {(csvHeaders.length > 0 ? csvHeaders : ['nom', 'telephone', 'rdv', 'date']).map(field => (
                              <td key={field} className="px-6 py-4 whitespace-nowrap">
                                <input 
                                  value={String(contact[field] || '')}
                                  onChange={(e) => updateContact(contact.id, field, e.target.value)}
                                  className="w-full min-w-[120px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                                  placeholder={field}
                                />
                              </td>
                            ))}
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <button 
                                onClick={() => deleteContact(contact.id)}
                                className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvHeaders.length > 0 && (
                    <div className="p-4 bg-green-50 border-t border-green-200">
                      <div className="flex flex-wrap items-center text-sm text-green-700">
                        <CheckCircle size={16} className="mr-2 flex-shrink-0" />
                        <span className="font-medium mr-2">Variables détectées :</span>
                        <div className="flex flex-wrap gap-2">
                          {csvHeaders.map(header => (
                            <span key={header} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">
                              {`{${header}}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Template Tab */}
          {activeTab === 'template' && (
            <div className="p-6 sm:p-8">
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Modèle de Message
                </h2>
                <p className="text-gray-600">Créez votre message personnalisé avec des variables dynamiques</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Sender (Expéditeur)
                    </label>
                    <div className="relative">
                      <input
                        value={sender}
                        readOnly
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-100 text-gray-700 cursor-not-allowed"
                        placeholder="Nom de l'expéditeur"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                        Fixe
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      L'expéditeur est défini sur EFFY PART
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Message Template
                    </label>
                    <div className="relative">
                      <textarea
                        value={template}
                        onChange={handleTemplateChange}
                        className="w-full h-64 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-gray-900 bg-white"
                        placeholder={csvHeaders.length > 0 
                          ? `Bonjour {${csvHeaders[0] || 'nom'}}, votre message personnalisé ici...`
                          : "Importez d'abord un CSV pour voir les variables disponibles"
                        }
                        maxLength={160}
                      />
                      <div className="absolute right-3 bottom-3 text-xs text-gray-500">
                        {template.length}/160
                      </div>
                    </div>
                    {templateError && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {templateError}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      Les URLs et numéros de téléphone sont autorisés. Pas de termes de paiement, casino ou montant.
                    </p>
                    
                    {csvHeaders.length > 0 && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                          <Target size={16} className="text-blue-600" />
                          <span>Variables disponibles</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {csvHeaders.map(variable => (
                            <button
                              key={variable} 
                              className="bg-white text-blue-800 px-3 py-1 rounded-lg text-sm font-mono border border-blue-300 hover:bg-blue-100 transition-colors duration-200"
                              onClick={() => setTemplate(prev => prev + `{${variable}}`)}
                            >
                              {`{${variable}}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Aperçu en Temps Réel
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 h-80 overflow-y-auto">
                    {template ? (
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                          <MessageSquare size={14} />
                          <span>Aperçu SMS</span>
                        </div>
                        <div className="text-sm leading-relaxed text-gray-800">
                          {contacts.length > 0 ? generatePreview(contacts[0]) : template}
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                          <span>
                            {(contacts.length > 0 ? generatePreview(contacts[0]) : template).length} caractères
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock size={12} />
                            <span>{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <MessageSquare className="mb-3" size={32} />
                        <span className="text-center">Saisissez votre message pour voir l&apos;aperçu</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="p-6 sm:p-8">
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Aperçu des Messages
                </h2>
                <p className="text-gray-600">Vérifiez chaque message personnalisé avant l&apos;envoi</p>
              </div>
              
              {contacts.length === 0 || !template ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <Eye className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Aperçu non disponible</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Veuillez ajouter des contacts et créer un modèle de message pour voir l&apos;aperçu
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {contacts.map((contact, index) => {
                    const nameField = csvHeaders.find(h => h.includes('nom') || h.includes('name')) || csvHeaders[0] || 'nom';
                    const phoneField = csvHeaders.find(h => h.includes('telephone') || h.includes('phone') || h.includes('tel') || h.includes('mobile')) || 'telephone';
                    
                    return (
                      <div key={contact.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                          <div className="font-semibold text-gray-800 flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {index + 1}
                            </div>
                            <span>{String(contact[nameField]) || `Contact ${index + 1}`}</span>
                          </div>
                          <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200 font-mono">
                            {String(contact[phoneField]) || 'N/A'}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-sm border border-gray-200 text-gray-800">
                          {generatePreview(contact)}
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500 mt-3">
                          <span>{generatePreview(contact).length} caractères</span>
                          <span className="flex items-center space-x-1">
                            <CheckCircle size={12} className="text-green-500" />
                            <span>Prêt à envoyer</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Campaign Tab */}
          {activeTab === 'campaign' && (
            <div className="p-6 sm:p-8">
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Lancement de Campagne
                </h2>
                <p className="text-gray-600">Contrôlez et suivez l&apos;envoi de votre campagne SMS</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                    <h3 className="text-xl font-semibold text-blue-800 mb-6 flex items-center space-x-2">
                      <Settings size={20} />
                      <span>Résumé de la Campagne</span>
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-100">
                        <span className="text-blue-700 font-medium">Nombre de contacts :</span>
                        <span className="font-bold text-blue-800 text-lg">{contacts.length}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-100">
                        <span className="text-blue-700 font-medium">Messages à envoyer :</span>
                        <span className="font-bold text-blue-800 text-lg">{contacts.length}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-100">
                        <span className="text-blue-700 font-medium">Sender :</span>
                        <span className="font-bold text-green-600 text-lg">
                          {sender}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-100">
                        <span className="text-blue-700 font-medium">Statut du modèle :</span>
                        <span className={`font-bold text-lg flex items-center space-x-1 ${template ? 'text-green-600' : 'text-red-600'}`}>
                          {template ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                          <span>{template ? 'Prêt' : 'Non défini'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={startCampaign}
                    disabled={contacts.length === 0 || !template || campaignStatus === 'running'}
                    className={`w-full flex items-center justify-center space-x-3 py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-300 ${
                      contacts.length === 0 || !template || campaignStatus === 'running'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {campaignStatus === 'running' ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={24} />
                        <span>Lancer la Campagne</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  {campaignStatus !== 'idle' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                      <h3 className="text-xl font-semibold mb-6 flex items-center space-x-2">
                        <BarChart3 size={20} className="text-blue-600" />
                        <span>Progression en Temps Réel</span>
                      </h3>
                      
                      <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span className="font-medium">Progression</span>
                          <span className="font-bold">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <StatCard
                          title="Envoyés"
                          value={results.sent}
                          subtitle="Avec succès"
                          color="bg-green-500"
                          icon={CheckCircle}
                        />
                        <StatCard
                          title="Échecs"
                          value={results.failed}
                          subtitle="Erreurs"
                          color="bg-red-500"
                          icon={AlertCircle}
                        />
                        <StatCard
                          title="Total"
                          value={results.total}
                          subtitle="Messages"
                          color="bg-blue-500"
                          icon={Send}
                        />
                      </div>

                      {campaignStatus === 'completed' && (
                        <div className="p-4 bg-green-50 rounded-xl border border-green-200 flex items-center">
                          <CheckCircle className="text-green-600 mr-3 flex-shrink-0" size={24} />
                          <div>
                            <div className="text-green-800 font-semibold">Campagne terminée avec succès !</div>
                            <div className="text-green-600 text-sm">Tous les messages ont été traités</div>
                          </div>
                        </div>
                      )}

                      {results.errors.length > 0 && (
                        <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
                          <h4 className="font-semibold text-red-800 mb-2">Erreurs rencontrées :</h4>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {results.errors.map((error, index) => (
                              <div key={index} className="text-sm text-red-700">
                                <span className="font-medium">{error.contact}:</span> {error.error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Results Tab */}
          {activeTab === 'results' && (
            <div className="p-6 sm:p-8">
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Résultats de Campagne
                </h2>
                <p className="text-gray-600">Analysez les performances de votre campagne SMS</p>
              </div>
              
              {campaignStatus === 'idle' ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <BarChart3 className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Aucune campagne lancée</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Les résultats et analytics apparaîtront ici après le lancement de votre première campagne
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                      title="Messages Total"
                      value={results.total}
                      subtitle="Campagne complète"
                      color="bg-blue-500"
                      icon={MessageSquare}
                      trend={12}
                    />
                    <StatCard
                      title="Envoyés"
                      value={results.sent}
                      subtitle="Avec succès"
                      color="bg-green-500"
                      icon={CheckCircle}
                      trend={8}
                    />
                    <StatCard
                      title="Échecs"
                      value={results.failed}
                      subtitle="À retraiter"
                      color="bg-red-500"
                      icon={AlertCircle}
                      trend={-2}
                    />
                    <StatCard
                      title="Taux de Succès"
                      value={`${results.total > 0 ? Math.round((results.sent / results.total) * 100) : 0}%`}
                      subtitle="Performance"
                      color="bg-purple-500"
                      icon={TrendingUp}
                      trend={5}
                    />
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-white">
                      <h3 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                        <FileText size={20} className="text-blue-600" />
                        <span>Détails de la Campagne</span>
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Contact</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Téléphone</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Statut</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Heure</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {contacts.map((contact) => {
                            const nameField = csvHeaders.find(h => h.includes('nom') || h.includes('name')) || csvHeaders[0] || 'nom';
                            const phoneField = csvHeaders.find(h => h.includes('telephone') || h.includes('phone') || h.includes('tel') || h.includes('mobile')) || 'telephone';
                            
                            return (
                              <tr key={contact.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{String(contact[nameField]) || 'N/A'}</td>
                                <td className="px-6 py-4 text-sm text-gray-600 font-mono">{String(contact[phoneField]) || 'N/A'}</td>
                                <td className="px-6 py-4">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle size={12} className="mr-1" />
                                    Envoyé
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                  {new Date().toLocaleTimeString('fr-FR')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Voice Tab */}
          {activeTab === 'voice' && (
            <div className="p-6 sm:p-8">
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Campagne d&apos;Appels Vocaux AI
                </h2>
                <p className="text-gray-600">Lancez des appels automatisés avec l&apos;intelligence artificielle</p>
              </div>

              {/* Voice Campaign Stats */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-8 border border-purple-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <Phone className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{contacts.length}</div>
                    <div className="text-sm text-gray-600">Appels disponibles</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{voiceCallResults.size}</div>
                    <div className="text-sm text-gray-600">Appels réussis</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {voiceCallResults.size > 0 
                        ? Math.round(Array.from(voiceCallResults.values()).reduce((acc, r) => acc + r.duration, 0) / voiceCallResults.size)
                        : 0}s
                    </div>
                    <div className="text-sm text-gray-600">Durée moyenne</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {voiceCallResults.size > 0 
                        ? Math.round(Array.from(voiceCallResults.values()).filter(r => r.status === 'completed').length / voiceCallResults.size * 100)
                        : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Taux de conversion</div>
                  </div>
                </div>
              </div>

              {/* Voice Settings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Settings size={20} className="text-gray-600" />
                    <span>Configuration Vocale</span>
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Voix de l&apos;assistant
                      </label>
                      <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <option>Rachel - Voix française professionnelle</option>
                        <option>Antoine - Voix masculine française</option>
                        <option>Sophie - Voix féminine douce</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vitesse de parole
                      </label>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="1.5" 
                        step="0.1" 
                        defaultValue="1" 
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Délai entre appels (secondes)
                      </label>
                      <input 
                        type="number" 
                        value={callDelay}
                        onChange={(e) => setCallDelay(Number(e.target.value))}
                        min="1" 
                        max="60"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Sparkles size={20} className="text-purple-600" />
                    <span>Intelligence Artificielle</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Détection d&apos;intention</span>
                      <input type="checkbox" defaultChecked className="toggle" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Réponses contextuelles</span>
                      <input type="checkbox" defaultChecked className="toggle" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Analyse de sentiment</span>
                      <input type="checkbox" defaultChecked className="toggle" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Prise de rendez-vous</span>
                      <input type="checkbox" className="toggle" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Voice Campaign Progress */}
              {voiceCampaign.status !== 'idle' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center space-x-2">
                    <Activity size={20} />
                    <span>Campagne Vocale en Cours</span>
                  </h3>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span className="font-medium">Progression</span>
                      <span className="font-bold">
                        {voiceCampaign.currentIndex + 1} / {contacts.length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${((voiceCampaign.currentIndex + 1) / contacts.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  {voiceCampaign.status === 'running' && (
                    <button
                      onClick={pauseVoiceCampaign}
                      className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg transition-all duration-200"
                    >
                      <AlertCircle size={16} />
                      <span>Mettre en pause</span>
                    </button>
                  )}
                  {voiceCampaign.status === 'paused' && (
                    <button
                      onClick={resumeVoiceCampaign}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-all duration-200"
                    >
                      <Phone size={16} />
                      <span>Reprendre</span>
                    </button>
                  )}
                </div>
              )}

              {/* Individual Voice Calls */}
              {contacts.length > 0 && template && (
                <div className="space-y-4 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Appels Individuels</h3>
                  {contacts.slice(0, 3).map(contact => (
                    <VoiceCallComponent
                      key={contact.id}
                      contact={contact}
                      template={template}
                      onCallComplete={(result) => handleVoiceCallComplete(contact.id, result)}
                    />
                  ))}
                  {contacts.length > 3 && (
                    <div className="text-center py-4 text-gray-600">
                      <p>Et {contacts.length - 3} autres contacts...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Launch Voice Campaign */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center">
                <h3 className="text-2xl font-bold mb-4">Prêt à lancer votre campagne vocale AI ?</h3>
                <p className="mb-6 text-purple-100">
                  {contacts.length > 0 
                    ? `${contacts.length} contacts seront appelés avec votre message personnalisé`
                    : "Importez d'abord des contacts pour démarrer"
                  }
                </p>
                <button
                  onClick={launchVoiceCampaign}
                  disabled={contacts.length === 0 || !template || voiceCampaign.status === 'running'}
                  className={`inline-flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                    contacts.length === 0 || !template || voiceCampaign.status === 'running'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-white text-purple-600 hover:bg-purple-50 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <Phone size={24} />
                  <span>
                    {voiceCampaign.status === 'running' 
                      ? 'Campagne en cours...' 
                      : 'Démarrer la Campagne Vocale'
                    }
                  </span>
                </button>
                
                {/* Debug Info */}
                <div className="mt-4 text-sm text-purple-100">
                  <p>Debug Info:</p>
                  <p>Contacts: {contacts.length} | Template: {template ? '✓' : '✗'} | API Key: {process.env.NEXT_PUBLIC_VAPI_API_KEY ? '✓' : '✗'} | Phone ID: {process.env.NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID ? '✓' : '✗'}</p>
                  {contacts.length === 0 && <p className="text-yellow-300">→ Ajoutez des contacts</p>}
                  {!template && <p className="text-yellow-300">→ Créez un message template</p>}
                  {!process.env.NEXT_PUBLIC_VAPI_API_KEY && <p className="text-yellow-300">→ Configurez NEXT_PUBLIC_VAPI_API_KEY</p>}
                  {!process.env.NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID && <p className="text-yellow-300">→ Configurez NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID</p>}
                </div>
              </div>

              {/* API Configuration Warning */}
              {!process.env.NEXT_PUBLIC_VAPI_API_KEY && (
                <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                    <div className="text-sm text-red-800">
                      <p className="font-semibold mb-1">Configuration Requise pour les Appels Téléphoniques</p>
                      <p className="mb-2">Pour utiliser les appels vocaux, configurez ces variables dans votre fichier .env.local :</p>
                      <pre className="bg-red-100 p-3 rounded text-xs font-mono">
{`NEXT_PUBLIC_VAPI_API_KEY=votre_cle_api_vapi
NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID=votre_phone_number_id
NEXT_PUBLIC_VAPI_ASSISTANT_ID=votre_assistant_id (optionnel)`}
                      </pre>
                      <div className="mt-3 space-y-1">
                        <p className="font-medium">Étapes de configuration :</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>Créez un compte sur <a href="https://vapi.ai" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">vapi.ai</a></li>
                          <li>Configurez un numéro de téléphone (Twilio, Vonage, etc.)</li>
                          <li>Récupérez votre API key et phone number ID</li>
                          <li>Optionnel : Créez un assistant et récupérez son ID</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SMSCampaignSystem;