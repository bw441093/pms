import React from 'react';
import { Stack, Button } from '@mui/material';

interface PersonCardActionsProps {
  transaction?: any;
  alertStatus: string;
  handleButtonClick: (action: string, event: React.SyntheticEvent) => void;
}

const PersonCardActions: React.FC<PersonCardActionsProps> = ({ transaction, alertStatus, handleButtonClick }) => (
  <Stack width='100%' sx={{ gap: '1vh' }}>
  <Stack
    direction="row"
    width='100%'
    sx={{
      gap: '1vw',
      '& > button': {
        flex: 1,
        minWidth: 0,
        boxShadow: 'none',
        py: 1,
        '&:hover': { boxShadow: 'none' }
      },
      '& > button:not(:last-child)': { marginInlineEnd: '4px' }
    }}
  >
    <Button
      variant="contained"
      onClick={(e) => { e.stopPropagation(); handleButtonClick('Move', e); }}
      onMouseDown={e => e.stopPropagation()}
      sx={{ borderRadius: 2, bgcolor: transaction?.status === 'pending' ? '#E57373' : '#EEE', color: transaction?.status === 'pending' ? '#FFF' : '#333', '&:hover': { bgcolor: '#CCC' }, fontSize: 14, fontWeight: 500, textTransform: 'none' }}
    >
      שינוי אתר
    </Button>
    <Button
      variant="contained"
      onClick={(e) => { e.stopPropagation(); handleButtonClick('Report', e); }}
      onMouseDown={e => e.stopPropagation()}
      sx={{ borderRadius: 2, fontSize: 14, fontWeight: 500, textTransform: 'none' }}
    >
      שינוי דיווח
    </Button>


  </Stack>
      {alertStatus !== 'good' && <Button
        variant="contained"
        disabled={alertStatus === 'good'}
        onClick={(e) => { e.stopPropagation(); handleButtonClick('Alert', e); }}
        onMouseDown={e => e.stopPropagation()}
        sx={{ borderRadius: 2, bgcolor: alertStatus === 'good' ? '#4CAF50' : '#E57373', color: '#FFF', '&:hover': { bgcolor: '#CCC' }, fontSize: 14, fontWeight: 500, textTransform: 'none' }}
      >
        נכס"ל
      </Button>}
    </Stack>
);

export default PersonCardActions; 