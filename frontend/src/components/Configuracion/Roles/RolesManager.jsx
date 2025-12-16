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
  Divider
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

const RolesManager = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    is_active: true,
    permissions: []
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const loadRoles = async () => {
    try {
      const data = await rolesService.getRoles({ include_permissions: true });
      setRoles(data.roles);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
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

  const handleOpenDialog = (role = null) => {
    if (role) {
      setSelectedRole(role);
      setFormData({
        name: role.name,
        display_name: role.displayName,
        description: role.description || '',
        is_active: role.isActive,
        permissions: role.permissions ? role.permissions.map(p => p.id) : []
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

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRole(null);
  };

  const handleSubmit = async () => {
    try {
      const roleData = {
        ...formData,
        permission_ids: formData.permissions
      };

      if (selectedRole) {
        await rolesService.updateRole(selectedRole.id, roleData);
        setSnackbar({ 
          open: true, 
          message: 'Rol actualizado correctamente', 
          severity: 'success' 
        });
      } else {
        await rolesService.createRole(roleData);
        setSnackbar({ 
          open: true, 
          message: 'Rol creado correctamente', 
          severity: 'success' 
        });
      }
      
      loadRoles();
      handleCloseDialog();
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este rol?')) {
      return;
    }

    try {
      await rolesService.deleteRole(roleId);
      setSnackbar({ open: true, message: 'Rol eliminado correctamente', severity: 'success' });
      loadRoles();
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handlePermissionChange = (permissionId, checked) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(id => id !== permissionId)
    }));
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
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

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon color="primary" />
              Gestión de Roles
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              disabled={loading}
            >
              Nuevo Rol
            </Button>
          </Box>

          <TextField
            fullWidth
            label="Buscar roles..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 3 }}
          />

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Permisos</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {role.displayName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {role.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={role.isActive ? 'Activo' : 'Inactivo'}
                        color={role.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={role.isSystem ? 'Sistema' : 'Personalizado'}
                        color={role.isSystem ? 'secondary' : 'primary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${role.permissions?.length || 0} permisos`}
                        color="info"
                        size="small"
                        icon={<PeopleIcon />}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(role)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(role)}
                          disabled={role.isSystem}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(role.id)}
                          disabled={role.isSystem}
                          color="error"
                        >
                          <DeleteIcon />
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

      {/* Dialog para crear/editar rol */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRole ? 'Editar Rol' : 'Nuevo Rol'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Nombre del rol"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              disabled={selectedRole?.isSystem}
            />
            <TextField
              fullWidth
              label="Nombre para mostrar"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Descripción"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={2}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="Rol activo"
              sx={{ mt: 1 }}
            />

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Permisos del Rol
            </Typography>

            {Object.entries(permissions).map(([module, modulePermissions]) => (
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
                      label={`${modulePermissions.filter(p => formData.permissions.includes(p.id)).length}/${modulePermissions.length}`}
                      color="primary"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <FormGroup>
                    {modulePermissions.map((permission) => (
                      <FormControlLabel
                        key={permission.id}
                        control={
                          <Checkbox
                            checked={formData.permissions.includes(permission.id)}
                            onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {permission.displayName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {permission.description}
                            </Typography>
                          </Box>
                        }
                      />
                    ))}
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedRole ? 'Actualizar' : 'Crear'}
          </Button>
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

export default RolesManager;