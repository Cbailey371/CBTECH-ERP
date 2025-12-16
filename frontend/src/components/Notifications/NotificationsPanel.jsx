import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  FormGroup,
  Alert
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Circle as CircleIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  AccountBalance as AccountBalanceIcon,
  Settings as SystemIcon
} from '@mui/icons-material';
import { useNotifications } from '../../context/NotificationsContext';

const NotificationsPanel = () => {
  const {
    notifications,
    unreadCount,
    preferences,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    requestBrowserPermission,
    getNotificationsByCategory,
    getUnreadByCategory
  } = useNotifications();

  const [anchorEl, setAnchorEl] = useState(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [localPreferences, setLocalPreferences] = useState(preferences);
  
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    // Aquí se podría navegar a la página relevante
    handleClose();
  };

  const handleDelete = (notificationId, event) => {
    event.stopPropagation();
    deleteNotification(notificationId);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleOpenPreferences = () => {
    setLocalPreferences(preferences);
    setPreferencesOpen(true);
    handleClose();
  };

  const handleSavePreferences = async () => {
    await updatePreferences(localPreferences);
    setPreferencesOpen(false);
  };

  const handlePreferenceChange = (key, value) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCategoryChange = (category, value) => {
    setLocalPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: value
      }
    }));
  };

  const getIcon = (category) => {
    const iconMap = {
      sales: <MoneyIcon />,
      customers: <PeopleIcon />,
      inventory: <InventoryIcon />,
      financial: <AccountBalanceIcon />,
      system: <SystemIcon />
    };
    return iconMap[category] || <SystemIcon />;
  };

  const getStatusColor = (category) => {
    const colorMap = {
      sales: 'success',
      customers: 'info',
      inventory: 'warning',
      financial: 'primary',
      system: 'default'
    };
    return colorMap[category] || 'default';
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <>
      {/* Botón de notificaciones */}
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-label="notificaciones"
      >
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsOffIcon />}
        </Badge>
      </IconButton>

      {/* Panel de notificaciones */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 400, maxHeight: 600 }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Notificaciones
            </Typography>
            <Box>
              <IconButton size="small" onClick={handleOpenPreferences}>
                <SettingsIcon />
              </IconButton>
            </Box>
          </Box>
          
          {unreadCount > 0 && (
            <Box sx={{ mt: 1 }}>
              <Button
                size="small"
                onClick={handleMarkAllRead}
                disabled={loading}
              >
                Marcar todas como leídas
              </Button>
            </Box>
          )}
        </Box>

        {/* Lista de notificaciones */}
        <List sx={{ maxHeight: 400, overflow: 'auto', p: 0 }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No hay notificaciones
              </Typography>
            </Box>
          ) : (
            notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    borderLeft: notification.read ? 'none' : 3,
                    borderColor: `${getStatusColor(notification.category)}.main`
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: `${getStatusColor(notification.category)}.main`,
                        width: 32,
                        height: 32
                      }}
                    >
                      {getIcon(notification.category)}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" noWrap>
                          {notification.title}
                        </Typography>
                        {!notification.read && (
                          <CircleIcon sx={{ fontSize: 8, color: 'primary.main' }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {notification.message}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={notification.category}
                            size="small"
                            color={getStatusColor(notification.category)}
                            variant="outlined"
                            sx={{ fontSize: '0.75rem', height: 20 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(notification.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => handleDelete(notification.id, e)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))
          )}
        </List>

        {/* Footer */}
        {notifications.length > 0 && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={handleClose}
            >
              Ver todas las notificaciones
            </Button>
          </Box>
        )}
      </Menu>

      {/* Dialog de preferencias */}
      <Dialog
        open={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Preferencias de Notificaciones
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Canales de notificación */}
            <Typography variant="subtitle1" gutterBottom>
              Canales de Notificación
            </Typography>
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={localPreferences.inApp}
                    onChange={(e) => handlePreferenceChange('inApp', e.target.checked)}
                  />
                }
                label="Notificaciones en la aplicación"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={localPreferences.browser}
                    onChange={(e) => handlePreferenceChange('browser', e.target.checked)}
                  />
                }
                label="Notificaciones del navegador"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={localPreferences.email}
                    onChange={(e) => handlePreferenceChange('email', e.target.checked)}
                  />
                }
                label="Notificaciones por email"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={localPreferences.sound}
                    onChange={(e) => handlePreferenceChange('sound', e.target.checked)}
                  />
                }
                label="Sonido de notificación"
              />
            </FormGroup>

            <Divider sx={{ my: 3 }} />

            {/* Categorías */}
            <Typography variant="subtitle1" gutterBottom>
              Categorías de Notificación
            </Typography>
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={localPreferences.categories.sales}
                    onChange={(e) => handleCategoryChange('sales', e.target.checked)}
                  />
                }
                label="Ventas"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={localPreferences.categories.customers}
                    onChange={(e) => handleCategoryChange('customers', e.target.checked)}
                  />
                }
                label="Clientes"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={localPreferences.categories.inventory}
                    onChange={(e) => handleCategoryChange('inventory', e.target.checked)}
                  />
                }
                label="Inventario"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={localPreferences.categories.financial}
                    onChange={(e) => handleCategoryChange('financial', e.target.checked)}
                  />
                }
                label="Financiero"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={localPreferences.categories.system}
                    onChange={(e) => handleCategoryChange('system', e.target.checked)}
                  />
                }
                label="Sistema"
              />
            </FormGroup>

            {localPreferences.browser && 'Notification' in window && Notification.permission === 'default' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Button onClick={requestBrowserPermission}>
                  Permitir notificaciones del navegador
                </Button>
              </Alert>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setPreferencesOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSavePreferences} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationsPanel;