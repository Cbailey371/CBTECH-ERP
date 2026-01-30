# Sistema ERP - Frontend y Backend

Una aplicación ERP completa con autenticación de usuarios, desarrollada con React (frontend) y Node.js/Express (backend).

## 🚀 Características

- ✅ **Autenticación JWT**: Sistema seguro de login con tokens
- ✅ **Frontend React**: Interfaz moderna y responsive
- ✅ **Backend Express**: API RESTful robusta
- ✅ **Diseño responsive**: Funciona en desktop, tablet y móvil
- ✅ **Validaciones**: Validación de formularios y manejo de errores
- ✅ **Contexto de autenticación**: Estado global de usuario
- ✅ **Rutas protegidas**: Navegación segura basada en autenticación

## 📋 Credenciales de prueba

### Usuarios disponibles:
- **Admin**: `admin` / `admin123`
- **Usuario**: `usuario` / `admin123`
- **Manager**: `manager` / `admin123`

## 🛠️ Tecnologías utilizadas

### Frontend
- React 18
- Vite (build tool)
- React Router DOM
- Axios (HTTP client)
- CSS moderno con variables

### Backend
- Node.js
- Express.js
- PostgreSQL (base de datos)
- Sequelize (ORM)
- JWT (JSON Web Tokens)
- bcryptjs (hash de contraseñas)
- CORS

## 📁 Estructura del proyecto

```
ERP/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── config.json
│   ├── migrations/
│   │   └── 20241001000001-create-users.js
│   ├── models/
│   │   ├── User.js
│   │   └── index.js
│   ├── routes/
│   │   └── auth.js
│   ├── seeders/
│   │   └── 20241001000001-demo-users.js
│   ├── .env
│   ├── package.json
│   ├── server.js
│   ├── setup-db.js
│   └── DATABASE_SETUP.md
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Login.jsx
    │   │   ├── Login.css
    │   │   ├── Dashboard.jsx
    │   │   └── Dashboard.css
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── services/
    │   │   └── authService.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## 🚀 Instalación y ejecución

### 📋 Prerrequisitos

1. **Node.js** (versión 16 o superior)
2. **PostgreSQL** (versión 12 o superior)
3. **npm** o **yarn**

### 🗄️ Configurar PostgreSQL

1. Instala PostgreSQL en tu sistema
2. Asegúrate de que esté ejecutándose en el puerto 5432
3. Verifica que puedas conectarte con el usuario `postgres`

Para instrucciones detalladas, consulta: [`backend/DATABASE_SETUP.md`](./backend/DATABASE_SETUP.md)

### 1. Configurar el backend

```bash
cd backend
npm install

# Configurar base de datos (automático)
npm run db:setup

# O paso a paso:
# npm run db:create
# npm run db:migrate
# npm run db:seed
```

### 2. Configurar el frontend

```bash
cd frontend
npm install
```

### 3. Ejecutar la aplicación

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
El backend se ejecutará en: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
El frontend se ejecutará en: http://localhost:3000

## 🔧 Configuración

### Variables de entorno (Backend)
Copie el archivo `.env.example` a `.env` y configure sus propias claves secretas.

> [!CAUTION]
> NUNCA comparta su `JWT_SECRET` ni use las contraseñas por defecto en entornos de producción.

### Base de datos
La aplicación usa PostgreSQL con Sequelize ORM. Los datos se almacenan de forma persistente y incluyen:

- **Usuarios con roles** (admin, user, manager)
- **Contraseñas hasheadas** con bcryptjs
- **Timestamps automáticos** (created_at, updated_at)
- **Índices optimizados** para consultas rápidas

### Comandos de base de datos

```bash
# Configurar base de datos completa
npm run db:setup

# Resetear base de datos (eliminar y recrear)
npm run db:reset

# Solo migraciones
npm run db:migrate

# Solo seeders
npm run db:seed
```

### Proxy (Frontend)
El frontend está configurado para hacer proxy de las peticiones API al backend en `vite.config.js`.

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/verify-token` - Verificar token
- `GET /api/auth/profile` - Obtener perfil de usuario

### Ejemplo de petición de login:
```json
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}
```

### Respuesta exitosa:
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@erp.com",
      "role": "admin"
    }
  }
}
```

## 🎨 Características del diseño

- **Diseño moderno**: Gradientes, sombras y efectos visuales
- **Responsive**: Se adapta a diferentes tamaños de pantalla
- **Accesibilidad**: Preparado para lectores de pantalla
- **Animaciones**: Transiciones suaves y feedback visual
- **CSS Variables**: Sistema de diseño consistente
- **Modo oscuro**: Preparado para futuras implementaciones

## 🔐 Seguridad

- Base de datos PostgreSQL con usuarios persistentes
- Contraseñas hasheadas con bcryptjs (salt rounds: 10)
- Tokens JWT con expiración configurable
- Validación de entrada en frontend y backend
- Headers CORS configurados
- Middleware de autenticación para rutas protegidas
- Verificación de usuarios activos
- Registro de último login

## 🚀 Próximos pasos

- [x] Conectar a base de datos PostgreSQL
- [ ] Implementar registro de usuarios
- [ ] Agregar módulos del ERP (inventario, finanzas, etc.)
- [ ] Implementar recuperación de contraseña
- [ ] Agregar tests unitarios
- [ ] Configurar deployment con Docker
- [ ] Implementar roles y permisos avanzados
- [ ] Agregar logs de auditoría

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.