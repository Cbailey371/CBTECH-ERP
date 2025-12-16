# Configuración de PostgreSQL para ERP

## 📋 Prerrequisitos

Antes de configurar la aplicación, asegúrate de tener PostgreSQL instalado y ejecutándose en tu sistema local.

### Instalación de PostgreSQL en macOS

```bash
# Usando Homebrew
brew install postgresql
brew services start postgresql

# O usando MacPorts
sudo port install postgresql14-server
```

### Instalación de PostgreSQL en Ubuntu/Debian

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Instalación de PostgreSQL en Windows

1. Descarga PostgreSQL desde https://www.postgresql.org/download/windows/
2. Ejecuta el instalador y sigue las instrucciones
3. Asegúrate de recordar la contraseña del usuario `postgres`

## 🔧 Configuración inicial

### 1. Configurar usuario PostgreSQL (si es necesario)

```bash
# Acceder a PostgreSQL como superusuario
sudo -u postgres psql

# Crear usuario si no existe
CREATE USER postgres WITH PASSWORD 'postgres';
ALTER USER postgres CREATEDB;

# Salir de PostgreSQL
\q
```

### 2. Verificar conexión

```bash
# Probar conexión
psql -h localhost -U postgres -d postgres
```

## ⚙️ Configuración de variables de entorno

El archivo `.env` en el backend debe contener:

```env
# Base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_DIALECT=postgres
```

**⚠️ Importante:** Cambia estos valores según tu configuración local de PostgreSQL.

## 🚀 Configuración de la base de datos

### Opción 1: Script automático (Recomendado)

```bash
cd backend
npm install
npm run db:setup
```

### Opción 2: Paso a paso

```bash
cd backend
npm install

# Crear base de datos
npm run db:create

# Ejecutar migraciones
npm run db:migrate

# Insertar datos iniciales
npm run db:seed
```

### Opción 3: Resetear base de datos

```bash
npm run db:reset
```

## 📊 Estructura de la base de datos

### Tabla: users

| Campo      | Tipo         | Descripción                    |
|------------|--------------|--------------------------------|
| id         | INTEGER      | Primary key (auto increment)  |
| username   | VARCHAR(50)  | Nombre de usuario (único)      |
| email      | VARCHAR(100) | Email (único)                  |
| password   | VARCHAR(255) | Contraseña hasheada            |
| first_name | VARCHAR(50)  | Nombre                         |
| last_name  | VARCHAR(50)  | Apellido                       |
| role       | ENUM         | admin, user, manager           |
| is_active  | BOOLEAN      | Usuario activo                 |
| last_login | TIMESTAMP    | Último login                   |
| created_at | TIMESTAMP    | Fecha de creación              |
| updated_at | TIMESTAMP    | Fecha de actualización         |

## 👤 Usuarios por defecto

Después de ejecutar los seeders, tendrás estos usuarios disponibles:

| Username | Email           | Password | Rol     |
|----------|-----------------|----------|---------|
| admin    | admin@erp.com   | admin123 | admin   |
| usuario  | usuario@erp.com | admin123 | user    |
| manager  | manager@erp.com | admin123 | manager |

## 🔍 Comandos útiles

### Sequelize CLI

```bash
# Crear nueva migración
npx sequelize migration:generate --name nombre-migracion

# Crear nuevo seeder
npx sequelize seed:generate --name nombre-seeder

# Revertir última migración
npx sequelize db:migrate:undo

# Revertir todos los seeders
npx sequelize db:seed:undo:all

# Ver estado de migraciones
npx sequelize db:migrate:status
```

### PostgreSQL CLI

```bash
# Conectarse a la base de datos
psql -h localhost -U postgres -d erp_db

# Listar todas las tablas
\dt

# Describir tabla
\d users

# Ver usuarios
SELECT * FROM users;

# Salir
\q
```

## 🛠️ Solución de problemas

### Error: "role 'postgres' does not exist"

```bash
sudo -u postgres createuser --superuser $USER
```

### Error: "database 'erp_db' does not exist"

```bash
sudo -u postgres createdb erp_db
```

### Error: "password authentication failed"

1. Editar archivo de configuración PostgreSQL:
   ```bash
   sudo nano /etc/postgresql/14/main/pg_hba.conf
   ```

2. Cambiar la línea:
   ```
   local   all             postgres                                peer
   ```
   por:
   ```
   local   all             postgres                                md5
   ```

3. Reiniciar PostgreSQL:
   ```bash
   sudo systemctl restart postgresql
   ```

### Error: "port 5432 already in use"

```bash
# Ver qué proceso usa el puerto
sudo lsof -i :5432

# Detener PostgreSQL si es necesario
brew services stop postgresql
# o
sudo systemctl stop postgresql
```

## 🔐 Seguridad en producción

Para producción, asegúrate de:

1. **Cambiar contraseñas por defecto**
2. **Usar variables de entorno seguras**
3. **Configurar SSL/TLS**
4. **Restringir acceso a la base de datos**
5. **Hacer backups regulares**

```bash
# Ejemplo de backup
pg_dump -h localhost -U postgres erp_db > backup.sql

# Restaurar backup
psql -h localhost -U postgres erp_db < backup.sql
```