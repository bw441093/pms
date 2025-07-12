import React from 'react';
import { Box } from '@mui/material';

interface LoadingStatesProps {
  loading: boolean;
  error: any;
}

const LoadingStates: React.FC<LoadingStatesProps> = ({ loading, error }) => {
  if (loading) {
    return <Box p={4}>טוען...</Box>;
  }
  
  if (error) {
    return <Box p={4}>שגיאה בטעינת המשתמש</Box>;
  }
  
  return null;
};

export default LoadingStates; 