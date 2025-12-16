'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const timestamp = new Date();

        // 1. Insertar nuevos permisos para Cotizaciones
        const permissions = [
            { name: 'quotations.create', display_name: 'Crear cotizaciones', description: 'Permite crear nuevas cotizaciones', module: 'quotations', action: 'create', is_system: true, created_at: timestamp, updated_at: timestamp },
            { name: 'quotations.read', display_name: 'Ver cotizaciones', description: 'Permite ver la lista de cotizaciones', module: 'quotations', action: 'read', is_system: true, created_at: timestamp, updated_at: timestamp },
            { name: 'quotations.update', display_name: 'Actualizar cotizaciones', description: 'Permite editar cotizaciones', module: 'quotations', action: 'update', is_system: true, created_at: timestamp, updated_at: timestamp },
            { name: 'quotations.delete', display_name: 'Eliminar cotizaciones', description: 'Permite eliminar cotizaciones', module: 'quotations', action: 'delete', is_system: true, created_at: timestamp, updated_at: timestamp },
            { name: 'quotations.manage', display_name: 'Gestionar cotizaciones', description: 'Acceso completo a cotizaciones', module: 'quotations', action: 'manage', is_system: true, created_at: timestamp, updated_at: timestamp }
        ];

        await queryInterface.bulkInsert('permissions', permissions);

        // 2. Asignar permisos a roles existentes
        const roles = await queryInterface.sequelize.query(
            "SELECT id, name FROM roles WHERE name IN ('super_admin', 'admin', 'manager', 'employee')",
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        const roleMap = {};
        roles.forEach(r => roleMap[r.name] = r.id);

        const newPermissions = await queryInterface.sequelize.query(
            "SELECT id, name FROM permissions WHERE module = 'quotations'",
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        const permMap = {};
        newPermissions.forEach(p => permMap[p.name] = p.id);

        const rolePermissions = [];

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
        ['super_admin', 'admin', 'manager'].forEach(role => {
            ['quotations.create', 'quotations.read', 'quotations.update', 'quotations.delete', 'quotations.manage'].forEach(perm => {
                assign(role, perm);
            });
        });

        // Employee: Solo lectura y crear
        ['quotations.create', 'quotations.read', 'quotations.update'].forEach(perm => {
            assign('employee', perm);
        });

        if (rolePermissions.length > 0) {
            await queryInterface.bulkInsert('role_permissions', rolePermissions);
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('permissions', { module: 'quotations' }, {});
    }
};
