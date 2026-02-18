// FieldSync v2 - App Context Composer
// Wraps all providers in the correct order
import React from 'react';
import { ThemeProvider } from './ThemeContext';
import { NotificationProvider } from './NotificationContext';
import { AuthProvider } from './AuthContextV2';
import { DataProvider } from './DataContext';

// Compose providers in dependency order:
// 1. Theme (no deps)
// 2. Notification (no deps)
// 3. Auth (no deps on other contexts)
// 4. Data (depends on Auth for currentUser)
export const AppProviders = ({ children }) => (
  <ThemeProvider>
    <NotificationProvider>
      <AuthProvider>
        <DataProvider>
          {children}
        </DataProvider>
      </AuthProvider>
    </NotificationProvider>
  </ThemeProvider>
);

export default AppProviders;
