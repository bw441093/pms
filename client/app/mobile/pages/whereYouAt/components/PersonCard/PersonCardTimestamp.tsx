import React from 'react';
import { Typography } from '@mui/material';

interface PersonCardTimestampProps {
  updatedAt: string;
}

const PersonCardTimestamp: React.FC<PersonCardTimestampProps> = ({ updatedAt }) => (
  <Typography
    variant="caption"
    color="text.secondary"
    sx={{ fontSize: 12, textAlign: 'left', mt: 1, display: 'block' }}
  >
    {new Date(updatedAt).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date(updatedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
  </Typography>
);

export default PersonCardTimestamp; 