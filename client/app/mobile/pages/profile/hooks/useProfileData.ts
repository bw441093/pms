import { useMemo } from 'react';
import { useUserDataWithManager } from '../../../../hooks/useQueries';
import type { Person } from '../../../../types';

export const useProfileData = () => {
  const userId = useMemo(() => localStorage.getItem('login_token') || '', []);
  const { data: user, isLoading: loading, error } = useUserDataWithManager(userId);

  const hasReport = useMemo(() => {
    return Boolean(user?.reportStatus && user?.location);
  }, [user]);

  return {
    user,
    loading,
    error,
    hasReport,
  };
}; 