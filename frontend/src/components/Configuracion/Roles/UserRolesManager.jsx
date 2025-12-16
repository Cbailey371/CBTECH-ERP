import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Snackbar,
  Tooltip,
  CircularProgress,
  Grid,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import userRolesService from '../../../services/userRolesService';
import rolesService from '../../../services/rolesService';
import permissionsService from '../../../services/permissionsService';

const handleApiError = (error) => {
  if (error.response) {
    return error.response.data.message || 'Error del servidor';
  } else if (error.request) {
    return 'Error de conexión';
  } else {
    return error.message || 'Error desconocido';
  }
};

const UserRolesManager = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRolesToAdd, setSelectedRolesToAdd] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadPermissions();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await userRolesService.getUserRoles();
      setUsers(data.users);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await rolesService.getRoles({ include_permissions: true });
      setRoles(data.roles);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const loadPermissions = async () => {
    try {
      const data = await permissionsService.getGroupedPermissions();
      setPermissions(data);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const loadUserRoles = async (userId) => {
    try {
      const data = await userRolesService.getUserRolesByUserId(userId);
      setUserRoles(data.roles);
      setUserPermissions(data.effective_permissions || []);
      
      // Calcular roles disponibles (que no tiene el usuario)
      const userRoleIds = data.roles.map(role => role.id);
      const available = roles.filter(role => !userRoleIds.includes(role.id) && role.is_active);
      setAvailableRoles(available);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    await loadUserRoles(user.id);
    setOpenDialog(true);
  };

  const handleAssignRoles = async () => {
    if (selectedRolesToAdd.length === 0) {
      setSnackbar({ open: true, message: 'Selecciona al menos un rol', severity: 'warning' });
      return;
    }

    try {
      await userRolesService.assignRolesToUser(selectedUser.id, selectedRolesToAdd);
      setSnackbar({ open: true, message: 'Roles asignados correctamente', severity: 'success' });
      await loadUserRoles(selectedUser.id);
      await loadUsers();
      setSelectedRolesToAdd([]);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleRemoveRole = async (roleId) => {
    if (!window.confirm('¿Estás seguro de que quieres remover este rol del usuario?')) {
      return;
    }

    try {
      await userRolesService.removeRolesFromUser(selectedUser.id, [roleId]);
      setSnackbar({ open: true, message: 'Rol removido correctamente', severity: 'success' });
      await loadUserRoles(selectedUser.id);
      await loadUsers();
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setUserRoles([]);
    setUserPermissions([]);
    setSelectedRolesToAdd([]);
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getModuleColor = (module) => {
    const colors = {
      users: '#1976d2',
      roles: '#7b1fa2',
      sales: '#388e3c',
      inventory: '#f57c00',
      reports: '#d32f2f',
      config: '#455a64'
    };
    return colors[module] || '#757575';
  };

  const groupPermissionsByModule = (permissions) => {
    return permissions.reduce((acc, permission) => {
      const module = permission.module;
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(permission);
      return acc;
    }, {});
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssignmentIcon color="primary" />
              Asignación de Roles
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Buscar usuarios..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 3 }}
          />

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Roles Asignados</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            @{user.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'Activo' : 'Inactivo'}
                        color={user.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {user.roles?.map((role) => (
                          <Chip
                            key={role.id}
                            label={role.displayName}
                            color="primary"
                            size="small"
                          />
                        )) || (
                          <Typography variant="caption" color="textSecondary">
                            Sin roles asignados
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Gestionar roles">
                        <IconButton
                          size="small"
                          onClick={() => handleSelectUser(user)}
                        >
                          <SecurityIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog para gestionar roles del usuario */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          Gestionar Roles - {selectedUser?.firstName} {selectedUser?.lastName}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ pt: 1 }}>
            {/* Roles actuales */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Roles Asignados
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  <List dense>
                    {userRoles.length > 0 ? (
                      userRoles.map((role) => (
                        <ListItem key={role.id}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <SecurityIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={role.displayName}
                            secondary={role.description}
                          />
                          <ListItemSecondaryAction>
                            <Tooltip title="Remover rol">
                              <IconButton
                                edge="end"
                                onClick={() => handleRemoveRole(role.id)}
                                color="error"
                                disabled={role.isSystem}
                              >
                                <RemoveIcon />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))
                    ) : (
                      <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>
                        Sin roles asignados
                      </Typography>
                    )}
                  </List>
                </CardContent>
              </Card>

              {/* Asignar nuevos roles */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Asignar Nuevos Roles
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Seleccionar roles</InputLabel>
                    <Select
                      multiple
                      value={selectedRolesToAdd}
                      onChange={(e) => setSelectedRolesToAdd(e.target.value)}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((roleId) => {
                            const role = availableRoles.find(r => r.id === roleId);
                            return (
                              <Chip key={roleId} label={role?.displayName} size="small" />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {availableRoles.map((role) => (
                        <MenuItem key={role.id} value={role.id}>
                          <Checkbox checked={selectedRolesToAdd.includes(role.id)} />
                          {role.displayName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAssignRoles}
                    disabled={selectedRolesToAdd.length === 0}
                    fullWidth
                  >
                    Asignar Roles Seleccionados
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Permisos efectivos */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Permisos Efectivos
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  {Object.entries(groupPermissionsByModule(userPermissions)).map(([module, modulePermissions]) => (
                    <Accordion key={module}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: getModuleColor(module)
                            }}
                          />
                          <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                            {module}
                          </Typography>
                          <Chip
                            size="small"
                            label={modulePermissions.length}
                            color="primary"
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {modulePermissions.map((permission) => (
                            <ListItem key={permission.id}>
                              <ListItemText
                                primary={permission.displayName}
                                secondary={permission.description}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                  {userPermissions.length === 0 && (
                    <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>
                      Sin permisos asignados
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserRolesManager;