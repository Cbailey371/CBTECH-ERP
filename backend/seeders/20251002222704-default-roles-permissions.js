'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Insertar permisos del sistema
    const permissions = [
      // Permisos para Usuarios
      { name: 'users.create', display_name: 'Crear usuarios', description: 'Permite crear nuevos usuarios', module: 'users', action: 'create', is_system: true },
      { name: 'users.read', display_name: 'Ver usuarios', description: 'Permite ver la lista de usuarios', module: 'users', action: 'read', is_system: true },
      { name: 'users.update', display_name: 'Actualizar usuarios', description: 'Permite editar información de usuarios', module: 'users', action: 'update', is_system: true },
      { name: 'users.delete', display_name: 'Eliminar usuarios', description: 'Permite eliminar usuarios', module: 'users', action: 'delete', is_system: true },
      { name: 'users.manage', display_name: 'Gestionar usuarios', description: 'Acceso completo a gestión de usuarios', module: 'users', action: 'manage', is_system: true },
      
      // Permisos para Roles
      { name: 'roles.create', display_name: 'Crear roles', description: 'Permite crear nuevos roles', module: 'roles', action: 'create', is_system: true },
      { name: 'roles.read', display_name: 'Ver roles', description: 'Permite ver la lista de roles', module: 'roles', action: 'read', is_system: true },
      { name: 'roles.update', display_name: 'Actualizar roles', description: 'Permite editar roles', module: 'roles', action: 'update', is_system: true },
      { name: 'roles.delete', display_name: 'Eliminar roles', description: 'Permite eliminar roles', module: 'roles', action: 'delete', is_system: true },
      { name: 'roles.manage', display_name: 'Gestionar roles', description: 'Acceso completo a gestión de roles', module: 'roles', action: 'manage', is_system: true },
      
      // Permisos para Ventas
      { name: 'sales.create', display_name: 'Crear ventas', description: 'Permite crear nuevas ventas', module: 'sales', action: 'create', is_system: true },
      { name: 'sales.read', display_name: 'Ver ventas', description: 'Permite ver ventas', module: 'sales', action: 'read', is_system: true },
      { name: 'sales.update', display_name: 'Actualizar ventas', description: 'Permite editar ventas', module: 'sales', action: 'update', is_system: true },
      { name: 'sales.delete', display_name: 'Eliminar ventas', description: 'Permite eliminar ventas', module: 'sales', action: 'delete', is_system: true },
      { name: 'sales.manage', display_name: 'Gestionar ventas', description: 'Acceso completo a ventas', module: 'sales', action: 'manage', is_system: true },
      
      // Permisos para Inventario
      { name: 'inventory.create', display_name: 'Crear productos', description: 'Permite crear productos', module: 'inventory', action: 'create', is_system: true },
      { name: 'inventory.read', display_name: 'Ver inventario', description: 'Permite ver inventario', module: 'inventory', action: 'read', is_system: true },
      { name: 'inventory.update', display_name: 'Actualizar inventario', description: 'Permite editar inventario', module: 'inventory', action: 'update', is_system: true },
      { name: 'inventory.delete', display_name: 'Eliminar productos', description: 'Permite eliminar productos', module: 'inventory', action: 'delete', is_system: true },
      { name: 'inventory.manage', display_name: 'Gestionar inventario', description: 'Acceso completo a inventario', module: 'inventory', action: 'manage', is_system: true },
      
      // Permisos para Reportes
      { name: 'reports.read', display_name: 'Ver reportes', description: 'Permite ver reportes', module: 'reports', action: 'read', is_system: true },
      { name: 'reports.manage', display_name: 'Gestionar reportes', description: 'Acceso completo a reportes', module: 'reports', action: 'manage', is_system: true },
      
      // Permisos para Configuración
      { name: 'config.read', display_name: 'Ver configuración', description: 'Permite ver configuración', module: 'config', action: 'read', is_system: true },
      { name: 'config.update', display_name: 'Actualizar configuración', description: 'Permite editar configuración', module: 'config', action: 'update', is_system: true },
      { name: 'config.manage', display_name: 'Gestionar configuración', description: 'Acceso completo a configuración', module: 'config', action: 'manage', is_system: true }
    ];

    const timestamp = new Date();
    const permissionsWithTimestamp = permissions.map(permission => ({
      ...permission,
      created_at: timestamp,
      updated_at: timestamp
    }));

    await queryInterface.bulkInsert('permissions', permissionsWithTimestamp);

    // Insertar roles del sistema
    const roles = [
      {
        name: 'super_admin',
        display_name: 'Super Administrador',
        description: 'Acceso completo a todo el sistema',
        is_system: true,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        name: 'admin',
        display_name: 'Administrador',
        description: 'Administrador del sistema con acceso a la mayoría de funciones',
        is_system: true,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        name: 'manager',
        display_name: 'Gerente',
        description: 'Gerente con acceso a ventas, inventario y reportes',
        is_system: true,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        name: 'employee',
        display_name: 'Empleado',
        description: 'Empleado con acceso básico',
        is_system: true,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      }
    ];

    await queryInterface.bulkInsert('roles', roles);

    // Obtener IDs de roles y permisos para crear las relaciones
    const insertedRoles = await queryInterface.sequelize.query(
      'SELECT id, name FROM roles WHERE name IN (:roleNames)',
      {
        replacements: { roleNames: ['super_admin', 'admin', 'manager', 'employee'] },
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );

    const insertedPermissions = await queryInterface.sequelize.query(
      'SELECT id, name FROM permissions',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Crear mapas para facilitar la búsqueda
    const roleMap = {};
    insertedRoles.forEach(role => {
      roleMap[role.name] = role.id;
    });

    const permissionMap = {};
    insertedPermissions.forEach(permission => {
      permissionMap[permission.name] = permission.id;
    });

    // Asignar permisos a roles
    const rolePermissions = [];

    // Super Admin: todos los permisos
    insertedPermissions.forEach(permission => {
      rolePermissions.push({
        role_id: roleMap['super_admin'],
        permission_id: permission.id,
        created_at: timestamp,
        updated_at: timestamp
      });
    });

    // Admin: todos excepto algunos de configuración crítica
    const adminPermissions = [
      'users.create', 'users.read', 'users.update', 'users.delete',
      'roles.read', 'roles.update',
      'sales.manage', 'inventory.manage', 'reports.read',
      'config.read', 'config.update'
    ];
    adminPermissions.forEach(permName => {
      if (permissionMap[permName]) {
        rolePermissions.push({
          role_id: roleMap['admin'],
          permission_id: permissionMap[permName],
          created_at: timestamp,
          updated_at: timestamp
        });
      }
    });

    // Manager: ventas, inventario y reportes
    const managerPermissions = [
      'sales.manage', 'inventory.read', 'inventory.update', 'reports.read'
    ];
    managerPermissions.forEach(permName => {
      if (permissionMap[permName]) {
        rolePermissions.push({
          role_id: roleMap['manager'],
          permission_id: permissionMap[permName],
          created_at: timestamp,
          updated_at: timestamp
        });
      }
    });

    // Employee: solo lectura básica
    const employeePermissions = [
      'sales.read', 'inventory.read'
    ];
    employeePermissions.forEach(permName => {
      if (permissionMap[permName]) {
        rolePermissions.push({
          role_id: roleMap['employee'],
          permission_id: permissionMap[permName],
          created_at: timestamp,
          updated_at: timestamp
        });
      }
    });

    await queryInterface.bulkInsert('role_permissions', rolePermissions);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('role_permissions', null, {});
    await queryInterface.bulkDelete('roles', null, {});
    await queryInterface.bulkDelete('permissions', null, {});
  }
};
