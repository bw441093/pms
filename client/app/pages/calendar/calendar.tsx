import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Card, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { he } from 'date-fns/locale';
import TopBar from '../whereYouAt/components/TopBar';
import { SITE_OPTIONS, hebrewSiteNames } from '../../consts'; // adjust path as needed

const locales = {
  'he': he,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  place?: string;
  isMandatory?: boolean;
  isInsider?: boolean;
}

export default function Calendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [calendarView, setCalendarView] = useState<View>('week');
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    start: new Date(),
    end: new Date(),
    description: '',
    place: '',
    isMandatory: false,
    isInsider: false
  });

  useEffect(() => {
    // Load events from localStorage on component mount
    const savedEvents = localStorage.getItem('calendarEvents');
    if (savedEvents) {
      const parsedEvents = JSON.parse(savedEvents).map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      }));
      setEvents(parsedEvents);
    }
  }, []);

  const handleSaveEvents = () => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setNewEvent({
      title: '',
      start,
      end,
      description: ''
    });
    setSelectedEvent(null);
    setOpenDialog(true);
  };

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    setNewEvent(event);
    setOpenDialog(true);
  };

  const handleSaveEvent = () => {
    if (!newEvent.title) return;

    if (selectedEvent) {
      // Update existing event
      setEvents(events.map(event => 
        event.id === selectedEvent.id 
          ? { ...newEvent, id: selectedEvent.id } as Event
          : event
      ));
    } else {
      // Create new event
      const event = {
        ...newEvent,
        id: Math.random().toString(36).substr(2, 9)
      } as Event;
      setEvents([...events, event]);
    }

    handleSaveEvents();
    setOpenDialog(false);
    setNewEvent({
      title: '',
      start: new Date(),
      end: new Date(),
      description: '',
      place: '',
      isMandatory: false,
      isInsider: false
    });
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      setEvents(events.filter(event => event.id !== selectedEvent.id));
      handleSaveEvents();
    }
    setOpenDialog(false);
  };

  return (
    <Card sx={{ elevation: 2 }}>
      <div style={{ height: 'calc(100vh - 100px)' }}>
        <TopBar />
        <BigCalendar
            localizer={localizer}
            rtl={true}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            defaultView={calendarView}
            onView={setCalendarView}
            views={['week', 'month', 'day', 'agenda']}
            view={calendarView}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            defaultDate={new Date()}
            scrollToTime={new Date()}
            culture="he" // Important for Hebrew locale display
            messages={{
            today: 'היום',
            previous: 'הקודם',
            next: 'הבא',
            month: 'חודש',
            week: 'שבוע',
            day: 'יום',
            agenda: 'סדר יום',
            date: 'תאריך',
            time: 'שעה',
            event: 'אירוע',
            noEventsInRange: 'אין אירועים בטווח זה.',
            showMore: (total: number) => `+ עוד ${total}`,
        }}
        // Add more props here for customization
      />

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle sx={{ direction: 'rtl' }}>
            {selectedEvent ? 'ערוך אירוע' : 'צור אירוע חדש'}
          </DialogTitle>
          <DialogContent sx={{ direction: 'rtl' }}>
            <TextField
              autoFocus
              margin="dense"
              label="כותרת האירוע"
              fullWidth
              value={newEvent.title || ''}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              slotProps={{
                inputLabel: {
                  style: { direction: 'rtl' }
                },
                input: {
                    style: { direction: 'rtl' }
                }
              }}
            />
            <TextField
              margin="dense"
              label="תיאור"
              fullWidth
              multiline
              rows={4}
              value={newEvent.description || ''}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              slotProps={{
                inputLabel: {
                  style: { direction: 'rtl' }
                },
                input: {
                    style: { direction: 'rtl' }
                }
              }}
            />
            <TextField
              margin="dense"
              label="תאריך התחלה"
              type="datetime-local"
              fullWidth
              value={format(newEvent.start || new Date(), "yyyy-MM-dd'T'HH:mm")}
              onChange={(e) => setNewEvent({ ...newEvent, start: new Date(e.target.value) })}
              slotProps={{
                  inputLabel: {
                    shrink: true,
                    style: { direction: 'rtl' }
                  },
                  input: {
                    style: { direction: 'rtl' }
                  }
              }}
            />
            <TextField
              margin="dense"
              label="תאריך סיום"
              type="datetime-local"
              fullWidth
              value={format(newEvent.end || new Date(), "yyyy-MM-dd'T'HH:mm")}
              onChange={(e) => setNewEvent({ ...newEvent, end: new Date(e.target.value) })}
              slotProps={{
                  inputLabel: {
                    shrink: true,
                  }
              }}
            />
            <FormControl fullWidth margin="dense" sx={{ direction: 'rtl' }}>
              <InputLabel sx={{ direction: 'rtl' }}>מקום</InputLabel>
              <Select
                value={newEvent.place || ''}
                label="מקום"
                onChange={e => setNewEvent({ ...newEvent, place: e.target.value as string })}
                sx={{ direction: 'rtl' }}
              >
                {SITE_OPTIONS.map(site => (
                  <MenuItem key={site} value={site} sx={{ direction: 'rtl' }}>
                    {hebrewSiteNames[site] || site}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="dense">
              <InputLabel>סוג אירוע</InputLabel>
              <Select
                value={newEvent.isMandatory !== undefined ? (newEvent.isMandatory ? 'mandatory' : 'optional') : ''}
                label="סוג אירוע"
                onChange={e => setNewEvent({ ...newEvent, isMandatory: e.target.value === 'mandatory' })}
                sx={{ direction: 'rtl' }}
              >
                <MenuItem value="mandatory" sx={{ direction: 'rtl' }}>חובה</MenuItem>
                <MenuItem value="optional" sx={{ direction: 'rtl' }}>רשות</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="dense">
              <InputLabel>סוג פנימי/חיצוני ליחידה</InputLabel>
              <Select
                value={newEvent.isInsider !== undefined ? (newEvent.isInsider ? 'insider' : 'outside') : ''}
                label="סוג פנימי/חיצוני ליחידה"
                onChange={e => setNewEvent({ ...newEvent, isInsider: e.target.value === 'insider' })}
                sx={{ direction: 'rtl' }}
              >
                <MenuItem value="insider" sx={{ direction: 'rtl' }}>פנימי</MenuItem>
                <MenuItem value="outside" sx={{ direction: 'rtl' }}>חיצוני</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            {selectedEvent && (
              <Button onClick={handleDeleteEvent} color="error">
                מחק
              </Button>
            )}
            <Button onClick={() => setOpenDialog(false)}>ביטול</Button>
            <Button onClick={handleSaveEvent} color="primary">
              שמור
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </Card>
  );
}
