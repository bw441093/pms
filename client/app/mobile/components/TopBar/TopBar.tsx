import React from 'react';
import { IconButton, Typography, Box, AppBar, Toolbar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';

interface TopBarProps {
  onMenuClick?: () => void;
  onNotificationClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick, onNotificationClick }) => {
  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: 'white',
        boxShadow: 'none',
        borderBottom: '0.5px solid rgba(0, 0, 0, 0.12)',
        paddingX: '2vw'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>

        <IconButton
          edge="end"
          onClick={onNotificationClick}
          sx={{ color: 'black' }}
        >
          <NotificationsIcon />
        </IconButton>
        <Typography
          variant="h6"
          component="div"
          sx={{
            color: 'black',
            fontWeight: 'bold',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          לוזינט
        </Typography>

        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{ color: 'black' }}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar; 