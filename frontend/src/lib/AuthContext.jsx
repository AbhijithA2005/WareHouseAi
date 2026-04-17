import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Mocking an immediate local login
    const checkAppState = async () => {
      setIsLoadingAuth(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockUser = {
        id: 'local-user-1',
        name: 'Local Admin',
        email: 'admin@localhost',
      };
      
      setUser(mockUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    };

    checkAppState();
  }, []);

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const navigateToLogin = () => {
    // In local mode, we don't have a login page by default, but we can reset state
    console.warn("navigateToLogin called in local mode.");
  };

  const checkUserAuth = async () => {
    // Nothing to check locally
    return true;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings: false, // removed base44 dependencies
      authError,
      appPublicSettings: null,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
