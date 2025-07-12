import { useState, useEffect, useRef } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Card, FormControl, InputLabel, Select, MenuItem, Box, Typography, ButtonGroup, IconButton, Stack } from '@mui/material';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from '../whereYouAt/components/TopBar';
import { SITE_OPTIONS, hebrewSiteNames } from '../../../consts'; // adjust path as needed
import { getGroupsByPersonId, getPersonRoleInGroup } from '~/clients/groupsClient';
import { getEventsByEntityId, createEvent, updateEvent, deleteEvent } from '~/clients/eventsClient';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

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

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
};

interface CalendarHeaderProps {
  date: Date;
  view: View;
  onView: (view: View) => void;
  onNavigate: (direction: number) => void;
  views: View[];
}

const CalendarHeader = ({ date, view, onView, onNavigate, views }: CalendarHeaderProps) => {
  const viewNames: { [key in View]?: string } = {
    month: 'חודש',
    week: 'שבוע',
    day: 'יום',
    agenda: 'סדר יום',
  };

  const getHeaderTitle = () => {
    if (view === 'month') {
      return format(date, 'MMMM yyyy ', { locale: he });
    }
    if (view === 'week') {
      const start = startOfWeek(date);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      if (start.getMonth() === end.getMonth()) {
        return `${format(start, 'd')} - ${format(end, 'd MMMM yyyy', { locale: he })}`;
      }
      return `${format(start, 'd MMMM')} - ${format(end, 'd MMMM yyyy', { locale: he })}`;
    }
    return format(date, 'eeee, d MMMM yyyy', { locale: he });
  };
  
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" p={2} sx={{ direction: 'rtl' }}>
      <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center" width="100%">
      <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
        {getHeaderTitle()}
      </Typography>
      <Stack direction="row">
        {/* <ButtonGroup variant="outlined" aria-label="outlined button group" sx={{ borderRadius: '20px' }}>
          <Button onClick={() => onNavigate(-1)}><ChevronRightIcon /></Button>
          <Button onClick={() => onNavigate(0)}>היום</Button>
          <Button onClick={() => onNavigate(1)}><ChevronLeftIcon /></Button>
        </ButtonGroup> */}

        <ButtonGroup variant="outlined" sx={{ width: '100%' }} dir="ltr">
          {views.map((viewName) => (
            <Button
              key={viewName}
              onClick={() => onView(viewName)}
              sx={{
                borderRadius: '20px',
                backgroundColor: view === viewName ? 'primary.main' : 'inherit',
                color: view === viewName ? 'white' : 'inherit',
                '&:hover': {
                    backgroundColor: view === viewName ? 'primary.dark' : 'rgba(0,0,0,0.04)'
                }
              }}
            >
              {viewNames[viewName]}
            </Button>
          ))}
        </ButtonGroup>
        </Stack>
      </Stack>
    </Box>
  )
}

export default function Calendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [calendarView, setCalendarView] = useState<View>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [[key, direction], setPage] = useState([0, 0]);
  const [displayDate, setDisplayDate] = useState(new Date());
  const isAnimating = useRef(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  
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

  const getNewDate = (dir: number) => {
    const newDate = new Date(displayDate);
    const period = dir > 0 ? 1 : -1;

    if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() + period);
    } else if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() + period * 7);
    } else if (calendarView === 'day') {
      newDate.setDate(newDate.getDate() + period);
    }
    return newDate;
  };

  const paginate = (newDirection: number) => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    
    setPage([key + newDirection, newDirection]);
    const newDate = getNewDate(newDirection);
    setDisplayDate(newDate);
    setCurrentDate(newDate);

    setTimeout(() => {
      isAnimating.current = false;
    }, 600); // Should match transition duration
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const handlePressStart = () => {
    longPressTimeout.current = setTimeout(() => {
      setIsLongPress(true);
    }, 500); // 500ms delay for long press
  };

  const handlePressEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
    if (isLongPress) {
        // Delay resetting to prevent drag from firing on release
        setTimeout(() => setIsLongPress(false), 50);
    } else {
        setIsLongPress(false);
    }
  };


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

  // Create separate event data for next calendar
  const getEventsForDate = (date: Date) => {
    // For now, return the same events since we don't have date-specific filtering
    // In a real implementation, you might filter events by date range
    return filteredEvents;
  };

  // Prevent all page scrolling when calendar is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const root = document.getElementById('root');
    if (root) root.style.overflow = 'hidden';
    // Prevent touch scroll
    const preventDefault = (e: TouchEvent) => e.preventDefault();
    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      if (root) root.style.overflow = '';
      document.removeEventListener('touchmove', preventDefault);
    };
  }, []);

  return (
      <Stack
        style={{ height: '100vh', overflow: 'hidden', fontFamily: 'Assistant, sans-serif', scrollbarWidth: 'none', scrollbarColor: 'transparent transparent' }}
      >
        {/* Group Filter Dropdown */}
        <Box display="flex" justifyContent="center" alignItems="center" p={2}>
          <FormControl sx={{ width: '90%', mt: 2}} >
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
        
        <CalendarHeader 
            date={displayDate}
            view={calendarView}
            views={['week', 'month', 'day']}
            onView={setCalendarView}
            onNavigate={(direction: number) => {
              if (direction === 0) { // today
                const today = new Date();
                const dir = today > displayDate ? 1 : -1;
                if (format(today, 'yyyy-MM-dd') !== format(displayDate, 'yyyy-MM-dd')) {
                    setPage([key + dir, dir]);
                    setDisplayDate(today);
                    setCurrentDate(today);
                }
              } else {
                paginate(direction)
              }
            }}
        />

        {/* Calendar Container with Framer Motion */}
        <div 
          className="calendar-container"
          style={{
            height: '70%',
            marginLeft: '2vw',
            marginRight: '2vw',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <AnimatePresence custom={direction} mode="wait" initial={false}>
            <motion.div
              key={key}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "tween", duration: .2, ease: "easeInOut" }}
              drag={isLongPress ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                if (isLongPress) return;
                const swipe = swipePower(offset.x, velocity.x);

                if (swipe < -swipeConfidenceThreshold) {
                  paginate(1);
                } else if (swipe > swipeConfidenceThreshold) {
                  paginate(-1);
                }
              }}
              onMouseDown={handlePressStart}
              onMouseUp={handlePressEnd}
              onTouchStart={handlePressStart}
              onTouchEnd={handlePressEnd}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
              }}
            >
              <BigCalendar
                  toolbar={false}
                  localizer={localizer}
                  rtl={true}
                  events={getEventsForDate(displayDate)}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '70%', fontFamily: 'Assistant, sans-serif', background: 'white' }}
                  defaultView={calendarView}
                  onView={setCalendarView}
                  views={['week', 'month', 'day', 'agenda']}
                  view={calendarView}
                  date={displayDate}
                  onNavigate={(newDate) => {
                    if (newDate > displayDate) paginate(1);
                    else paginate(-1);
                  }}
                  onSelectEvent={handleSelectEvent}
                  onSelectSlot={handleSelectSlot}
                  selectable
                  scrollToTime={new Date()}
                  culture="he"
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
              />
            </motion.div>
          </AnimatePresence>
        </div>

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
      </Stack>
  );
}
