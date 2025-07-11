import React from 'react';
import { Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import type { Person } from '../../../../types';

interface ProfileHeaderProps {
  user: Person;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  const theme = useTheme();
  
  return (
    <>
      <Typography
        variant="h5"
        align="center"
        fontWeight={700}
        fontSize={18}
      >
        דיווח נוכחות
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1.5,
          backgroundColor: theme.palette.custom.gray3,
          borderRadius: 4,
        }}
      >
        <Box
          sx={{
            border: 1,
            borderColor: theme.palette.custom.surfaceContainerLowest,
            borderRadius: 2,
            p: 0.1,
            display: 'flex',
            alignItems: 'center',
            mr: 2,
          }}
        >
          <CalendarMonthIcon fontSize="large" sx={{ scale: 0.6 }} />
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Typography fontWeight={700} fontSize={17} sx={{ whiteSpace: 'nowrap', mr: 1 }}>
          {user.name}
        </Typography>
        <Box width={10} height={10} borderRadius={5} bgcolor="#1ecb4f" display="inline-block" />
      </Box>
    </>
  );
};

export default ProfileHeader; 