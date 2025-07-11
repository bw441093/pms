import React from 'react';
import { Stack, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useProfileData, useReportModal } from './hooks';
import {
  ProfileHeader,
  PersonalInfoSection,
  CurrentReportSection,
  ReportActionButton,
  ReportActionModal,
  LoadingStates,
} from './components';

export default function ProfilePage() {
  const theme = useTheme();
  const { user, loading, error, hasReport } = useProfileData();
  const { reportOpen, openReportModal, closeReportModal } = useReportModal();

  if (loading || error || !user) {
    return <LoadingStates loading={loading} error={error} />;
  }

  return (
    <Stack
      direction="column"
      spacing={1}
      sx={{
        overflowY: 'auto',
        pb: '80px',
        px: 2,
        backgroundColor: theme.palette.custom.gray1,
        mt: '7vh',
        maxHeight: '100vh',
      }}
    >
      <ProfileHeader user={user} />
      <PersonalInfoSection user={user} />
      <CurrentReportSection user={user} hasReport={hasReport} />
      <ReportActionButton onReportChange={openReportModal} />
      <ReportActionModal 
        open={reportOpen} 
        onClose={closeReportModal} 
        user={user} 
      />
    </Stack>
  );
} 