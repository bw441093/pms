import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Card, FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import { he, id } from 'date-fns/locale';
import TopBar from '../whereYouAt/components/TopBar';
import { SITE_OPTIONS, hebrewSiteNames } from '../../consts'; // adjust path as needed
import { getGroupsByPersonId, getPersonRoleInGroup } from '~/clients/groupsClient';
import { getEventsByEntityId, createEvent, updateEvent, deleteEvent } from '~/clients/eventsClient';

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
  entityId?: string;
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
  const [groups, setGroups] = useState<any[]>([]);
  const [adminGroups, setAdminGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('login_token') || '';
    // Fetch groups for current user
    const fetchUserGroups = async () => {
      try {
        const response = await getGroupsByPersonId(id);
        const groupsData = response; // adjust as needed
        setGroups(groupsData);
        const groupRoles = await getPersonRoleInGroup(id, groupsData.map((group: any) => group.groupId));
        const adminGroupsData = groupRoles.filter((role: any) => role.groupRole === 'admin');
        setAdminGroups(adminGroupsData);
      } catch (error) {
        console.error('Error fetching user groups:', error);
      }
    };

    fetchUserGroups();
  }, []);

  // Fetch events when selectedGroup changes
  useEffect(() => {
    const fetchEvents = async () => {
      if (!selectedGroup) {
        setEvents([]);
        return;
      }
      try {
        const eventsData = await getEventsByEntityId(selectedGroup, 'group');
        // Map server events to local Event interface
        const mappedEvents = eventsData.map((event: any) => ({
          id: event.eventId,
          title: event.title,
          start: new Date(event.startTime),
          end: new Date(event.endTime),
          description: event.description,
          place: event.location,
          isMandatory: event.mandatory,
          isInsider: event.insider,
          entityId: event.entityId,
        }));
        setEvents(mappedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      }
    };
    if (selectedGroup) {
      fetchEvents();
    } else {
      setEvents([]);
    }
  }, [selectedGroup]);

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    if (!(selectedGroup && adminGroups.some(ag => ag.groupId === selectedGroup))) {
        return;
    }
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

  const handleSaveEvent = async () => {
    if (!newEvent.title) return;
    try {
      const eventPayload = {
        eventId: selectedEvent?.id,
        entityId: selectedGroup,
        entityType: 'group',
        startTime:
          newEvent.start
            ? newEvent.start instanceof Date
              ? newEvent.start
              : new Date(newEvent.start)
            : new Date(),
        endTime:
          newEvent.end
            ? newEvent.end instanceof Date
              ? newEvent.end
              : new Date(newEvent.end)
            : new Date(),
        title: newEvent.title,
        description: newEvent.description,
        location: newEvent.place,
        mandatory: newEvent.isMandatory,
        insider: newEvent.isInsider,
      };
      if (selectedEvent) {
        // Update existing event
        const updated = await updateEvent(selectedEvent.id, eventPayload);
        setEvents(events.map(event => event.id === selectedEvent.id ? {
          ...updated,
          id: updated.eventId,
          start: new Date(updated.startTime),
          end: new Date(updated.endTime),
          place: updated.location,
          isMandatory: updated.mandatory,
          isInsider: updated.insider,
        } : event));
      } else {
        // Create new event
        const created = await createEvent(eventPayload);
        setEvents([...events, {
          ...created,
          id: created.eventId,
          start: new Date(created.startTime),
          end: new Date(created.endTime),
          place: created.location,
          isMandatory: created.mandatory,
          isInsider: created.insider,
        }]);
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
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

  const handleDeleteEvent = async () => {
    if (selectedEvent) {
      try {
        await deleteEvent(selectedEvent.id);
        setEvents(events.filter(event => event.id !== selectedEvent.id));
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
    setOpenDialog(false);
  };

  // Filter events by selected group
  const filteredEvents = selectedGroup
    ? events.filter(event => event.entityId === selectedGroup)
    : events;

  return (
    <Card sx={{ elevation: 2 }}>
      <div style={{ height: 'calc(100vh - 100px)' }}>
        <TopBar />
        {/* Group Filter Dropdown */}
        <Box display="flex" justifyContent="center" alignItems="center" width="100%" p={2}>
          <FormControl sx={{ width: '400px', mb: 2 }}>
            <InputLabel>בחר קבוצה</InputLabel>
            <Select
              value={selectedGroup || ''}
              label="בחר קבוצה"
              onChange={e => setSelectedGroup(e.target.value || null)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">הצג הכל</MenuItem>
              {groups.map(group => (
                <MenuItem key={group.groupId} value={group.groupId}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <BigCalendar
            localizer={localizer}
            rtl={true}
            events={filteredEvents}
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

        <Dialog 
          open={openDialog}
          onClose={() => setOpenDialog(false)}>
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
