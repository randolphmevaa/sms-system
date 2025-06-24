'use client';

import React, { useState } from 'react';
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
  // ArrowRight,
  Star,
  Shield,
  Layers,
  Activity,
  Download,
  ChevronRight,
} from 'lucide-react';
import VoiceCampaignSection from './VoiceCallComponent';

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

const validateMessageTemplate = (value: string): string => {
  let cleaned = value.slice(0, 160);
  if (cleaned.length === 0) return cleaned;
  
  const hasMoneySymbol = MONEY_SYMBOLS.some(symbol => cleaned.includes(symbol));
  if (hasMoneySymbol) {
    MONEY_SYMBOLS.forEach(symbol => {
      if (cleaned.includes(symbol)) {
        cleaned = cleaned.replace(new RegExp(`\\${symbol}`, 'g'), '');
      }
    });
  }
  
  const lowerCleaned = cleaned.toLowerCase();
  const hasBlockedTerms = BLOCKED_MESSAGE_TERMS.some(term => 
    lowerCleaned.includes(term.toLowerCase())
  );
  
  if (hasBlockedTerms) {
    for (const blocked of BLOCKED_MESSAGE_TERMS) {
      if (lowerCleaned.includes(blocked.toLowerCase())) {
        const regex = new RegExp(`(^|\\s)${blocked}(\\s|$)`, 'gi');
        cleaned = cleaned.replace(regex, '$1$2');
      }
    }
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
  }
  
  if (cleaned.startsWith(' ') || cleaned.endsWith(' ')) {
    if (cleaned.match(/^\s{2,}/) || cleaned.match(/\s{2,}$/)) {
      cleaned = cleaned.trim();
    }
  }
  
  return cleaned;
};

// Animated Background Component
const AnimatedBackground: React.FC = () => {
  return (
    <>
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        @keyframes float {
          0% { transform: translateY(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh); opacity: 0; }
        }
        
        .animate-blob {
          animation: blob 20s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-float {
          animation: float 15s infinite;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
        
        {/* Grid pattern */}
        {/* <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%25" height="100%25" fill="url(%23grid)"/%3E%3C/svg%3E')] opacity-50" /> */}
      </div>
    </>
  );
};

// Premium Voice Campaign Component
// const VoiceCampaignSection: React.FC<{ contacts: Contact[]; template: string }> = ({ contacts, template }) => {
//   return (
//     <div className="space-y-6">
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 transform hover:scale-105">
//           <div className="flex items-center justify-between mb-4">
//             <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
//               <Phone className="w-6 h-6 text-white" />
//             </div>
//             <span className="text-xs text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full">AI Powered</span>
//           </div>
//           <h3 className="text-xl font-bold text-white mb-2">Appels Intelligents</h3>
//           <p className="text-gray-400 text-sm">Assistant vocal AI pour conversations naturelles</p>
//         </div>
        
//         <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 transform hover:scale-105">
//           <div className="flex items-center justify-between mb-4">
//             <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl">
//               <Activity className="w-6 h-6 text-white" />
//             </div>
//             <span className="text-xs text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full">Temps Réel</span>
//           </div>
//           <h3 className="text-xl font-bold text-white mb-2">Analyse Live</h3>
//           <p className="text-gray-400 text-sm">Suivez vos appels en temps réel</p>
//         </div>
        
//         <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 transform hover:scale-105">
//           <div className="flex items-center justify-between mb-4">
//             <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl">
//               <Shield className="w-6 h-6 text-white" />
//             </div>
//             <span className="text-xs text-green-300 bg-green-500/20 px-3 py-1 rounded-full">Sécurisé</span>
//           </div>
//           <h3 className="text-xl font-bold text-white mb-2">100% Conforme</h3>
//           <p className="text-gray-400 text-sm">Respect total du RGPD</p>
//         </div>
//       </div>
      
//       <div className="bg-gradient-to-r from-purple-500/5 to-pink-500/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
//         <div className="text-center">
//           <h3 className="text-2xl font-bold text-white mb-4">Prêt à révolutionner vos appels ?</h3>
//           <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
//             Notre IA conversationnelle gère des milliers d'appels simultanément avec un taux de satisfaction de 95%
//           </p>
//           <button className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-purple-500/25">
//             Configurer la Campagne Vocale
//             <ArrowRight className="inline-block ml-2 w-5 h-5" />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// Main SMS Campaign System Component
const SMSCampaignSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [template, setTemplate] = useState<string>('');
  const [sender] = useState<string>('EFFY PART');
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [results, setResults] = useState<CampaignResults>({ sent: 0, failed: 0, total: 0, errors: [] });
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [templateError, setTemplateError] = useState<string>('');

  const handleTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawValue = e.target.value;
    const validatedValue = validateMessageTemplate(rawValue);
    
    setTemplate(validatedValue);
    
    if (rawValue !== validatedValue && rawValue.length > 0) {
      const lowerValue = rawValue.toLowerCase();
      
      if (MONEY_SYMBOLS.some(symbol => rawValue.includes(symbol))) {
        setTemplateError('Les symboles monétaires ne sont pas autorisés');
      } else if (BLOCKED_MESSAGE_TERMS.some(term => lowerValue.includes(term.toLowerCase()))) {
        setTemplateError('Termes interdits détectés (paiement, casino, montant, etc.)');
      } else if (rawValue.length > 160) {
        setTemplateError('Maximum 160 caractères');
      }
      
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
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('Le fichier CSV doit contenir au moins un en-tête et une ligne de données');
      }

      const headers = lines[0].split(',').map(header => 
        header.trim().replace(/"/g, '').toLowerCase()
      );
      
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
    
    const phoneField = csvHeaders.find(header => 
      header.includes('telephone') || header.includes('phone') || header.includes('tel') || header.includes('mobile')
    ) || 'telephone';
    
    setCampaignStatus('running');
    setResults({ sent: 0, failed: 0, total: contacts.length, errors: [] });
    
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const personalizedMessage = generatePreview(contact);
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
            recipient: [String(phoneNumber)],
            message: personalizedMessage,
            sender: sender,
            message_type: 'PRM',
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
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setCampaignStatus('completed');
  };
  
  const TabButton: React.FC<TabButtonProps> = ({ id, label, icon: Icon, isActive, onClick, badge, description }) => (
    <button
      onClick={() => onClick(id)}
      className={`group relative flex flex-col items-center p-6 rounded-3xl font-semibold transition-all duration-500 transform hover:scale-105 ${
        isActive 
          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-2xl shadow-purple-500/25' 
          : 'bg-white/5 backdrop-blur-xl text-gray-300 hover:bg-white/10 border border-white/10 hover:border-white/20'
      }`}
    >
      <div className="relative mb-3">
        <div className={`p-4 rounded-2xl transition-all duration-300 ${
          isActive ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
        }`}>
          <Icon size={28} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
        </div>
        {badge && badge > 0 && (
          <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <div className="text-center space-y-1">
        <div className="font-bold text-base">{label}</div>
        {description && (
          <div className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
            {description}
          </div>
        )}
      </div>
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl -z-10" />
      )}
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
    <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 transform hover:scale-105 group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-2xl ${color} shadow-lg`}>
            <Icon size={24} className="text-white" />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center space-x-1 text-sm font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              <TrendingUp size={16} className={trend >= 0 ? '' : 'rotate-180'} />
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <div className="text-gray-300 font-medium">{title}</div>
        <div className="text-sm text-gray-500 mt-1">{subtitle}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      {/* Floating particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 20}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-8 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-3xl shadow-2xl shadow-purple-500/25 transform rotate-3 hover:rotate-6 transition-transform duration-300">
                  <MessageSquare className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
              </div>
              <div>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200">
                  NexusMessage Pro
                </h1>
                <p className="text-gray-400 flex items-center space-x-2 text-base mt-1">
                  <Sparkles size={18} className="text-purple-400 animate-pulse" />
                  <span>Plateforme Premium SMS & Voice AI</span>
                  <Star size={16} className="text-yellow-400" />
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/20 min-w-[120px]">
                <div className="text-sm text-purple-300 font-medium mb-1">Contacts</div>
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{contacts.length}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-2xl p-5 border border-blue-500/20 min-w-[120px]">
                <div className="text-sm text-blue-300 font-medium mb-1">Statut</div>
                <div className={`text-2xl font-black ${
                  campaignStatus === 'completed' ? 'text-green-400' :
                  campaignStatus === 'running' ? 'text-blue-400 animate-pulse' :
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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          <TabButton 
            id="contacts" 
            label="Contacts" 
            icon={Users} 
            isActive={activeTab === 'contacts'}
            onClick={setActiveTab}
            badge={contacts.length}
            description="Gérer la base"
          />
          <TabButton 
            id="template" 
            label="Message" 
            icon={Edit3} 
            isActive={activeTab === 'template'}
            onClick={setActiveTab}
            badge={template ? 1 : 0}
            description="Créer le SMS"
          />
          <TabButton 
            id="preview" 
            label="Aperçu" 
            icon={Eye} 
            isActive={activeTab === 'preview'}
            onClick={setActiveTab}
            description="Visualiser"
          />
          <TabButton 
            id="campaign" 
            label="Campagne" 
            icon={Send} 
            isActive={activeTab === 'campaign'}
            onClick={setActiveTab}
            description="Lancer"
          />
          <TabButton 
            id="results" 
            label="Analytics" 
            icon={BarChart3} 
            isActive={activeTab === 'results'}
            onClick={setActiveTab}
            badge={results.sent}
            description="Statistiques"
          />
          <TabButton 
            id="voice" 
            label="Voice AI" 
            icon={Phone} 
            isActive={activeTab === 'voice'}
            onClick={setActiveTab}
            description="Appels IA"
          />
        </div>

        {/* Content Area */}
        <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />
          
          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div className="relative p-8 lg:p-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 space-y-4 sm:space-y-0">
                <div>
                  <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-3">
                    Centre de Contacts
                  </h2>
                  <p className="text-gray-400 text-lg">Importez et gérez votre base de données</p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                  <label className="group relative overflow-hidden flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl cursor-pointer transition-all duration-300 font-bold shadow-2xl hover:shadow-purple-500/25 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Upload size={22} className="relative z-10" />
                    <span className="relative z-10">Importer CSV</span>
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                  </label>
                  <button 
                    onClick={addContact}
                    className="group relative overflow-hidden flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl transition-all duration-300 font-bold shadow-2xl hover:shadow-green-500/25 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Plus size={22} className="relative z-10" />
                    <span className="relative z-10">Ajouter</span>
                  </button>
                </div>
              </div>

              {contacts.length === 0 ? (
                <div className="text-center py-20">
                  <div className="relative inline-block mb-8">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mb-6 mx-auto backdrop-blur-xl border border-white/10">
                      <Users className="h-16 w-16 text-purple-400" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/25">
                      <Star className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">Commencez Votre Aventure</h3>
                  <p className="text-gray-400 mb-8 max-w-md mx-auto text-lg">
                    Importez vos contacts pour débloquer la puissance du marketing SMS nouvelle génération
                  </p>
                  
                  {uploadError && (
                    <div className="mb-8 p-6 bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl text-red-400 max-w-md mx-auto">
                      <div className="flex items-center space-x-3">
                        <AlertCircle size={24} className="flex-shrink-0" />
                        <span className="font-medium">{uploadError}</span>
                      </div>
                    </div>
                  )}
                  
                  {isUploading && (
                    <div className="mb-8 p-6 bg-blue-500/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl text-blue-400 max-w-md mx-auto">
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin w-6 h-6 border-3 border-blue-400 border-t-transparent rounded-full"></div>
                        <span className="font-medium">Analyse du fichier en cours...</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-3xl p-8 max-w-2xl mx-auto border border-purple-500/20">
                    <h4 className="font-bold text-white mb-6 flex items-center justify-center space-x-3 text-xl">
                      <FileText size={24} className="text-purple-400" />
                      <span>Format CSV Premium</span>
                    </h4>
                    <div className="text-left space-y-4">
                      <div className="flex items-center space-x-3 text-gray-300">
                        <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                        <span>En-têtes automatiquement détectés</span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-300">
                        <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                        <span>Variables dynamiques instantanées</span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-300">
                        <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                        <span>Support multi-colonnes illimité</span>
                      </div>
                      <pre className="bg-black/30 backdrop-blur-xl p-6 rounded-2xl mt-6 text-sm font-mono text-green-400 border border-green-500/20 overflow-x-auto">
{`nom,telephone,rdv,date
Martin Dubois,+33123456789,14h30,2024-05-28
Sophie Laurent,+33987654321,16h00,2024-05-28`}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-black/20 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/10">
                          {(csvHeaders.length > 0 ? csvHeaders : ['nom', 'telephone', 'rdv', 'date']).map(header => (
                            <th key={header} className="px-6 py-5 text-left text-sm font-bold text-gray-300 uppercase tracking-wider">
                              {header.replace(/_/g, ' ')}
                            </th>
                          ))}
                          <th className="px-6 py-5 text-center text-sm font-bold text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {contacts.map((contact) => (
                          <tr key={contact.id} className="hover:bg-white/5 transition-colors duration-200">
                            {(csvHeaders.length > 0 ? csvHeaders : ['nom', 'telephone', 'rdv', 'date']).map(field => (
                              <td key={field} className="px-6 py-4">
                                <input 
                                  value={String(contact[field] || '')}
                                  onChange={(e) => updateContact(contact.id, field, e.target.value)}
                                  className="w-full min-w-[140px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-500"
                                  placeholder={field}
                                />
                              </td>
                            ))}
                            <td className="px-6 py-4 text-center">
                              <button 
                                onClick={() => deleteContact(contact.id)}
                                className="text-red-400 hover:text-red-300 p-3 rounded-xl hover:bg-red-500/10 transition-all duration-200 transform hover:scale-110"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvHeaders.length > 0 && (
                    <div className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-t border-white/10">
                      <div className="flex flex-wrap items-center text-sm text-green-400">
                        <CheckCircle size={20} className="mr-3 flex-shrink-0" />
                        <span className="font-bold mr-3">Variables magiques détectées :</span>
                        <div className="flex flex-wrap gap-2">
                          {csvHeaders.map(header => (
                            <span key={header} className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-mono backdrop-blur-xl border border-green-500/30">
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
            <div className="relative p-8 lg:p-10">
              <div className="mb-10">
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-3">
                  Studio de Création
                </h2>
                <p className="text-gray-400 text-lg">Composez des messages qui convertissent avec l&apos;IA</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-bold text-purple-300 mb-4 uppercase tracking-wider">
                      Expéditeur Premium
                    </label>
                    <div className="relative group">
                      <input
                        value={sender}
                        readOnly
                        className="w-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl px-6 py-4 text-white font-medium cursor-not-allowed"
                        placeholder="Nom de l'expéditeur"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Shield className="w-5 h-5 text-purple-400" />
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-gray-500 flex items-center">
                      <CheckCircle size={14} className="mr-2 text-green-400" />
                      Expéditeur vérifié et approuvé
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-purple-300 mb-4 uppercase tracking-wider">
                      Message Intelligent
                    </label>
                    <div className="relative group">
                      <textarea
                        value={template}
                        onChange={handleTemplateChange}
                        className="w-full h-72 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none text-white placeholder-gray-500 text-lg"
                        placeholder={csvHeaders.length > 0 
                          ? `Bonjour {${csvHeaders[0] || 'nom'}}, votre message personnalisé ici...`
                          : "Importez d'abord un CSV pour débloquer les variables magiques ✨"
                        }
                        maxLength={160}
                      />
                      <div className="absolute right-4 bottom-4 text-xs text-gray-500 bg-black/50 backdrop-blur-xl px-3 py-1 rounded-full border border-white/10">
                        {template.length}/160
                      </div>
                    </div>
                    {templateError && (
                      <div className="mt-3 p-4 bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl">
                        <p className="text-sm text-red-400 flex items-center">
                          <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                          {templateError}
                        </p>
                      </div>
                    )}
                    <p className="mt-3 text-xs text-gray-500 flex items-center">
                      <Sparkles size={14} className="mr-2 text-yellow-400" />
                      URLs et téléphones autorisés • Protection anti-spam activée
                    </p>
                    
                    {csvHeaders.length > 0 && (
                      <div className="mt-6 p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl border border-purple-500/20">
                        <p className="font-bold text-white mb-4 flex items-center space-x-2">
                          <Target size={20} className="text-purple-400" />
                          <span>Variables Dynamiques</span>
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {csvHeaders.map(variable => (
                            <button
                              key={variable} 
                              className="group bg-black/30 backdrop-blur-xl text-purple-300 px-4 py-2 rounded-xl text-sm font-mono border border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-400 transition-all duration-200 transform hover:scale-105"
                              onClick={() => setTemplate(prev => prev + `{${variable}}`)}
                            >
                              <span className="flex items-center space-x-2">
                                <Layers size={14} className="group-hover:rotate-12 transition-transform duration-200" />
                                <span>{`{${variable}}`}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-purple-300 mb-4 uppercase tracking-wider">
                    Prévisualisation Live
                  </label>
                  <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8 h-96 overflow-y-auto">
                    {template ? (
                      <div className="relative">
                        {/* iPhone mockup */}
                        <div className="max-w-sm mx-auto">
                          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] p-2 shadow-2xl">
                            <div className="bg-black rounded-[2.5rem] p-6">
                              <div className="bg-gray-900 rounded-2xl p-4 mb-4">
                                <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                                  <MessageSquare size={16} />
                                  <span>Message SMS</span>
                                </div>
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl p-4 shadow-lg">
                                  <div className="text-sm leading-relaxed">
                                    {contacts.length > 0 ? generatePreview(contacts[0]) : template}
                                  </div>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-600 mt-3">
                                  <span className="flex items-center space-x-1">
                                    <span>{sender}</span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <Clock size={12} />
                                    <span>{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-xl border border-white/10">
                          <MessageSquare className="w-10 h-10 text-purple-400" />
                        </div>
                        <span className="text-center text-lg">Commencez à taper pour voir la magie ✨</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="relative p-8 lg:p-10">
              <div className="mb-10">
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-3">
                  Galerie d&apos;Aperçus
                </h2>
                <p className="text-gray-400 text-lg">Validez chaque message avant l&apos;envoi</p>
              </div>
              
              {contacts.length === 0 || !template ? (
                <div className="text-center py-24">
                  <div className="relative inline-block mb-8">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mb-6 mx-auto backdrop-blur-xl border border-white/10">
                      <Eye className="h-16 w-16 text-purple-400" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">Aperçu en Attente</h3>
                  <p className="text-gray-400 max-w-md mx-auto text-lg">
                    Ajoutez des contacts et créez votre message pour débloquer les aperçus personnalisés
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {contacts.map((contact, index) => {
                    const nameField = csvHeaders.find(h => h.includes('nom') || h.includes('name')) || csvHeaders[0] || 'nom';
                    const phoneField = csvHeaders.find(h => h.includes('telephone') || h.includes('phone') || h.includes('tel') || h.includes('mobile')) || 'telephone';
                    
                    return (
                      <div key={contact.id} className="group relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 transform hover:scale-105">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-bold text-white">{String(contact[nameField]) || `Contact ${index + 1}`}</div>
                                <div className="text-sm text-gray-400 font-mono">{String(contact[phoneField]) || 'N/A'}</div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-4 text-sm border border-white/10 text-gray-300">
                            {generatePreview(contact)}
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-500 mt-4">
                            <span>{generatePreview(contact).length} caractères</span>
                            <span className="flex items-center space-x-1 text-green-400">
                              <CheckCircle size={14} />
                              <span>Prêt</span>
                            </span>
                          </div>
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
            <div className="relative p-8 lg:p-10">
              <div className="mb-10">
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-3">
                  Centre de Commande
                </h2>
                <p className="text-gray-400 text-lg">Lancez votre campagne et suivez les performances en temps réel</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/20">
                    <h3 className="text-2xl font-bold text-white mb-8 flex items-center space-x-3">
                      <Settings size={28} className="text-purple-400" />
                      <span>Configuration Finale</span>
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-5 border border-white/10 flex justify-between items-center group hover:scale-105 transition-transform duration-200">
                        <span className="text-purple-300 font-medium">Contacts ciblés</span>
                        <span className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{contacts.length}</span>
                      </div>
                      <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-5 border border-white/10 flex justify-between items-center group hover:scale-105 transition-transform duration-200">
                        <span className="text-blue-300 font-medium">Messages prévus</span>
                        <span className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">{contacts.length}</span>
                      </div>
                      <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-5 border border-white/10 flex justify-between items-center group hover:scale-105 transition-transform duration-200">
                        <span className="text-green-300 font-medium">Expéditeur</span>
                        <span className="font-black text-xl text-green-400">{sender}</span>
                      </div>
                      <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-5 border border-white/10 flex justify-between items-center group hover:scale-105 transition-transform duration-200">
                        <span className="text-yellow-300 font-medium">Template</span>
                        <span className={`font-black text-xl flex items-center space-x-2 ${template ? 'text-green-400' : 'text-red-400'}`}>
                          {template ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                          <span>{template ? 'Configuré' : 'Manquant'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={startCampaign}
                    disabled={contacts.length === 0 || !template || campaignStatus === 'running'}
                    className={`group relative w-full overflow-hidden flex items-center justify-center space-x-4 py-6 px-10 rounded-3xl font-black text-xl transition-all duration-500 transform ${
                      contacts.length === 0 || !template || campaignStatus === 'running'
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-2xl hover:shadow-purple-500/50 hover:scale-105'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    {campaignStatus === 'running' ? (
                      <>
                        <div className="relative z-10 animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
                        <span className="relative z-10">Envoi en cours...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={28} className="relative z-10 group-hover:animate-pulse" />
                        <span className="relative z-10">Déclencher la Campagne</span>
                        <ChevronRight size={24} className="relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
                      </>
                    )}
                  </button>
                </div>

                <div>
                  {campaignStatus !== 'idle' && (
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/20">
                      <h3 className="text-2xl font-bold text-white mb-8 flex items-center space-x-3">
                        <Activity size={28} className="text-blue-400 animate-pulse" />
                        <span>Tableau de Bord Live</span>
                      </h3>
                      
                      <div className="mb-8">
                        <div className="flex justify-between text-sm text-gray-400 mb-3">
                          <span className="font-medium">Progression globale</span>
                          <span className="font-black text-white">{Math.round(progress)}%</span>
                        </div>
                        <div className="relative w-full bg-black/30 backdrop-blur-xl rounded-full h-4 overflow-hidden border border-white/10">
                          <div 
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out shadow-lg shadow-purple-500/50"
                            style={{ width: `${progress}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-8">
                        <StatCard
                          title="Succès"
                          value={results.sent}
                          subtitle="Délivrés"
                          color="bg-gradient-to-br from-green-500 to-emerald-500"
                          icon={CheckCircle}
                        />
                        <StatCard
                          title="Échecs"
                          value={results.failed}
                          subtitle="Erreurs"
                          color="bg-gradient-to-br from-red-500 to-pink-500"
                          icon={AlertCircle}
                        />
                        <StatCard
                          title="Total"
                          value={results.total}
                          subtitle="Messages"
                          color="bg-gradient-to-br from-blue-500 to-cyan-500"
                          icon={Send}
                        />
                      </div>

                      {campaignStatus === 'completed' && (
                        <div className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-2xl border border-green-500/20 flex items-center">
                          <CheckCircle className="text-green-400 mr-4 flex-shrink-0" size={32} />
                          <div>
                            <div className="text-green-400 font-black text-xl">Mission Accomplie !</div>
                            <div className="text-green-300 text-sm mt-1">Votre campagne a été exécutée avec succès</div>
                          </div>
                        </div>
                      )}

                      {results.errors.length > 0 && (
                        <div className="mt-6 p-6 bg-red-500/10 backdrop-blur-xl rounded-2xl border border-red-500/20">
                          <h4 className="font-bold text-red-400 mb-3">Journal des erreurs :</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                            {results.errors.map((error, index) => (
                              <div key={index} className="text-sm text-red-300 bg-red-500/10 rounded-lg p-2">
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
            <div className="relative p-8 lg:p-10">
              <div className="mb-10">
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-3">
                  Analytics Dashboard
                </h2>
                <p className="text-gray-400 text-lg">Intelligence artificielle pour optimiser vos campagnes</p>
              </div>
              
              {campaignStatus === 'idle' ? (
                <div className="text-center py-24">
                  <div className="relative inline-block mb-8">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mb-6 mx-auto backdrop-blur-xl border border-white/10">
                      <BarChart3 className="h-16 w-16 text-purple-400" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">Analytics en Attente</h3>
                  <p className="text-gray-400 max-w-md mx-auto text-lg">
                    Les statistiques détaillées apparaîtront ici après votre première campagne
                  </p>
                </div>
              ) : (
                <div className="space-y-10">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                      title="Messages"
                      value={results.total}
                      subtitle="Total envoyé"
                      color="bg-gradient-to-br from-purple-500 to-pink-500"
                      icon={MessageSquare}
                      trend={12}
                    />
                    <StatCard
                      title="Délivrés"
                      value={results.sent}
                      subtitle="Avec succès"
                      color="bg-gradient-to-br from-green-500 to-emerald-500"
                      icon={CheckCircle}
                      trend={8}
                    />
                    <StatCard
                      title="Échecs"
                      value={results.failed}
                      subtitle="Non délivrés"
                      color="bg-gradient-to-br from-red-500 to-pink-500"
                      icon={AlertCircle}
                      trend={-2}
                    />
                    <StatCard
                      title="Performance"
                      value={`${results.total > 0 ? Math.round((results.sent / results.total) * 100) : 0}%`}
                      subtitle="Taux de succès"
                      color="bg-gradient-to-br from-blue-500 to-cyan-500"
                      icon={TrendingUp}
                      trend={5}
                    />
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10">
                    <div className="p-8 border-b border-white/10 bg-black/20">
                      <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
                        <FileText size={28} className="text-purple-400" />
                        <span>Rapport Détaillé</span>
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-black/30 border-b border-white/10">
                            <th className="px-8 py-5 text-left text-sm font-bold text-gray-300 uppercase tracking-wider">Contact</th>
                            <th className="px-8 py-5 text-left text-sm font-bold text-gray-300 uppercase tracking-wider">Téléphone</th>
                            <th className="px-8 py-5 text-left text-sm font-bold text-gray-300 uppercase tracking-wider">Statut</th>
                            <th className="px-8 py-5 text-left text-sm font-bold text-gray-300 uppercase tracking-wider">Horodatage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {contacts.map((contact) => {
                            const nameField = csvHeaders.find(h => h.includes('nom') || h.includes('name')) || csvHeaders[0] || 'nom';
                            const phoneField = csvHeaders.find(h => h.includes('telephone') || h.includes('phone') || h.includes('tel') || h.includes('mobile')) || 'telephone';
                            
                            return (
                              <tr key={contact.id} className="hover:bg-white/5 transition-colors duration-200">
                                <td className="px-8 py-5 text-sm font-medium text-white">{String(contact[nameField]) || 'N/A'}</td>
                                <td className="px-8 py-5 text-sm text-gray-400 font-mono">{String(contact[phoneField]) || 'N/A'}</td>
                                <td className="px-8 py-5">
                                  <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30">
                                    <CheckCircle size={14} className="mr-2" />
                                    Délivré
                                  </span>
                                </td>
                                <td className="px-8 py-5 text-sm text-gray-500 font-mono">
                                  {new Date().toLocaleString('fr-FR')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-6 bg-black/20 border-t border-white/10">
                      <button className="flex items-center justify-center space-x-2 text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200">
                        <Download size={20} />
                        <span>Exporter le rapport complet</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Voice Tab */}
          {activeTab === 'voice' && (
            <div className="relative p-8 lg:p-10">
              <div className="mb-10">
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-3">
                  Voice AI Revolution
                </h2>
                <p className="text-gray-400 text-lg">Assistant vocal nouvelle génération propulsé par l&apos;intelligence artificielle</p>
              </div>

              <VoiceCampaignSection 
                contacts={contacts} 
                template={template} 
              />
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

export default SMSCampaignSystem;