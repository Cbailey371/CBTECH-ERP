import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeProvider';

const UserCompanyList = ({ userCompanies = [], viewMode = 'user', loading, onRemove, onUpdate }) => {
  const { isDarkMode } = useTheme();
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  const handleMenuToggle = (item) => {
    setMenuOpen(menuOpen?.id === item.id ? null : item);
    setSelectedItem(item);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    setMenuOpen(null);
  };

  const handleConfirmDelete = () => {
    if (selectedItem && onRemove) {
      onRemove(selectedItem.id);
    }
    setDeleteDialogOpen(false);
    setSelectedItem(null);
  };

  const handleToggleDefault = () => {
    if (selectedItem && onUpdate) {
      onUpdate(selectedItem.id, { isDefault: !selectedItem.isDefault });
    }
    setMenuOpen(null);
  };

  const handleToggleActive = () => {
    if (selectedItem && onUpdate) {
      onUpdate(selectedItem.id, { isActive: !selectedItem.isActive });
    }
    setMenuOpen(null);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'manager':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'user':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'viewer':
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'manager':
        return 'Gerente';
      case 'user':
        return 'Usuario';
      case 'viewer':
        return 'Visualizador';
      default:
        return 'Usuario';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'manager':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'user':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const countPermissions = (permissions) => {
    if (!permissions || typeof permissions !== 'object') return 0;
    return Object.values(permissions).filter(Boolean).length;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography>Cargando accesos...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!userCompanies.length) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay accesos configurados
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {viewMode === 'user' 
                ? 'Este usuario no tiene acceso a ninguna empresa'
                : 'Esta empresa no tiene usuarios asignados'
              }
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {viewMode === 'user' ? 'Empresas Asignadas' : 'Usuarios con Acceso'}
            <Chip 
              label={userCompanies.length} 
              size="small" 
              sx={{ ml: 1 }}
            />
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  {viewMode === 'user' ? (
                    <>
                      <TableCell>Empresa</TableCell>
                      <TableCell>Rol</TableCell>
                      <TableCell>Permisos</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Asignado</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>Usuario</TableCell>
                      <TableCell>Rol</TableCell>
                      <TableCell>Permisos</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Asignado</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {userCompanies.map((item) => (
                  <TableRow key={item.id} hover>
                    {viewMode === 'user' ? (
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <BusinessIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {item.company?.name}
                              {item.isDefault && (
                                <StarIcon color="warning" fontSize="small" sx={{ ml: 1 }} />
                              )}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.company?.legalName}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                    ) : (
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {item.user?.firstName} {item.user?.lastName}
                              {item.isDefault && (
                                <StarIcon color="warning" fontSize="small" sx={{ ml: 1 }} />
                              )}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.user?.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                    )}

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getRoleIcon(item.role)}
                        <Chip
                          label={getRoleLabel(item.role)}
                          size="small"
                          color={getRoleColor(item.role)}
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Tooltip title="Ver permisos detallados">
                        <Badge
                          badgeContent={countPermissions(item.permissions)}
                          color="primary"
                        >
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedItem(item);
                              setPermissionsDialogOpen(true);
                            }}
                          >
                            <ShieldIcon />
                          </IconButton>
                        </Badge>
                      </Tooltip>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Chip
                          label={item.isActive ? 'Activo' : 'Inactivo'}
                          size="small"
                          color={item.isActive ? 'success' : 'default'}
                        />
                        {item.isDefault && (
                          <Chip
                            label="Por defecto"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption">
                        {formatDate(item.assignedAt)}
                      </Typography>
                      {item.assignedByUser && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          por {item.assignedByUser.username}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell align="center">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, item)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Menu de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleToggleDefault}>
          {selectedItem?.isDefault ? (
            <>
              <StarBorderIcon sx={{ mr: 1 }} />
              Quitar como defecto
            </>
          ) : (
            <>
              <StarIcon sx={{ mr: 1 }} />
              Marcar como defecto
            </>
          )}
        </MenuItem>
        <MenuItem onClick={handleToggleActive}>
          <EditIcon sx={{ mr: 1 }} />
          {selectedItem?.isActive ? 'Desactivar' : 'Activar'} acceso
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Eliminar acceso
        </MenuItem>
      </Menu>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta acción no se puede deshacer
          </Alert>
          <Typography>
            ¿Estás seguro de que quieres eliminar el acceso de{' '}
            <strong>
              {viewMode === 'user' 
                ? selectedItem?.company?.name
                : `${selectedItem?.user?.firstName} ${selectedItem?.user?.lastName}`
              }
            </strong>
            ?
          </Typography>
          {selectedItem?.isDefault && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Advertencia: Este es el acceso por defecto del usuario
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de permisos */}
      <Dialog 
        open={permissionsDialogOpen} 
        onClose={() => setPermissionsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Permisos Detallados
          {selectedItem && (
            <Typography variant="subtitle2" color="text.secondary">
              {viewMode === 'user' 
                ? selectedItem.company?.name
                : `${selectedItem.user?.firstName} ${selectedItem.user?.lastName}`
              } • {getRoleLabel(selectedItem.role)}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedItem?.permissions && (
            <Grid container spacing={2}>
              {Object.entries(selectedItem.permissions).map(([permission, granted]) => (
                <Grid item xs={12} sm={6} md={4} key={permission}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={granted ? 'Permitido' : 'Denegado'}
                      size="small"
                      color={granted ? 'success' : 'default'}
                      variant={granted ? 'filled' : 'outlined'}
                    />
                    <Typography variant="body2">
                      {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
          {selectedItem?.notes && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Notas:</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedItem.notes}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionsDialogOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserCompanyList;