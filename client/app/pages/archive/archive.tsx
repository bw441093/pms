import { useState, useEffect } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Stack, Box, TextField, Button, Card } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router';
import { getSnapshotDates, getSnapshotByDate } from '../../clients/snapshotClient';

import PersonCard from '../whereYouAt/components/PersonCard';
import axios from 'axios';
import { Dayjs } from 'dayjs';

import { CircularProgress } from '@mui/material';

export default function Archive() {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [people, setPeople] = useState<any[]>([]);
  const [snapshotDates, setSnapshotDates] = useState<string[]>([]);
  const navigate = useNavigate();

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
    <Stack spacing={2} alignItems="center">
      <Card sx={{ elevation: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            startIcon={<ArrowBackIcon />}
          >
            חזור
          </Button>
          <DatePicker
            label="בחר תאריך"
            value={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            shouldDisableDate={shouldDisableDate}
          />
        </Stack>
      </Card>

      {loading ? (
          <CircularProgress />
      ) : (
          people.map((person: any) => (
          <PersonCard
              key={person.id}
              person={person}
              expanded={false}
              onExpandChange={() => {}}
              disableExpand
          />
          ))
      )}
    </Stack>
  );
}