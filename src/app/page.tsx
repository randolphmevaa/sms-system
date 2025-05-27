'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Upload, 
  MessageSquare, 
  Users, 
  Send, 
  Eye, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Plus,
  Trash2,
  Edit3,
  Play,
  Pause,
  BarChart3,
  Sparkles,
  Zap,
  Target,
  Clock,
  TrendingUp,
  Shield,
  Globe,
  Wifi
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

type CampaignStatus = 'idle' | 'running' | 'paused' | 'completed';
type TabType = 'contacts' | 'template' | 'preview' | 'campaign' | 'results';

interface TabButtonProps {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isActive: boolean;
  onClick: (id: TabType) => void;
  badge?: number;
}

const SMSCampaignSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [template, setTemplate] = useState<string>('');
  const [expediteur, setExpediteur] = useState<string>('');
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [results, setResults] = useState<CampaignResults>({ sent: 0, failed: 0, total: 0, errors: [] });
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');

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
    if (contacts.length === 0 || !template || !expediteur) return;
    
    // Find phone number field
    const phoneField = csvHeaders.find(header => 
      header.includes('telephone') || header.includes('phone') || header.includes('tel') || header.includes('mobile')
    ) || 'telephone';
    
    setCampaignStatus('running');
    setResults({ sent: 0, failed: 0, total: contacts.length, errors: [] });
    
    // Real API integration simulation
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
        // Simulate API call
        const success = Math.random() > 0.1; // 90% success rate for demo
        
        if (success) {
          setResults(prev => ({ 
            ...prev, 
            sent: prev.sent + 1 
          }));
        } else {
          setResults(prev => ({ 
            ...prev, 
            failed: prev.failed + 1,
            errors: [...prev.errors, { contact: String(contact[csvHeaders[0]] || `Contact ${i + 1}`), error: 'Erreur d\'envoi simulée' }]
          }));
        }
      } catch (error) {
        setResults(prev => ({ 
          ...prev, 
          failed: prev.failed + 1,
          errors: [...prev.errors, { contact: String(contact[csvHeaders[0]] || `Contact ${i + 1}`), error: 'Erreur réseau' }]
        }));
      }
      
      setProgress(((i + 1) / contacts.length) * 100);
      // Small delay to see progress
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setCampaignStatus('completed');
  };

  const TabButton: React.FC<TabButtonProps> = ({ id, label, icon: Icon, isActive, onClick, badge }) => (
    <button
      onClick={() => onClick(id)}
      className={`group relative flex items-center space-x-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-500 transform hover:scale-105 ${
        isActive 
          ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-2xl shadow-purple-500/30 scale-105' 
          : 'bg-white/80 backdrop-blur-xl text-gray-700 hover:bg-white hover:text-gray-900 shadow-xl hover:shadow-2xl border border-white/50 hover:border-white/80'
      }`}
    >
      <div className="relative">
        <Icon size={22} className={`transition-all duration-500 ${isActive ? 'scale-110 drop-shadow-lg' : 'group-hover:scale-110'}`} />
        {badge && badge > 0 && (
          <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
            {badge}
          </span>
        )}
      </div>
      <span className="relative font-bold">
        {label}
        {isActive && (
          <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white/60 rounded-full shadow-sm"></div>
        )}
      </span>
      {isActive && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 animate-pulse"></div>
      )}
    </button>
  );

  const StatCard: React.FC<{ title: string; value: string | number; subtitle: string; gradient: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = 
    ({ title, value, subtitle, gradient, icon: Icon }) => (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-2xl transform hover:scale-105 transition-all duration-500 relative overflow-hidden group`}>
      <div className="absolute top-0 right-0 opacity-10 transform rotate-12 scale-150">
        <Icon size={80} />
      </div>
      <div className="relative z-10">
        <div className="text-4xl font-black mb-2 drop-shadow-lg">{value}</div>
        <div className="text-white/90 font-semibold text-lg mb-1">{title}</div>
        <div className="text-white/70 text-sm font-medium">{subtitle}</div>
      </div>
      <div className="absolute inset-0 bg-white/5 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-indigo-500/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-full blur-2xl animate-float"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 20}s`
            }}
          />
        ))}
      </div>

      {/* Enhanced Header */}
      <div className="relative bg-black/20 backdrop-blur-2xl shadow-2xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center space-x-6">
              <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 rounded-3xl shadow-2xl">
                <MessageSquare className="h-10 w-10 text-white drop-shadow-lg" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <Wifi size={12} className="text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent drop-shadow-xl">
                  Campagne SMS Pro
                </h1>
                <p className="text-lg text-white/70 flex items-center space-x-3 mt-2">
                  <Sparkles size={16} className="text-yellow-400" />
                  <span className="font-semibold">Système de publipostage SMS professionnel</span>
                  <Shield size={16} className="text-green-400" />
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center bg-black/30 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
                <div className="text-sm text-white/60 font-semibold uppercase tracking-wider">Contacts</div>
                <div className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {contacts.length}
                </div>
                <div className="flex items-center justify-center space-x-1 mt-1">
                  <TrendingUp size={12} className="text-green-400" />
                  <span className="text-xs text-green-400 font-medium">Actifs</span>
                </div>
              </div>
              <div className="text-center bg-black/30 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
                <div className="text-sm text-white/60 font-semibold uppercase tracking-wider">Statut</div>
                <div className={`text-2xl font-black ${
                  campaignStatus === 'completed' ? 'text-green-400' :
                  campaignStatus === 'running' ? 'text-blue-400' :
                  'text-white/60'
                }`}>
                  {campaignStatus === 'completed' ? 'Terminé' :
                   campaignStatus === 'running' ? 'En cours' :
                   'Prêt'}
                </div>
                <div className="flex items-center justify-center space-x-1 mt-1">
                  <Globe size={12} className="text-blue-400" />
                  <span className="text-xs text-blue-400 font-medium">Système</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Navigation Tabs */}
        <div className="flex flex-wrap gap-6 mb-12 p-4 bg-black/20 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10">
          <TabButton 
            id="contacts" 
            label="Contacts" 
            icon={Users} 
            isActive={activeTab === 'contacts'}
            onClick={setActiveTab}
            badge={contacts.length}
          />
          <TabButton 
            id="template" 
            label="Message" 
            icon={Edit3} 
            isActive={activeTab === 'template'}
            onClick={setActiveTab}
            badge={template ? 1 : 0}
          />
          <TabButton 
            id="preview" 
            label="Aperçu" 
            icon={Eye} 
            isActive={activeTab === 'preview'}
            onClick={setActiveTab}
          />
          <TabButton 
            id="campaign" 
            label="Campagne" 
            icon={Send} 
            isActive={activeTab === 'campaign'}
            onClick={setActiveTab}
          />
          <TabButton 
            id="results" 
            label="Résultats" 
            icon={BarChart3} 
            isActive={activeTab === 'results'}
            onClick={setActiveTab}
            badge={results.sent}
          />
        </div>

        {/* Enhanced Content Area */}
        <div className="bg-black/20 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
          
          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div className="p-10">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-4xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-3">
                    Gestion des Contacts
                  </h2>
                  <p className="text-white/60 text-lg">Importez vos contacts ou ajoutez-les manuellement pour votre campagne</p>
                </div>
                <div className="flex space-x-4">
                  <label className="group bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white px-8 py-4 rounded-2xl cursor-pointer transition-all duration-500 transform hover:scale-105 shadow-2xl hover:shadow-blue-500/25 flex items-center space-x-3 border border-blue-500/30">
                    <Upload size={22} className="group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-bold text-lg">Importer CSV</span>
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                  </label>
                  <button 
                    onClick={addContact}
                    className="group bg-gradient-to-r from-emerald-600 via-green-700 to-teal-700 hover:from-emerald-700 hover:via-green-800 hover:to-teal-800 text-white px-8 py-4 rounded-2xl transition-all duration-500 transform hover:scale-105 shadow-2xl hover:shadow-emerald-500/25 flex items-center space-x-3 border border-emerald-500/30"
                  >
                    <Plus size={22} className="group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-bold text-lg">Ajouter</span>
                  </button>
                </div>
              </div>

              {contacts.length === 0 ? (
                <div className="text-center py-20">
                  <div className="relative inline-block mb-8">
                    <Upload className="mx-auto h-20 w-20 text-white/30" />
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                      <Plus size={16} className="text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Aucun contact chargé</h3>
                  <p className="text-white/60 mb-8 max-w-md mx-auto text-lg">
                    Commencez par importer un fichier CSV ou ajouter des contacts manuellement pour créer votre campagne professionnelle
                  </p>
                  {uploadError && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-300 max-w-md mx-auto backdrop-blur-xl">
                      <AlertCircle size={18} className="inline mr-2" />
                      {uploadError}
                    </div>
                  )}
                  {isUploading && (
                    <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-2xl text-blue-300 max-w-md mx-auto backdrop-blur-xl">
                      <div className="animate-spin inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full mr-3"></div>
                      Traitement du fichier CSV en cours...
                    </div>
                  )}
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl p-8 max-w-2xl mx-auto border border-blue-500/20 backdrop-blur-xl">
                    <h4 className="font-bold text-white mb-6 flex items-center justify-center space-x-3 text-xl">
                      <FileText size={24} className="text-blue-400" />
                      <span>Format CSV Recommandé</span>
                    </h4>
                    <div className="text-white/80 space-y-4 text-left">
                      <div className="flex items-center space-x-3">
                        <CheckCircle size={16} className="text-green-400" />
                        <span>Première ligne = en-têtes des colonnes</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle size={16} className="text-green-400" />
                        <span>Variables automatiquement détectées</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle size={16} className="text-green-400" />
                        <span>Séparateur : virgule (,)</span>
                      </div>
                      <code className="block bg-black/40 backdrop-blur-xl px-6 py-4 rounded-2xl mt-6 border border-white/10 text-green-300 font-mono">
                        nom,telephone,rdv,date<br/>
                        Martin Dubois,+33123456789,14h30,2024-05-28
                      </code>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-black/30 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-b border-white/10">
                          {(csvHeaders.length > 0 ? csvHeaders : ['nom', 'telephone', 'rdv', 'date']).map(header => (
                            <th key={header} className="px-8 py-6 text-left text-sm font-bold text-white uppercase tracking-wider">
                              {header.replace(/_/g, ' ')}
                            </th>
                          ))}
                          <th className="px-8 py-6 text-center text-sm font-bold text-white uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {contacts.map((contact, index) => (
                          <tr key={contact.id} className="hover:bg-white/5 transition-all duration-300">
                            {(csvHeaders.length > 0 ? csvHeaders : ['nom', 'telephone', 'rdv', 'date']).map(field => (
                              <td key={field} className="px-8 py-6">
                                <input 
                                  value={String(contact[field] || '')}
                                  onChange={(e) => updateContact(contact.id, field, e.target.value)}
                                  className="w-full border border-white/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-black/40 backdrop-blur-xl text-white placeholder-white/40 font-medium shadow-inner"
                                  placeholder={field}
                                />
                              </td>
                            ))}
                            <td className="px-8 py-6 text-center">
                              <button 
                                onClick={() => deleteContact(contact.id)}
                                className="text-red-400 hover:text-red-300 p-3 rounded-xl hover:bg-red-500/20 transition-all duration-300 transform hover:scale-110 border border-red-500/20 hover:border-red-500/40"
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
                    <div className="p-6 bg-green-500/10 border-t border-green-500/20 backdrop-blur-xl">
                      <div className="text-green-300 flex items-center text-lg">
                        <CheckCircle size={20} className="mr-3" />
                        <span className="font-bold">Variables détectées et disponibles :</span>
                        <div className="ml-4 flex flex-wrap gap-2">
                          {csvHeaders.map(header => (
                            <span key={header} className="bg-green-500/20 text-green-200 px-3 py-2 rounded-xl text-sm font-mono border border-green-500/30 shadow-lg">
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
            <div className="p-10">
              <div className="mb-10">
                <h2 className="text-4xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-3">
                  Modèle de Message
                </h2>
                <p className="text-white/60 text-lg">Créez votre message personnalisé avec des variables dynamiques</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-bold text-white mb-4 uppercase tracking-wider">
                      Expéditeur (obligatoire)
                    </label>
                    <input
                      value={expediteur}
                      onChange={(e) => setExpediteur(e.target.value)}
                      className="w-full border border-white/20 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-black/40 backdrop-blur-xl shadow-inner text-white placeholder-white/40 font-semibold text-lg"
                      placeholder="Nom de l'expéditeur"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-white mb-4 uppercase tracking-wider">
                      Message Template
                    </label>
                    <textarea
                      value={template}
                      onChange={(e) => setTemplate(e.target.value)}
                      className="w-full h-80 border border-white/20 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 resize-none bg-black/40 backdrop-blur-xl shadow-inner text-white placeholder-white/40 font-medium text-lg leading-relaxed"
                      placeholder={csvHeaders.length > 0 
                        ? `Bonjour {${csvHeaders[0] || 'nom'}}, votre message personnalisé ici...`
                        : "Importez d'abord un CSV pour voir les variables disponibles"
                      }
                    />
                    <div className="mt-6 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-blue-500/20 backdrop-blur-xl">
                      <p className="font-bold text-white mb-4 flex items-center space-x-3 text-lg">
                        <Target size={20} className="text-blue-400" />
                        <span>Variables disponibles</span>
                      </p>
                      {csvHeaders.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          {csvHeaders.map(variable => (
                            <span 
                              key={variable} 
                              className="bg-black/40 backdrop-blur-xl text-blue-300 px-4 py-2 rounded-xl text-sm font-mono border border-blue-400/30 shadow-lg hover:shadow-blue-400/20 transition-all duration-300 cursor-pointer hover:scale-105 hover:bg-blue-500/20"
                              onClick={() => setTemplate(prev => prev + `{${variable}}`)}
                            >
                              {`{${variable}}`}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-white/50 italic text-lg">
                          Les variables apparaîtront ici après l'import d'un fichier CSV
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-white mb-4 uppercase tracking-wider">
                    Aperçu en Temps Réel
                  </label>
                  <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-white/10 rounded-2xl p-8 h-96 overflow-y-auto shadow-2xl backdrop-blur-xl">
                    {template ? (
                      <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-2xl p-6 shadow-2xl border-l-4 border-purple-500 transform hover:scale-105 transition-all duration-500 backdrop-blur-xl">
                        <div className="flex items-center space-x-3 text-sm text-white/60 mb-4">
                          <MessageSquare size={16} />
                          <span className="font-semibold">Aperçu SMS</span>
                        </div>
                        <div className="text-white leading-relaxed font-medium text-lg">
                          {contacts.length > 0 ? generatePreview(contacts[0]) : template}
                        </div>
                        <div className="flex justify-between items-center text-sm text-white/50 mt-4 pt-4 border-t border-white/10">
                          <span className="font-medium">
                            {(contacts.length > 0 ? generatePreview(contacts[0]) : template).length} caractères
                          </span>
                          <span className="flex items-center space-x-2 font-medium">
                            <Clock size={14} />
                            <span>{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-white/40">
                        <MessageSquare className="mb-4" size={48} />
                        <span className="text-center text-lg font-medium">Saisissez votre message pour voir l'aperçu en temps réel</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="p-10">
              <div className="mb-10">
                <h2 className="text-4xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-3">
                  Aperçu des Messages
                </h2>
                <p className="text-white/60 text-lg">Vérifiez chaque message personnalisé avant l'envoi</p>
              </div>
              
              {contacts.length === 0 || !template ? (
                <div className="text-center py-20">
                  <div className="relative inline-block mb-8">
                    <Eye className="mx-auto h-20 w-20 text-white/30" />
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                      <AlertCircle size={16} className="text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Aperçu non disponible</h3>
                  <p className="text-white/60 max-w-md mx-auto text-lg">
                    Veuillez ajouter des contacts et créer un modèle de message pour voir l'aperçu
                  </p>
                </div>
              ) : (
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {contacts.map((contact, index) => {
                    const nameField = csvHeaders.find(h => h.includes('nom') || h.includes('name')) || csvHeaders[0] || 'nom';
                    const phoneField = csvHeaders.find(h => h.includes('telephone') || h.includes('phone') || h.includes('tel') || h.includes('mobile')) || 'telephone';
                    
                    return (
                      <div key={contact.id} className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 transform hover:scale-[1.02]">
                        <div className="flex justify-between items-start mb-6">
                          <div className="font-bold text-white flex items-center space-x-4 text-lg">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-lg font-black shadow-lg">
                              {index + 1}
                            </div>
                            <span>{String(contact[nameField]) || `Contact ${index + 1}`}</span>
                          </div>
                          <div className="text-sm text-white/60 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/20 font-mono">
                            {String(contact[phoneField]) || 'N/A'}
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-xl p-6 text-white border border-white/10 shadow-inner font-medium text-lg leading-relaxed">
                          {generatePreview(contact)}
                        </div>
                        <div className="flex justify-between items-center text-sm text-white/50 mt-4">
                          <span className="font-medium">{generatePreview(contact).length} caractères</span>
                          <span className="flex items-center space-x-2 font-medium">
                            <CheckCircle size={14} className="text-green-400" />
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
            <div className="p-10">
              <div className="mb-10">
                <h2 className="text-4xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-3">
                  Lancement de Campagne
                </h2>
                <p className="text-white/60 text-lg">Contrôlez et suivez l'envoi de votre campagne SMS</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl p-10 border border-blue-500/20 shadow-2xl backdrop-blur-xl">
                    <h3 className="text-2xl font-bold text-white mb-8 flex items-center space-x-3">
                      <Sparkles size={24} className="text-yellow-400" />
                      <span>Résumé de la Campagne</span>
                    </h3>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center p-4 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
                        <span className="text-white/80 font-semibold text-lg">Nombre de contacts :</span>
                        <span className="font-black text-white text-2xl">{contacts.length}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
                        <span className="text-white/80 font-semibold text-lg">Messages à envoyer :</span>
                        <span className="font-black text-white text-2xl">{contacts.length}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
                        <span className="text-white/80 font-semibold text-lg">Expéditeur :</span>
                        <span className={`font-black text-xl ${expediteur ? 'text-green-400' : 'text-red-400'}`}>
                          {expediteur || 'Non défini'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
                        <span className="text-white/80 font-semibold text-lg">Statut du modèle :</span>
                        <span className={`font-black text-xl flex items-center space-x-2 ${template ? 'text-green-400' : 'text-red-400'}`}>
                          {template ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                          <span>{template ? 'Prêt' : 'Non défini'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={startCampaign}
                    disabled={contacts.length === 0 || !template || !expediteur || campaignStatus === 'running'}
                    className={`w-full flex items-center justify-center space-x-4 py-6 px-10 rounded-3xl font-black text-xl transition-all duration-500 transform ${
                      contacts.length === 0 || !template || !expediteur || campaignStatus === 'running'
                        ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 text-white shadow-2xl hover:shadow-emerald-500/25 hover:scale-105 border border-emerald-500/30'
                    }`}
                  >
                    <Zap size={28} className={campaignStatus === 'running' ? 'animate-pulse' : ''} />
                    <span>
                      {campaignStatus === 'running' ? 'Envoi en cours...' : 'Lancer la Campagne'}
                    </span>
                  </button>
                </div>

                <div>
                  {campaignStatus !== 'idle' && (
                    <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
                      <h3 className="text-2xl font-bold mb-8 flex items-center space-x-3 text-white">
                        <BarChart3 size={24} className="text-blue-400" />
                        <span>Progression en Temps Réel</span>
                      </h3>
                      
                      <div className="mb-8">
                        <div className="flex justify-between text-lg text-white/80 mb-4 font-semibold">
                          <span>Envoi en cours...</span>
                          <span className="font-black text-xl">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-4 overflow-hidden shadow-inner border border-white/10">
                          <div 
                            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-4 rounded-full transition-all duration-1000 shadow-lg relative"
                            style={{ width: `${progress}%` }}
                          >
                            <div className="h-full bg-white/20 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6 mb-8">
                        <StatCard
                          title="Envoyés"
                          value={results.sent}
                          subtitle="Avec succès"
                          gradient="from-emerald-600 to-green-600"
                          icon={CheckCircle}
                        />
                        <StatCard
                          title="Échecs"
                          value={results.failed}
                          subtitle="À retraiter"
                          gradient="from-red-600 to-rose-600"
                          icon={AlertCircle}
                        />
                        <StatCard
                          title="Total"
                          value={results.total}
                          subtitle="Messages"
                          gradient="from-blue-600 to-indigo-600"
                          icon={Send}
                        />
                      </div>

                      {campaignStatus === 'completed' && (
                        <div className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/30 flex items-center shadow-2xl backdrop-blur-xl">
                          <CheckCircle className="text-green-400 mr-4 flex-shrink-0" size={32} />
                          <div>
                            <div className="text-green-300 font-bold text-xl">Campagne terminée avec succès !</div>
                            <div className="text-green-400 text-lg font-medium">Tous les messages ont été traités</div>
                          </div>
                        </div>
                      )}

                      {results.errors.length > 0 && (
                        <div className="mt-6 p-6 bg-gradient-to-r from-red-500/20 to-rose-500/20 rounded-2xl border border-red-500/30 backdrop-blur-xl">
                          <h4 className="font-bold text-red-300 mb-4 text-lg">Erreurs rencontrées :</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {results.errors.map((error, index) => (
                              <div key={index} className="text-red-200 font-medium">
                                <span className="font-bold">{error.contact}:</span> {error.error}
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
            <div className="p-10">
              <div className="mb-10">
                <h2 className="text-4xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-3">
                  Résultats de Campagne
                </h2>
                <p className="text-white/60 text-lg">Analysez les performances de votre campagne SMS</p>
              </div>
              
              {campaignStatus === 'idle' ? (
                <div className="text-center py-20">
                  <div className="relative inline-block mb-8">
                    <BarChart3 className="mx-auto h-20 w-20 text-white/30" />
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                      <Play size={16} className="text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Aucune campagne lancée</h3>
                  <p className="text-white/60 max-w-md mx-auto text-lg">
                    Les résultats et analytics apparaîtront ici après le lancement de votre première campagne
                  </p>
                </div>
              ) : (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <StatCard
                      title="Messages Total"
                      value={results.total}
                      subtitle="Campagne complète"
                      gradient="from-blue-600 via-indigo-600 to-purple-600"
                      icon={MessageSquare}
                    />
                    <StatCard
                      title="Envoyés"
                      value={results.sent}
                      subtitle="Avec succès"
                      gradient="from-emerald-600 via-green-600 to-teal-600"
                      icon={CheckCircle}
                    />
                    <StatCard
                      title="Échecs"
                      value={results.failed}
                      subtitle="À retraiter"
                      gradient="from-red-600 via-rose-600 to-pink-600"
                      icon={AlertCircle}
                    />
                    <StatCard
                      title="Taux de Succès"
                      value={`${results.total > 0 ? Math.round((results.sent / results.total) * 100) : 0}%`}
                      subtitle="Performance"
                      gradient="from-purple-600 via-violet-600 to-indigo-600"
                      icon={TrendingUp}
                    />
                  </div>

                  <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="p-8 border-b border-white/10 bg-gradient-to-r from-gray-800/50 to-gray-700/50">
                      <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
                        <FileText size={24} className="text-blue-400" />
                        <span>Détails de la Campagne</span>
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-800/30">
                            <th className="px-8 py-6 text-left text-sm font-bold text-white uppercase tracking-wider">Contact</th>
                            <th className="px-8 py-6 text-left text-sm font-bold text-white uppercase tracking-wider">Téléphone</th>
                            <th className="px-8 py-6 text-left text-sm font-bold text-white uppercase tracking-wider">Statut</th>
                            <th className="px-8 py-6 text-left text-sm font-bold text-white uppercase tracking-wider">Heure d'envoi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {contacts.map((contact) => {
                            const nameField = csvHeaders.find(h => h.includes('nom') || h.includes('name')) || csvHeaders[0] || 'nom';
                            const phoneField = csvHeaders.find(h => h.includes('telephone') || h.includes('phone') || h.includes('tel') || h.includes('mobile')) || 'telephone';
                            
                            return (
                              <tr key={contact.id} className="hover:bg-white/5 transition-all duration-300">
                                <td className="px-8 py-6 text-lg font-semibold text-white">{String(contact[nameField]) || 'N/A'}</td>
                                <td className="px-8 py-6 text-white/80 font-mono">{String(contact[phoneField]) || 'N/A'}</td>
                                <td className="px-8 py-6">
                                  <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30 shadow-lg">
                                    <CheckCircle size={16} className="mr-2" />
                                    Envoyé
                                  </span>
                                </td>
                                <td className="px-8 py-6 text-white/60 font-mono text-lg">
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
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(1deg); }
          66% { transform: translateY(5px) rotate(-1deg); }
        }
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default SMSCampaignSystem;