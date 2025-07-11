import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface NavBarContextType {
  showNavBar: boolean;
  setShowNavBar: (show: boolean) => void;
}

const NavBarContext = createContext<NavBarContextType | undefined>(undefined);

export const NavBarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showNavBar, setShowNavBar] = useState(true);

  return (
    <NavBarContext.Provider value={{ showNavBar, setShowNavBar }}>
      {children}
    </NavBarContext.Provider>
  );
};

export const useNavBar = () => {
  const context = useContext(NavBarContext);
  if (context === undefined) {
    throw new Error('useNavBar must be used within a NavBarProvider');
  }
  return context;
}; 