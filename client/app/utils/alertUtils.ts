import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';

export interface AlertResult {
  success: boolean;
  error?: string;
}

export const handleAlertAll = async (queryClient: QueryClient): Promise<AlertResult> => {
  try {
    await axios.post('/api/users/alert-all');

    // Invalidate and refetch person data to update the UI
    await queryClient.invalidateQueries({ queryKey: ['people'] });

    console.log('All users alerted successfully');
    return { success: true };
  } catch (err: any) {
    console.error('Error alerting all users:', err);
    const errorMessage = err.response?.data || 'נכשל ניסיון לשלוח התראה לכל המשתמשים';
    return { success: false, error: errorMessage };
  }
}; 