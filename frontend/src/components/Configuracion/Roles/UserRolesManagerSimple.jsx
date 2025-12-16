import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const UserRolesManagerSimple = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState('');

  // Función para hacer peticiones a la API
  const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      ...options
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}`);
    }

    return await response.json();
  };

  // Cargar usuarios
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/user-roles');
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Error al cargar usuarios: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar roles
  const loadRoles = async () => {
    try {
      const data = await apiRequest('/roles');
      setRoles(data.roles || []);
    } catch (error) {
      console.error('Error loading roles:', error);
      setError('Error al cargar roles: ' + error.message);
    }
  };

  // Cargar roles de un usuario específico
  const loadUserRoles = async (userId) => {
    try {
      const data = await apiRequest(`/user-roles/${userId}/roles`);
      setUserRoles(data.roles || []);

      // Calcular roles disponibles
      const userRoleIds = data.roles ? data.roles.map(role => role.id) : [];
      const available = roles.filter(role => !userRoleIds.includes(role.id) && role.is_active);
      setAvailableRoles(available);
    } catch (error) {
      console.error('Error loading user roles:', error);
      setError('Error al cargar roles del usuario: ' + error.message);
    }
  };

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  // Abrir diálogo para gestionar roles de usuario
  const handleOpenDialog = async (user) => {
    setSelectedUser(user);
    await loadUserRoles(user.id);
    setOpenDialog(true);
  };

  // Asignar rol a usuario
  const handleAssignRole = async () => {
    if (!selectedRoleToAdd) return;

    try {
      await apiRequest(`/user-roles/${selectedUser.id}/roles/add`, {
        method: 'POST',
        body: JSON.stringify({ role_ids: [parseInt(selectedRoleToAdd)] })
      });

      await loadUserRoles(selectedUser.id);
      await loadUsers();
      setSelectedRoleToAdd('');
    } catch (error) {
      setError('Error al asignar rol: ' + error.message);
    }
  };

  // Remover rol de usuario
  const handleRemoveRole = async (roleId) => {
    if (!window.confirm('¿Estás seguro de que quieres remover este rol del usuario?')) {
      return;
    }

    try {
      await apiRequest(`/user-roles/${selectedUser.id}/roles`, {
        method: 'DELETE',
        body: JSON.stringify({ role_ids: [roleId] })
      });

      await loadUserRoles(selectedUser.id);
      await loadUsers();
    } catch (error) {
      setError('Error al remover rol: ' + error.message);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" component="h2">
              Asignación de Roles a Usuarios
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Roles Asignados</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <PersonIcon sx={{ mr: 1 }} />
                        {user.username}
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {user.Roles && user.Roles.length > 0 ? (
                          user.Roles.map((role) => (
                            <Chip
                              key={role.id}
                              label={role.name}
                              size="small"
                              color="primary"
                            />
                          ))
                        ) : (
                          <Chip label="Sin roles" size="small" variant="outlined" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<AssignmentIcon />}
                        onClick={() => handleOpenDialog(user)}
                      >
                        Gestionar Roles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Diálogo para gestionar roles de usuario */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Gestionar Roles - {selectedUser?.username}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              {/* Roles actuales */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Roles Asignados
                </Typography>
                {userRoles.length > 0 ? (
                  userRoles.map((role) => (
                    <Box key={role.id} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Chip label={role.name} color="primary" />
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleRemoveRole(role.id)}
                      >
                        Remover
                      </Button>
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary">No tiene roles asignados</Typography>
                )}
              </Grid>

              {/* Asignar nuevo rol */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Asignar Nuevo Rol
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Seleccionar Rol</InputLabel>
                  <Select
                    value={selectedRoleToAdd}
                    onChange={(e) => setSelectedRoleToAdd(e.target.value)}
                    label="Seleccionar Rol"
                  >
                    {availableRoles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAssignRole}
                  disabled={!selectedRoleToAdd}
                >
                  Asignar Rol
                </Button>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserRolesManagerSimple;