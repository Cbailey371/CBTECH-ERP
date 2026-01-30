const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
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

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares de seguridad
app.use(helmet()); // Añade cabeceras de seguridad HTTP

// Rate Limiting para prevenir fuerza bruta y DoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 peticiones por ventana
  message: { message: 'Demasiadas peticiones desde esta IP, por favor intente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limit general
app.use('/api/', limiter);

// Rate limit más estricto para login y autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Solo 20 intentos por 15 minutos
  message: { message: 'Demasiados intentos de acceso, por favor intente más tarde.' }
});
app.use('/api/auth/login', authLimiter);

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
  optionsSuccessStatus: 200
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ELIMINADO: app.use('/uploads', express.static('uploads')); 
// Ahora los archivos se sirven mediante una ruta protegida

// Rutas protegidas (Añadir contexto de empresa preventivo a rutas críticas si no lo tienen)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/user-roles', userRoleRoutes);
app.use('/api/companies', companyContext, companyRoutes);
app.use('/api/user-companies', userCompanyRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/advanced-permissions', advancedPermissionsRoutes);
app.use('/api/dashboard', companyContext, dashboardRoutes);
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
app.use('/api/fepa', require('./routes/fepaRoutes'));
app.use('/api/sales-orders', require('./routes/salesOrderRoutes'));
app.use('/api/pac-providers', require('./routes/pacProviders'));
app.use('/api/credit-notes', require('./routes/creditNotes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/delivery-notes', require('./routes/deliveryNotes'));

// Nueva ruta protegida para archivos
app.use('/api/files', require('./routes/fileRoutes'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'API del sistema ERP securizada',
    version: '1.1.0',
    timestamp: new Date().toISOString()
  });
});

// Middleware de manejo de errores mejorado
app.use((err, req, res, next) => {
  // En producción, nunca mostrar err.stack o detalles técnicos
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.error('🔴 Error:', err);
  } else {
    // Loguear solo lo esencial para auditoría interna
    console.error(`[${new Date().toISOString()}] Error en ${req.method} ${req.originalUrl}: ${err.message}`);
  }

  res.status(err.status || 500).json({
    success: false,
    message: isDev ? err.message : 'Ha ocurrido un error interno en el servidor.',
    // En producción, error está vacío o es un código genérico
    code: err.code || 'INTERNAL_SERVER_ERROR'
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
