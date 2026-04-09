const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { sequelize } = require('../../config/database');
const { DataTypes } = require('sequelize');

async function migrate() {
    console.log('--- Iniciando Migración: Firma en Notas de Entrega ---');
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('delivery_notes');
        
        if (!tableInfo.signature) {
            console.log('-> Añadiendo columna "signature"...');
            await queryInterface.addColumn('delivery_notes', 'signature', {
                type: DataTypes.TEXT,
                allowNull: true
            });
            console.log('✅ "signature" añadida.');
        }

        if (!tableInfo.recipient_name) {
            console.log('-> Añadiendo columna "recipient_name"...');
            await queryInterface.addColumn('delivery_notes', 'recipient_name', {
                type: DataTypes.STRING,
                allowNull: true
            });
            console.log('✅ "recipient_name" añadida.');
        }

        console.log('--- Migración completada con éxito ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ ERROR EN MIGRACIÓN:', error.message);
        process.exit(1);
    }
}

migrate();
