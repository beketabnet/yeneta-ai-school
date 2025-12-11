import { useContext, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export interface CurrentUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  full_name: string;
}

export const useCurrentUser = (): CurrentUser | null => {
  const { user } = useContext(AuthContext);

  return useMemo(() => {
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      role: user.role || '',
      full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    };
  }, [user]);
};
