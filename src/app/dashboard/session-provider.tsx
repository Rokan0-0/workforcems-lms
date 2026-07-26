'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'HR Admin' | 'Employee';
  departmentId: string;
  hireDate: string;
  profilePhoto: string;
}

export interface SessionContextType {
  user: UserSession | null;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  switchRole: (employeeId: string) => Promise<void>;
  loading: boolean;
  triggerRefresh: () => void;
  refreshFlag: number;
}

export const SessionContext = createContext<SessionContextType | null>(null);

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

// Client-side cache store for API requests
const clientCache: Record<string, any> = {};

export function getCachedData(key: string): any {
  if (typeof window === 'undefined') return null;
  return clientCache[key] || null;
}

export function setCachedData(key: string, data: any): void {
  if (typeof window === 'undefined') return;
  clientCache[key] = data;
}

export function clearCache(): void {
  if (typeof window === 'undefined') return;
  for (const key in clientCache) {
    delete clientCache[key];
  }
}

