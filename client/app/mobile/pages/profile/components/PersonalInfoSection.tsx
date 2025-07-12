import React from 'react';
import { Typography, Divider, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonIcon from '@mui/icons-material/Person';
import { hebrewSiteNames } from '../../../../consts';
import ProfileInfoRow from '../ProfileInfoRow';
import type { Person } from '../../../../types';

interface PersonalInfoSectionProps {
  user: Person;
}

const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({ user }) => {
  const theme = useTheme();
  
  return (
    <>
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
    </>
  );
};

export default PersonalInfoSection; 