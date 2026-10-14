import { createContext } from 'react';
import { User } from '../types';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialLoading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  triggerRefresh: () => void;
  refreshTrigger: number;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  initialLoading: true,
  login: () => {},
  logout: () => {},
  triggerRefresh: () => {},
  refreshTrigger: 0,
});
