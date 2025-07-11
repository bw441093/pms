import React from 'react';
import { Box, Stack, Typography, useTheme } from '@mui/material';

interface ProfileInfoRowProps {
  title: string;
  value: string;
  bgcolor: string;
  iconBgColor: string;
  icon: React.ReactNode;
}


const ProfileInfoRow: React.FC<ProfileInfoRowProps> = ({ title, value, icon, bgcolor, iconBgColor }) => {
  const theme = useTheme();

  return (<Stack display="flex" direction='row' spacing={2} alignItems="center" bgcolor={bgcolor} borderRadius={2} p={1} dir="rtl" flexDirection="row-reverse">
    <Box flex={1} textAlign="right">
      <Typography fontSize={14} color={theme.palette.custom.surfaceContainerHighest} fontWeight={600}>{title}</Typography>
      <Typography fontWeight={700}>{value}</Typography>
    </Box>
    <Box sx={{ borderRadius: 2, backgroundColor: iconBgColor, p: 0.9, pr: 1.1, pl: 1.1 }}>
      {icon}
    </Box>
  </Stack>)
}

export default ProfileInfoRow; 