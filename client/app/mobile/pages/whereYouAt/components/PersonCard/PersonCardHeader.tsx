import React from 'react';
import { Stack, Box, Typography, IconButton, Chip, useTheme, Button } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckIcon from '@mui/icons-material/Check';

interface PersonCardHeaderProps {
  name: string;
  alertStatus: string;
  transaction?: any;
  reportStatus: string;
  hebrewLocationNames: Record<string, string>;
  currentSite?: string;
  site: string;
  hebrewSiteNames: Record<string, string>;
  collapsed: boolean;
  handleButtonClick: (action: string, event: React.SyntheticEvent) => void;
}

const PersonCardHeader: React.FC<PersonCardHeaderProps> = ({
  name,
  alertStatus,
  transaction,
  reportStatus,
  hebrewLocationNames,
  currentSite,
  site,
  hebrewSiteNames,
  collapsed,
  handleButtonClick,
}) => {
  const theme = useTheme();

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" width="105%">
      <Stack alignItems="start" spacing={1} sx={{ flexWrap: 'nowrap', maxWidth: '60%' }} >
        <Stack direction="row" alignItems="center">
          <Box
            width={10}
            height={10}
            sx={{ ml: 1.5, mt: 0.5, borderRadius: '50%', bgcolor: alertStatus !== 'good' || (transaction?.status !== 'resolved') ? '#E57373' : '#4CAF50', flexShrink: 0 }}
          />
          <Typography
            fontWeight={700}
            fontSize={18}
            sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {name}
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" gap={1}>
          <Chip
            label={reportStatus in hebrewLocationNames ? hebrewLocationNames[reportStatus] : reportStatus}
            sx={{ px: 1, borderRadius: 5, bgcolor: theme.palette.custom.gray4, display: 'flex', alignItems: 'center', minWidth: 'fit-content' }}
          />
          <Chip
            label={(currentSite || site) in hebrewSiteNames ? hebrewSiteNames[currentSite || site] : (currentSite || site)}
            icon={<LocationOnIcon />}
            size="small"
            sx={{
              bgcolor: theme.palette.custom.gray4,
              fontWeight: 500,
              px: 1,
              py: 1.7,
              '& .MuiChip-icon': {
                marginLeft: 0.3,
                marginRight: 0,
              },
            }}
          />
        </Stack>
      </Stack>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: collapsed ? 0 : 4, transition: 'margin 0.3s ease' }} >
        <Button
          variant="outlined"
          loadingPosition="start"
          loading={false}
          dir='ltr'
          onClick={(e) => { e.stopPropagation(); handleButtonClick('Report', e); }}
          onMouseDown={e => e.stopPropagation()}
          sx={{ borderRadius: 2, fontSize: 14, fontWeight: 500,textTransform: 'none', height: '3vh'}}
        >
          אישור
        </Button>
        <IconButton className="person-card-menu-btn" size="small" onClick={(e) => { e.stopPropagation(); handleButtonClick('More', e); }}>
          <MoreVertIcon />
        </IconButton>
      </Stack>
    </Stack>
  );
};
export default PersonCardHeader; 