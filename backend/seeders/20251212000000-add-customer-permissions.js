'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const timestamp = new Date();

        // 1. Insertar nuevos permisos para Clientes
        const permissions = [
            { name: 'customers.create', display_name: 'Crear clientes', description: 'Permite crear nuevos clientes', module: 'customers', action: 'create', is_system: true, created_at: timestamp, updated_at: timestamp },
            { name: 'customers.read', display_name: 'Ver clientes', description: 'Permite ver la lista de clientes', module: 'customers', action: 'read', is_system: true, created_at: timestamp, updated_at: timestamp },
            { name: 'customers.update', display_name: 'Actualizar clientes', description: 'Permite editar clientes', module: 'customers', action: 'update', is_system: true, created_at: timestamp, updated_at: timestamp },
            { name: 'customers.delete', display_name: 'Eliminar clientes', description: 'Permite eliminar clientes', module: 'customers', action: 'delete', is_system: true, created_at: timestamp, updated_at: timestamp },
            { name: 'customers.manage', display_name: 'Gestionar clientes', description: 'Acceso completo a clientes', module: 'customers', action: 'manage', is_system: true, created_at: timestamp, updated_at: timestamp }
        ];

        await queryInterface.bulkInsert('permissions', permissions);

        // 2. Asignar permisos a roles existentes
        // Obtener IDs de roles
        const roles = await queryInterface.sequelize.query(
            "SELECT id, name FROM roles WHERE name IN ('super_admin', 'admin', 'manager', 'employee')",
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        const roleMap = {};
        roles.forEach(r => roleMap[r.name] = r.id);

        // Obtener IDs de los nuevos permisos
        const newPermissions = await queryInterface.sequelize.query(
            "SELECT id, name FROM permissions WHERE module = 'customers'",
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        const permMap = {};
        newPermissions.forEach(p => permMap[p.name] = p.id);

        const rolePermissions = [];

        // Helper para asignar
        const assign = (roleName, permName) => {
            if (roleMap[roleName] && permMap[permName]) {
                rolePermissions.push({
                    role_id: roleMap[roleName],
                    permission_id: permMap[permName],
                    created_at: timestamp,
                    updated_at: timestamp
                });
            }
        };

        // Asignaciones
        // Admin & Super Admin: Todo
        ['super_admin', 'admin'].forEach(role => {
            ['customers.create', 'customers.read', 'customers.update', 'customers.delete', 'customers.manage'].forEach(perm => {
                assign(role, perm);
            });
        });

        // Manager: Todo (o restringir delete si se quiere, pero por ahora todo)
        ['customers.create', 'customers.read', 'customers.update', 'customers.delete', 'customers.manage'].forEach(perm => {
            assign('manager', perm);
        });

        // Employee: Solo lectura y crear? Digamos lectura y crear/editar, no borrar.
        ['customers.create', 'customers.read', 'customers.update'].forEach(perm => {
            assign('employee', perm);
        });

        if (rolePermissions.length > 0) {
            await queryInterface.bulkInsert('role_permissions', rolePermissions);
        }
    },

    async down(queryInterface, Sequelize) {
        // Eliminar permisos de clientes (cascade borrará role_permissions)
        await queryInterface.bulkDelete('permissions', { module: 'customers' }, {});
    }
};
