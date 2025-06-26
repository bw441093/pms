import { Stack, Typography, useTheme } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import React from 'react';

export default function CalendarPage() {
  const theme = useTheme();
  
  return (
    <Stack alignItems='center' justifyContent='center' height='100vh' spacing={6}>
      <BuildIcon sx={{color: theme.palette.custom.surfaceContainerLow, fontSize: 100}} />
      <Typography color={theme.palette.custom.surfaceContainerLow} fontSize={25}>Coming soon</Typography>
    </Stack>
  );
} 