const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { sequelize } = require('../../config/database');
const { DataTypes } = require('sequelize');

async function migrate() {
    console.log('--- Iniciando Migración: Fecha de Recibido en Notas de Entrega ---');
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('delivery_notes');
        
        if (!tableInfo.received_date) {
            console.log('-> Añadiendo columna "received_date"...');
            await queryInterface.addColumn('delivery_notes', 'received_date', {
                type: DataTypes.DATEONLY,
                allowNull: true
            });
            console.log('✅ "received_date" añadida.');
        } else {
            console.log('ℹ️ La columna "received_date" ya existe.');
        }

        console.log('--- Migración completada con éxito ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ ERROR EN MIGRACIÓN:', error.message);
        process.exit(1);
    }
}

migrate();
