import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip
} from '@mui/material';
import {
  Business as BusinessIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import NotificationsPanel from '../Notifications/NotificationsPanel';

const TopAppBar = () => {
  const { user, logout } = useAuth();
  const { currentCompany } = useCompany();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const displayName = React.useMemo(() => {
    if (!user) return undefined;
    const fullName = [user.firstName || user.first_name, user.lastName || user.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    return fullName || user.username || user.email;
  }, [user]);

  const avatarLetter = React.useMemo(() => {
    if (displayName) return displayName.charAt(0).toUpperCase();
    if (user?.username) return user.username.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  }, [displayName, user]);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  return (
    <AppBar position="sticky" elevation={1}>
      <Toolbar>
        {/* Logo y título */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
          <BusinessIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            ERP Multi-Empresa
          </Typography>
        </Box>

        {/* Información de la empresa actual */}
        {currentCompany && (
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 'auto' }}>
            <Chip
              label={currentCompany.company.name}
              variant="outlined"
              size="small"
              sx={{ 
                color: 'white', 
                borderColor: 'rgba(255, 255, 255, 0.5)',
                '& .MuiChip-label': { color: 'white' }
              }}
            />
          </Box>
        )}

        {/* Panel de notificaciones */}
        <NotificationsPanel />

        {/* Menú de usuario */}
        <IconButton
          color="inherit"
          onClick={handleMenuClick}
          sx={{ ml: 1 }}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
            {avatarLetter}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle1">{displayName || 'Usuario'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
            {currentCompany && (
              <Typography variant="caption" color="text.secondary">
                Rol: {currentCompany.role}
              </Typography>
            )}
          </Box>
          
          <Divider />
          
          <MenuItem onClick={handleMenuClose}>
            <AccountIcon sx={{ mr: 1 }} />
            Perfil
          </MenuItem>
          
          <MenuItem onClick={handleMenuClose}>
            <SettingsIcon sx={{ mr: 1 }} />
            Configuración
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 1 }} />
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default TopAppBar;
