import React, { useMemo, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Divider, Stack, Button, IconButton, Modal } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import { hebrewSiteNames, hebrewLocationNames } from '../../consts';
import { useUserDataWithManager } from '../../hooks/useQueries';
import ProfileInfoRow from './ProfileInfoRow';
import { useTheme } from '@mui/material/styles';
import ReportAction from '../whereYouAt/components/ActionModal/ReportAction';

export default function ProfilePage() {
  const userId = useMemo(() => localStorage.getItem('login_token') || '', []);
  const { data: user, isLoading: loading, error } = useUserDataWithManager(userId);
  const theme = useTheme();
  const [reportOpen, setReportOpen] = React.useState(false);

  if (loading) return <Box p={4}>טוען...</Box>;
  if (error) return <Box p={4}>שגיאה בטעינת המשתמש</Box>;
  if (!user) return <Box p={4}>לא נמצא משתמש</Box>;

  const hasReport = Boolean(user.reportStatus && user.location);

  return (
    <Stack
      direction="column"
      spacing={1}
      sx={{
        height: '100vh',
        overflow: 'hidden',
        pb: '80px',
        px: 2,
        backgroundColor: theme.palette.custom.gray1,
        position: 'fixed',
        top: '2vh',
        mt: '7vh',
        left: 0,
        right: 0,
        bottom: 0,
        maxHeight: '100%',
        overscrollBehavior: 'none',
        touchAction: 'none',
      }}
    >
      <Typography
        variant="h5"
        align="center"
        fontWeight={700}
        fontSize={18}
      >
        דיווח נוכחות
      </Typography>
      <Stack 
        direction='row'
        spacing={17}
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
            p: 0.4,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <CalendarMonthIcon fontSize="large" sx={{ scale: 0.7 }} />
        </Box>
        <Stack direction="row" flex={1} alignItems="center" gap={1}>
          <Typography fontWeight={700} fontSize={21}>{user.name}</Typography>
          <Box width={10} height={10} borderRadius={5} bgcolor="#1ecb4f" display="inline-block" />
        </Stack>
      </Stack>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1} mb={1}>
        <Divider sx={{ mb: 1, width: '80%', borderColor: theme.palette.custom.gray5 }} />
        <Typography variant="subtitle2" color={theme.palette.custom.gray13} mb={1} fontSize={15} fontWeight={600}>
          מידע אישי
        </Typography>
      </Stack>
      <Stack spacing={1} mb={2}>
        <ProfileInfoRow
          title="מפקד ישיר"
          value={user.manager?.name || '---'}
          icon={<PersonIcon sx={{ color: theme.palette.custom.surfaceContainerLowest, scale: 0.8 }} />}
          bgcolor={theme.palette.custom.gray4}
          iconBgColor={theme.palette.custom.lightBlue}
        />
        <ProfileInfoRow
          title="מיקום"
          value={hebrewSiteNames[user.site]}
          icon={<InfoOutlinedIcon sx={{ color: theme.palette.custom.surfaceContainerLowest, scale: 0.8 }} />}
          bgcolor={theme.palette.custom.gray4}
          iconBgColor={theme.palette.custom.lightBlue}
        />
      </Stack>
      {hasReport ? (
        <Box
          sx={{
            mb: 2,
            borderRadius: 3,
            bgcolor: theme.palette.custom.gray4,
            boxShadow: 0,
            pl: 2,
            pr: 2,
            pt: 2,
            pb: 4,
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
      ) : (
        <Stack spacing={4} sx={{ mb: 2, borderRadius: 3, bgcolor: theme.palette.custom.gray4, boxShadow: 0, p: { xs: 1, sm: 2 }, alignItems: 'center' }}>
          <Typography fontWeight={700} align="right" mb={1} fontSize={22}>דיווח נוכחי</Typography>
          <AssignmentOutlinedIcon sx={{ fontSize: { xs: 40, sm: 60 }, color: theme.palette.custom.surfaceContainerHighest, mb: 1 }} />
          <Typography color="text.secondary" fontSize={{ xs: 12, sm: 14 }}>עוד אין דיווח להיום</Typography>
        </Stack>
      )}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{ borderRadius: 2, fontWeight: 700, fontSize: 22, p: 2, mt: 3 }}
        onClick={() => setReportOpen(true)}
      >
        שינוי דיווח
      </Button>
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} closeAfterTransition>
        <Box display="flex" alignItems="center" justifyContent="center" height="100vh">
          {user && (
            <Box
              bgcolor="background.paper"
              borderRadius={2}
              boxShadow={24}
              p={{ xs: 2, sm: 4 }}
              maxWidth={400}
              width="100%"
              mx={4}
              style={{ maxWidth: '80vw' }}
              onClick={e => e.stopPropagation()}
            >
              <ReportAction person={user} onClose={() => setReportOpen(false)} />
            </Box>
          )}
        </Box>
      </Modal>
    </Stack>
  );
} 