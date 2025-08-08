import { useState, useEffect } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Stack, Box, TextField, Button, Card, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router';
import { getSnapshotDates, getSnapshotByDate } from '../../../clients/snapshotClient';

import PersonCard from '../whereYouAt/components/PersonCard/PersonCard';
import axios from 'axios';
import { Dayjs } from 'dayjs';

import { CircularProgress } from '@mui/material';
import { useNavBar } from '../../../contexts/NavBarContext';

export default function Archive() {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [people, setPeople] = useState<any[]>([]);
  const [snapshotDates, setSnapshotDates] = useState<string[]>([]);
  const navigate = useNavigate();
  const { setShowNavBar } = useNavBar();
  const theme = useTheme();

  useEffect(() => {
    setShowNavBar(false);
    return () => setShowNavBar(true);
  }, [setShowNavBar]);

  useEffect(() => {
    setLoading(true);
    getSnapshotDates()
      .then(res => {
        setSnapshotDates(res);
      })
      .catch(err => {
        setSnapshotDates([]);
      }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedDate) {
      setLoading(true);
      const dateStr = selectedDate.format('YYYYMMDD');
      getSnapshotByDate(dateStr).then(res => {
        setPeople(res);
      }).finally(() => setLoading(false));
    }
  }, [selectedDate]);

  const shouldDisableDate = (date: Dayjs) => {
    return !snapshotDates.includes(date.format('YYYYMMDD'));
  };

  return (
    <Stack spacing={4} sx={{ padding: '4vw', paddingBottom: '10vh' }}>

      <Stack
        direction="row"
        spacing={2}
        width="100%"
        alignItems="center"
        sx={{
          backgroundColor: (theme) => theme.palette.custom.gray1,
          borderRadius: '2vh',
        }}
      >
        <Button
          variant="text"
          onClick={() => navigate('/')}
          sx={{
            minWidth: 'auto',
            padding: '1vh',
            borderRadius: '1vh',
            color: (theme) => theme.palette.custom.gray13,
            '&:hover': {
              backgroundColor: (theme) => theme.palette.custom.gray2,
            }
          }}
        >
          <ArrowBackIcon sx={{ fontSize: '2.5vh' }} />
        </Button>

                  <DatePicker
            label="בחר תאריך"
            value={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            shouldDisableDate={shouldDisableDate}
            slotProps={{
             textField: {
               variant: 'outlined',
               sx: {
                 width: '100%',
                 '& .MuiOutlinedInput-root': {
                   backgroundColor: theme.palette.custom.gray4,
                   borderRadius: '5vh',
                   height: '5vh',
                   minHeight: '5vh',
                   '& fieldset': {
                     border: 'none',
                   },
                   '&:hover fieldset': {
                     border: 'none',
                   },
                   '&.Mui-focused fieldset': {
                     border: 'none',
                   },
                 },
                 '& .MuiInputLabel-root': {
                   fontSize: '2vh',
                   color: (theme) => theme.palette.custom.outline,
                   right: '15vw',
                   left: 'auto',
                   transformOrigin: 'right center',
                   '&.Mui-focused': {
                     right: '8vw',
                     left: 'auto',
                   },
                   '&.MuiInputLabel-shrink': {
                     right: '8vw',
                     left: 'auto',
                     transform: 'translate(0, -1.5px) scale(0.75)',
                   },
                 },
                 '& .MuiInputBase-input': {
                   textAlign: 'center',
                   padding: '1vh 2vw',
                 },
               },
             },
             openPickerIcon: {
               sx: {
                pt: '0.2vh',
                pr: '1vw',

                 color: (theme) => theme.palette.custom.outline,
                 fontSize: '2.5vh',
                 '&:hover': {
                   backgroundColor: (theme) => theme.palette.custom.gray2,
                   borderRadius: '1vh',
                 },
               },
             },
           }}
           sx={{
             flex: 1,
             '& .MuiInputAdornment-root': {
               marginRight: '2vw',
             },
             '& .MuiInputLabel-root': {
               fontSize: '2vh',
               color: (theme) => theme.palette.custom.outlineVariant,
             },
             '& .MuiInputBase-input': {
               fontSize: '2vh',
               textAlign: 'center',
               color: (theme) => theme.palette.custom.gray13,
             },
           }}
          />
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: '4vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2}>
          {people.map((person: any) => (
            <PersonCard
              key={person.id}
              person={person}
              permissions={person.personSystemRoles}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}