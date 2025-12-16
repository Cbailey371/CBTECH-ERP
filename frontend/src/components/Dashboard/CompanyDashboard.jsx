import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Paper,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  ShoppingCart as CartIcon,
  Assessment as AssessmentIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { useCompany } from '../../context/CompanyContext';
import { usePermissions } from '../../context/PermissionsContext';
import { PermissionGuard, ModuleGuard } from '../Permissions/PermissionComponents';
import dashboardService from '../../services/dashboardService';

const CompanyDashboard = () => {
  const { currentCompany } = useCompany();
  const { hasPermission, canPerformAction } = usePermissions();
  
  const [metrics, setMetrics] = useState({
    sales: { total: 0, trend: 0, loading: true },
    customers: { total: 0, trend: 0, loading: true },
    products: { total: 0, lowStock: 0, loading: true },
    orders: { pending: 0, completed: 0, loading: true }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    if (currentCompany) {
      loadDashboardData();
    }
  }, [currentCompany]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar métricas del dashboard
      const metricsResult = await dashboardService.getDashboardMetrics(
        currentCompany.company.id, 
        'month'
      );
      
      if (metricsResult.success) {
        const formattedMetrics = dashboardService.formatMetrics(metricsResult.data);
        setMetrics(formattedMetrics);
      } else {
        // Usar datos mock si falla la API
        const mockData = dashboardService.getMockMetrics(currentCompany.company.id);
        const formattedMetrics = dashboardService.formatMetrics(mockData);
        setMetrics(formattedMetrics);
        
        console.warn('Usando datos de ejemplo:', metricsResult.error);
      }
      
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      
      // Usar datos mock como fallback
      const mockData = dashboardService.getMockMetrics(currentCompany.company.id);
      const formattedMetrics = dashboardService.formatMetrics(mockData);
      setMetrics(formattedMetrics);
      
      setError('Error al cargar los datos. Mostrando datos de ejemplo.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: currentCompany?.company?.defaultCurrency || 'PAB'
    }).format(amount);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('es-PA').format(number);
  };

  const getTrendIcon = (trend) => {
    return trend >= 0 ? (
      <TrendingUpIcon color="success" fontSize="small" />
    ) : (
      <TrendingDownIcon color="error" fontSize="small" />
    );
  };

  const getTrendColor = (trend) => {
    return trend >= 0 ? 'success' : 'error';
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRefresh = () => {
    loadDashboardData();
    handleMenuClose();
  };

  if (!currentCompany) {
    return (
      <Alert severity="warning">
        Selecciona una empresa para ver el dashboard
      </Alert>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header del Dashboard */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              <BusinessIcon />
            </Avatar>
            <Box>
              <Typography variant="h4" gutterBottom>
                Dashboard - {currentCompany.company?.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Panel de control personalizado para {currentCompany.company?.legalName}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip
                  label={currentCompany.role}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                {currentCompany.isDefault && (
                  <Chip
                    label="Empresa por defecto"
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Box>
          
          <Box>
            <IconButton onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleRefresh}>
                <RefreshIcon sx={{ mr: 1 }} />
                Actualizar datos
              </MenuItem>
              <MenuItem>
                <DateRangeIcon sx={{ mr: 1 }} />
                Cambiar período
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Paper>

      {/* Métricas Principales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Ventas */}
        <Grid item xs={12} sm={6} md={3}>
          <ModuleGuard module="sales" action="view" fallback={null}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <MoneyIcon />
                  </Avatar>
                  <Typography variant="h6">Ventas</Typography>
                </Box>
                
                {metrics.sales.loading ? (
                  <CircularProgress size={24} />
                ) : (
                  <>
                    <Typography variant="h4" gutterBottom>
                      {formatCurrency(metrics.sales.total)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getTrendIcon(metrics.sales.trend)}
                      <Typography
                        variant="body2"
                        color={getTrendColor(metrics.sales.trend)}
                      >
                        {Math.abs(metrics.sales.trend)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {metrics.sales.period}
                      </Typography>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </ModuleGuard>
        </Grid>

        {/* Clientes */}
        <Grid item xs={12} sm={6} md={3}>
          <ModuleGuard module="customers" action="view" fallback={null}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                    <PeopleIcon />
                  </Avatar>
                  <Typography variant="h6">Clientes</Typography>
                </Box>
                
                {metrics.customers.loading ? (
                  <CircularProgress size={24} />
                ) : (
                  <>
                    <Typography variant="h4" gutterBottom>
                      {formatNumber(metrics.customers.total)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getTrendIcon(metrics.customers.trend)}
                      <Typography
                        variant="body2"
                        color={getTrendColor(metrics.customers.trend)}
                      >
                        {Math.abs(metrics.customers.trend)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {metrics.customers.period}
                      </Typography>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </ModuleGuard>
        </Grid>

        {/* Productos */}
        <Grid item xs={12} sm={6} md={3}>
          <ModuleGuard module="products" action="view" fallback={null}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                    <InventoryIcon />
                  </Avatar>
                  <Typography variant="h6">Productos</Typography>
                </Box>
                
                {metrics.products.loading ? (
                  <CircularProgress size={24} />
                ) : (
                  <>
                    <Typography variant="h4" gutterBottom>
                      {formatNumber(metrics.products.total)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="warning.main">
                        {metrics.products.lowStock} con stock bajo
                      </Typography>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </ModuleGuard>
        </Grid>

        {/* Órdenes */}
        <Grid item xs={12} sm={6} md={3}>
          <ModuleGuard module="sales" action="view" fallback={null}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <CartIcon />
                  </Avatar>
                  <Typography variant="h6">Órdenes</Typography>
                </Box>
                
                {metrics.orders.loading ? (
                  <CircularProgress size={24} />
                ) : (
                  <>
                    <Typography variant="h4" gutterBottom>
                      {formatNumber(metrics.orders.pending)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {metrics.orders.completed} completadas
                      </Typography>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </ModuleGuard>
        </Grid>
      </Grid>

      {/* Secciones Adicionales */}
      <Grid container spacing={3}>
        {/* Actividad Reciente */}
        <Grid item xs={12} md={6}>
          <PermissionGuard permissions={['sales.view', 'customers.view']} showMessage>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Actividad Reciente
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {loading ? (
                  <LinearProgress />
                ) : (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      • Nueva venta por $1,250.00
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Cliente registrado: Juan Pérez
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Producto con stock bajo: Laptop Dell
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Orden completada #12345
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </PermissionGuard>
        </Grid>

        {/* Reportes Rápidos */}
        <Grid item xs={12} md={6}>
          <ModuleGuard module="reports" fallback={null}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Reportes Rápidos
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <PermissionGuard permission="reports.sales">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AssessmentIcon color="primary" />
                      <Typography variant="body2">Reporte de Ventas</Typography>
                    </Box>
                  </PermissionGuard>
                  
                  <PermissionGuard permission="reports.inventory">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InventoryIcon color="primary" />
                      <Typography variant="body2">Reporte de Inventario</Typography>
                    </Box>
                  </PermissionGuard>
                  
                  <PermissionGuard permission="reports.customers">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon color="primary" />
                      <Typography variant="body2">Análisis de Clientes</Typography>
                    </Box>
                  </PermissionGuard>
                </Box>
              </CardContent>
            </Card>
          </ModuleGuard>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default CompanyDashboard;