'use client';

import React, { useState } from 'react';
import { 
  MessageSquare, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Star,
  Activity
} from 'lucide-react';
import { UserInfo } from './page'; // Add this import if not already present

interface LoginPageProps {
  onLogin: (user: UserInfo) => void;
}

// Animated Background Component (same as in main app)
const AnimatedBackground = () => {
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
      `}</style>
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>
    </>
  );
};

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For now, accept any email and password
    if (email && password) {
      onLogin({
          email,
          username: '',
          name: ''
      });
    } else {
      setError('Veuillez remplir tous les champs');
    }
    
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
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

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-3xl shadow-2xl shadow-purple-500/25 transform rotate-3 hover:rotate-6 transition-transform duration-300">
              <MessageSquare className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
          </div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200 mb-3">
            NexusMessage Pro
          </h1>
          <p className="text-gray-400 flex items-center justify-center space-x-2 text-lg">
            <Sparkles size={20} className="text-purple-400 animate-pulse" />
            <span>Plateforme Premium SMS & Voice AI</span>
            <Star size={18} className="text-yellow-400" />
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Connexion Sécurisée
          </h2>

          <div className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-bold text-purple-300 mb-3 uppercase tracking-wider">
                Email Professionnel
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-purple-400 group-focus-within:text-purple-300 transition-colors duration-200" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-500"
                  placeholder="vous@entreprise.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-bold text-purple-300 mb-3 uppercase tracking-wider">
                Mot de Passe
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-purple-400 group-focus-within:text-purple-300 transition-colors duration-200" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl pl-12 pr-12 py-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl">
                <p className="text-sm text-red-400 flex items-center">
                  <Activity size={16} className="mr-2 flex-shrink-0" />
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className={`group relative w-full overflow-hidden flex items-center justify-center space-x-3 py-4 px-8 rounded-2xl font-bold text-lg transition-all duration-500 transform ${
                isLoading
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-2xl hover:shadow-purple-500/50 hover:scale-105'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {isLoading ? (
                <>
                  <div className="relative z-10 animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span className="relative z-10">Connexion...</span>
                </>
              ) : (
                <>
                  <Zap size={22} className="relative z-10 group-hover:animate-pulse" />
                  <span className="relative z-10">Accéder à la Plateforme</span>
                  <ArrowRight size={20} className="relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
                </>
              )}
            </button>
          </div>

          {/* Features */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="group">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mb-2 mx-auto backdrop-blur-xl border border-white/10 group-hover:scale-110 transition-transform duration-200">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-xs text-gray-400">Sécurisé</p>
              </div>
              <div className="group">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-2 mx-auto backdrop-blur-xl border border-white/10 group-hover:scale-110 transition-transform duration-200">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-xs text-gray-400">Rapide</p>
              </div>
              <div className="group">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center mb-2 mx-auto backdrop-blur-xl border border-white/10 group-hover:scale-110 transition-transform duration-200">
                  <Star className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-xs text-gray-400">Premium</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          © 2025 NexusMessage. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;