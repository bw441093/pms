import * as React from 'react';
import { Box, IconButton, Paper } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate, useLocation } from 'react-router';

const navItems = [
  { icon: <CalendarMonthIcon fontSize="large" />, path: '/calendar', key: 'calendar' },
  { icon: <HomeIcon fontSize="large" />, path: '/', key: 'home' },
  { icon: <PersonIcon fontSize="large" />, path: '/profile', key: 'profile' },
];

export default function BottomNavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        bgcolor: '#fff',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
        maxWidth: 420,
        mx: 'auto',
        py: 0.5,
        px: 2,
        display: 'flex',
        justifyContent: 'center',
      }}
      elevation={6}
    >
      <Box display="flex" justifyContent="space-between" width="100%" maxWidth={340}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <IconButton
              key={item.key}
              onClick={() => navigate(item.path)}
              sx={{
                bgcolor: isActive ? '#e3f2fd' : 'transparent',
                borderRadius: 2,
                mx: 1,
                p: 1.2,
                color: isActive ? '#1976d2' : '#757575',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              {item.icon}
            </IconButton>
          );
        })}
      </Box>
    </Paper>
  );
} 