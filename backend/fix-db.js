/**
 * Script de emergencia para añadir columnas faltantes en fe_documents
 */
const { sequelize } = require('./config/database');
const { DataTypes } = require('sequelize');

async function migrate() {
    console.log('--- Iniciando Sincronización de Base de Datos ---');
    try {
        const queryInterface = sequelize.getQueryInterface();
        
        // Verificar tabla fe_documents
        console.log('Verificando tabla fe_documents...');
        const tableInfo = await queryInterface.describeTable('fe_documents');
        
        // 1. Añadir protocol
        if (!tableInfo.protocol) {
            console.log('-> Añadiendo columna "protocol"...');
            await queryInterface.addColumn('fe_documents', 'protocol', {
                type: DataTypes.STRING,
                allowNull: true
            });
            console.log('✅ "protocol" añadida.');
        }

        // 2. Añadir html_content (por si acaso)
        if (!tableInfo.html_content) {
            console.log('-> Añadiendo columna "html_content"...');
            await queryInterface.addColumn('fe_documents', 'html_content', {
                type: DataTypes.TEXT,
                allowNull: true
            });
            console.log('✅ "html_content" añadida.');
        }

        // 3. Añadir pdf_content (por si acaso)
        if (!tableInfo.pdf_content) {
            console.log('-> Añadiendo columna "pdf_content"...');
            await queryInterface.addColumn('fe_documents', 'pdf_content', {
                type: DataTypes.TEXT,
                allowNull: true
            });
            console.log('✅ "pdf_content" añadida.');
        }

        console.log('\n--- Sincronización completada con éxito ---');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERROR CRÍTICO EN MIGRACIÓN:', error.message);
        process.exit(1);
    }
}

migrate();
