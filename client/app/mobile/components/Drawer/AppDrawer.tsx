import React from 'react';
import {
  Drawer as MuiDrawer,
  List,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Typography,
  Divider,
  ListItemButton,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AlertIcon from '@mui/icons-material/Warning';
import ExportIcon from '@mui/icons-material/Download';
import ArchiveIcon from '@mui/icons-material/Archive';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router';
import { useAtomValue } from 'jotai';
import { userAtom, hasAdminAccessAtom } from '../../../atoms/userAtom';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { handleAlertAll as alertAllUsers } from '../../../utils/alertUtils';

interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
}

const AppDrawer: React.FC<AppDrawerProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const currentUser = useAtomValue(userAtom);
  const hasAdminAccess = useAtomValue(hasAdminAccessAtom);
  const queryClient = useQueryClient();
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleAlertAllClick = async () => {
    setLoading(true);
    setError('');

    const result = await alertAllUsers(queryClient);
    
    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'נכשל ניסיון לשלוח התראה לכל המשתמשים');
    }
    
    setLoading(false);
  };

  const handleExport = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('login_token');
      const response = await axios.get('/api/export', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users-export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (err: any) {
      console.error('Error exporting users:', err);
      setError(err.response?.data || 'אירעה שגיאה בעת ייצוא המשתמשים');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('login_token');
    navigate('/login', { replace: true });
  };

  const menuItems = [
    {
      text: 'שלח התראה לכולם',
      icon: <AlertIcon />,
      onClick: handleAlertAllClick,
      disabled: loading || !hasAdminAccess,
      adminOnly: true,
    },
    {
      text: 'ייצוא משתמשים',
      icon: <ExportIcon />,
      onClick: handleExport,
      disabled: loading || !hasAdminAccess,
      adminOnly: true,
    },
    {
      text: 'ארכיון',
      icon: <ArchiveIcon />,
      onClick: () => {
        navigate('/archive');
        onClose();
      },
      disabled: loading,
      adminOnly: false,
    },
    {
      text: 'התנתקות',
      icon: <LogoutIcon />,
      onClick: () => {
        handleLogout();
        onClose();
      },
      disabled: loading,
      adminOnly: false,
    },
  ];

  const filteredMenuItems = menuItems.filter(item => !item.adminOnly || hasAdminAccess);

  return (
    <MuiDrawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 250,
          bgcolor: 'background.paper',
        },
      }}
    >
      <Box sx={{ width: 250 }} role="presentation">
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, textAlign: 'right' }}>
            {hasAdminAccess ? 'תפריט מנהלים' : 'תפריט ראשי'}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, textAlign: 'right' }}
          >
            {currentUser?.name}
          </Typography>
        </Box>
        <Divider />
        {error && (
          <Alert
            severity="error"
            onClose={() => setError('')}
            sx={{ mx: 2, my: 1 }}
          >
            {error}
          </Alert>
        )}
        <List>
          {filteredMenuItems.map((item) => (
            <ListItemButton
              key={item.text}
              onClick={item.onClick}
              disabled={item.disabled}
              sx={{ flexDirection: 'row-reverse' }}
            >
              <ListItemIcon sx={{ minWidth: 'auto', marginRight: 0, marginLeft: 2 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} sx={{ textAlign: 'right' }} />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </MuiDrawer>
  );
};

export default AppDrawer; 