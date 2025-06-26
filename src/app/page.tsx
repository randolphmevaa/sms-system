'use client';

import React, { useState, useEffect } from 'react';
import LoginPage from './LoginPage'; // The login component we just created
import SMSCampaignSystem from './SMSCampaignSystem'; // Your existing SMS system component

export type UserInfo = {
  username: string;
  email: string;
  name: string;
  // Add other fields as needed, e.g. token?: string;
};

export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ , setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (for now, just check session storage)
    const savedAuth = sessionStorage.getItem('nexusAuth');
    if (savedAuth) {
      const authData: UserInfo = JSON.parse(savedAuth);
      setUserInfo(authData);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData: UserInfo) => {
    // Save auth state (in a real app, this would be a secure token)
    sessionStorage.setItem('nexusAuth', JSON.stringify(userData));
    setUserInfo(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('nexusAuth');
    setUserInfo(null);
    setIsAuthenticated(false);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Show SMS campaign system if authenticated
  // You might want to pass userInfo or logout function as props if needed
  return (
    <div>
      {/* Optional: Add a logout button in the header */}
      <SMSCampaignSystem />
      
      {/* Floating logout button */}
      <button
        onClick={handleLogout}
        className="fixed bottom-8 right-8 bg-red-500/20 backdrop-blur-xl text-red-400 px-6 py-3 rounded-2xl border border-red-500/30 hover:bg-red-500/30 hover:text-red-300 transition-all duration-200 font-medium flex items-center space-x-2 shadow-xl"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span>Déconnexion</span>
      </button>
    </div>
  );
}