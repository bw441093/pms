import React from 'react';
import { Typography, Box, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { hebrewSiteNames, hebrewLocationNames } from '../../../../consts';
import ProfileInfoRow from '../ProfileInfoRow';
import type { Person } from '../../../../types';

interface CurrentReportSectionProps {
  user: Person;
  hasReport: boolean;
}

const CurrentReportSection: React.FC<CurrentReportSectionProps> = ({ user, hasReport }) => {
  const theme = useTheme();
  
  if (hasReport) {
    return (
      <Box
        sx={{
          mb: 2,
          borderRadius: 3,
          bgcolor: theme.palette.custom.gray4,
          boxShadow: 0,
          pl: 2,
          pr: 2,
          pt: 2,
          pb: 3,
          position: 'relative',
          maxWidth: { xs: '100%', sm: 420 },
          mx: 'auto',
        }}
      >
        <Typography fontWeight={800} align="right" mb={1} fontSize={18}>דיווח נוכחי</Typography>
        <Stack spacing={1} mb={4} mt={2}>
          <ProfileInfoRow
            title="סטטוס"
            value={hebrewLocationNames[user.reportStatus as keyof typeof hebrewLocationNames] || user.reportStatus}
            icon={<AssignmentOutlinedIcon sx={{ color: theme.palette.custom.surfaceContainerLowest, scale: 0.7 }} />}
            bgcolor={theme.palette.custom.lightBlue}
            iconBgColor={theme.palette.custom.gray4}
          />
          <ProfileInfoRow
            title="מיקום"
            value={hebrewSiteNames[user.location as keyof typeof hebrewSiteNames] || user.location}
            icon={<InfoOutlinedIcon sx={{ color: theme.palette.custom.surfaceContainerLowest, scale: 0.7 }} />}
            bgcolor={theme.palette.custom.lightBlue}
            iconBgColor={theme.palette.custom.gray4}
          />
        </Stack>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ position: 'absolute', left: 16, bottom: 8, fontWeight: 600 }}
          fontSize={12}
          pb={1}
        >
          {new Date(user.updatedAt).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date(user.updatedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={4} sx={{ mb: 2, borderRadius: 3, bgcolor: theme.palette.custom.gray4, boxShadow: 0, p: { xs: 1, sm: 2 }, alignItems: 'center' }}>
      <Typography fontWeight={700} align="right" mb={1} fontSize={22}>דיווח נוכחי</Typography>
      <AssignmentOutlinedIcon sx={{ fontSize: { xs: 40, sm: 60 }, color: theme.palette.custom.surfaceContainerHighest, mb: 1 }} />
      <Typography color="text.secondary" fontSize={{ xs: 12, sm: 14 }}>עוד אין דיווח להיום</Typography>
    </Stack>
  );
};

export default CurrentReportSection; 