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
  TextField,
  FormControl,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';

const RolesManagerSimple = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    is_active: true,
    permissions: []
  });

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

  // Cargar roles
  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/roles?include_permissions=true');
      setRoles(data.roles || []);
    } catch (error) {
      console.error('Error loading roles:', error);
      setError('Error al cargar roles: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar permisos
  const loadPermissions = async () => {
    try {
      const data = await apiRequest('/permissions/grouped/by-module');
      setPermissions(data || {});
    } catch (error) {
      console.error('Error loading permissions:', error);
      setError('Error al cargar permisos: ' + error.message);
    }
  };

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  // Manejar creación/edición de rol
  const handleSubmit = async () => {
    try {
      const roleData = {
        ...formData,
        permission_ids: formData.permissions
      };

      if (selectedRole) {
        await apiRequest(`/roles/${selectedRole.id}`, {
          method: 'PUT',
          body: JSON.stringify(roleData)
        });
      } else {
        await apiRequest('/roles', {
          method: 'POST',
          body: JSON.stringify(roleData)
        });
      }

      setOpenDialog(false);
      setSelectedRole(null);
      setFormData({
        name: '',
        display_name: '',
        description: '',
        is_active: true,
        permissions: []
      });
      loadRoles();
    } catch (error) {
      setError('Error al guardar rol: ' + error.message);
    }
  };

  // Manejar eliminación de rol
  const handleDelete = async (roleId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este rol?')) {
      return;
    }

    try {
      await apiRequest(`/roles/${roleId}`, { method: 'DELETE' });
      loadRoles();
    } catch (error) {
      setError('Error al eliminar rol: ' + error.message);
    }
  };

  // Abrir diálogo para crear/editar rol
  const handleOpenDialog = (role = null) => {
    if (role) {
      setSelectedRole(role);
      setFormData({
        name: role.name,
        display_name: role.display_name || role.name,
        description: role.description || '',
        is_active: role.is_active,
        permissions: role.Permissions ? role.Permissions.map(p => p.id) : []
      });
    } else {
      setSelectedRole(null);
      setFormData({
        name: '',
        display_name: '',
        description: '',
        is_active: true,
        permissions: []
      });
    }
    setOpenDialog(true);
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
              Gestión de Roles
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Nuevo Rol
            </Button>
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
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Permisos</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>{role.display_name || role.name}</TableCell>
                    <TableCell>{role.description || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={role.is_active ? 'Activo' : 'Inactivo'}
                        color={role.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {role.Permissions ? role.Permissions.length : 0} permisos
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDialog(role)}
                        sx={{ mr: 1 }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(role.id)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Diálogo para crear/editar rol */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRole ? 'Editar Rol' : 'Crear Nuevo Rol'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nombre del rol (interno)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{ mb: 2 }}
              placeholder="admin, usuario, editor, etc."
              helperText="Nombre interno del rol (sin espacios ni caracteres especiales)"
            />
            <TextField
              fullWidth
              label="Nombre para mostrar"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              sx={{ mb: 2 }}
              placeholder="Administrador, Usuario, Editor, etc."
              helperText="Nombre que se mostrará en la interfaz"
            />
            <TextField
              fullWidth
              label="Descripción"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="Rol activo"
            />

            {/* Permisos */}
            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Permisos
            </Typography>
            {Object.entries(permissions).map(([module, modulePermissions]) => (
              <Accordion key={module}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{module}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {modulePermissions.map((permission) => (
                    <FormControlLabel
                      key={permission.id}
                      control={
                        <Checkbox
                          checked={formData.permissions.includes(permission.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                permissions: [...formData.permissions, permission.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                permissions: formData.permissions.filter(id => id !== permission.id)
                              });
                            }
                          }}
                        />
                      }
                      label={`${permission.name} - ${permission.description}`}
                    />
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedRole ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RolesManagerSimple;