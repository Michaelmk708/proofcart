import { createContext } from 'react';
import type { AppState, AppActions } from '@/types/appState';

export type ProviderValue = {
  state: AppState;
  actions: AppActions;
};

export const AppStateContext = createContext<ProviderValue | undefined>(undefined);
