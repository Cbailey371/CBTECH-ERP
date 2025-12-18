const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
// Cargar variables de entorno robustamente (usando ruta absoluta)
const envPath = path.join(__dirname, '.env');
const result = require('dotenv').config({ path: envPath });

if (result.error) {
  console.error('❌ Error cargando .env desde:', envPath);
} else {
  console.log('✅ Archivo .env cargado desde:', envPath);
}

// Debug de variables críticas (sin mostrar valores reales)
console.log('🔍 Estado de Variables de Entorno:', {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  DB_PASS_EXISTS: !!process.env.DB_PASSWORD, // True si existe, False si no
  ENV_PATH: envPath
});

const { testConnection, sequelize } = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const permissionRoutes = require('./routes/permissions');
const userRoleRoutes = require('./routes/user-roles');
const companyRoutes = require('./routes/companies');
const userCompanyRoutes = require('./routes/userCompanies');
const customerRoutes = require('./routes/customers');
const advancedPermissionsRoutes = require('./routes/advancedPermissions');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { router: auditRoutes } = require('./routes/auditRoutes');
const { router: configRoutes } = require('./routes/config');
const quotationRoutes = require('./routes/quotations');
const productRoutes = require('./routes/products');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const { companyContext } = require('./middleware/companyContext');

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    process.env.FRONTEND_URL || ''
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-company-id', 'X-Company-Id'],
  optionsSuccessStatus: 200 // Para soportar navegadores legacy
}));

// Middleware adicional para manejar preflight requests
app.options('*', cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    process.env.FRONTEND_URL || ''
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-company-id', 'X-Company-Id']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Middleware de contexto de empresa (aplicar después de auth en rutas específicas)
// Se aplicará automáticamente a todas las rutas que lo necesiten

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/user-roles', userRoleRoutes);
app.use('/api/companies', companyContext, companyRoutes);
app.use('/api/user-companies', userCompanyRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/advanced-permissions', advancedPermissionsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/config', configRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/contracts', require('./routes/contracts'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/purchase-orders', require('./routes/purchaseOrders'));
app.use('/api/reports', require('./routes/reports'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'API del sistema ERP funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    await testConnection();

    // Sincronizar modelos (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('🗄️  Modelos sincronizados con la base de datos');
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT} `);
      console.log(`📍 API disponible en: http://localhost:${PORT}`);
      console.log(`🗄️  Base de datos: PostgreSQL conectada`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();
