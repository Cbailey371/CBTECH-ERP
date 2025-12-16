const { sequelize } = require('../config/database');

async function updateSchema() {
    try {
        console.log('🔄 Iniciando actualización de esquema para Suppliers...');

        // 1. Crear tabla suppliers
        try {
            await sequelize.query(`
        CREATE TABLE IF NOT EXISTS suppliers (
          id SERIAL PRIMARY KEY,
          company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
          name VARCHAR(200) NOT NULL,
          ruc VARCHAR(50),
          dv VARCHAR(4),
          email VARCHAR(255),
          phone VARCHAR(50),
          address TEXT,
          contact_name VARCHAR(150),
          payment_terms VARCHAR(50),
          is_active BOOLEAN DEFAULT true,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
            console.log('✅ Tabla suppliers verificada/creada');
        } catch (error) {
            console.error('❌ Error creando tabla suppliers:', error);
        }

        // 2. Índices
        try {
            await sequelize.query(`
        CREATE INDEX IF NOT EXISTS suppliers_company_id_idx ON suppliers(company_id);
        CREATE INDEX IF NOT EXISTS suppliers_company_name_idx ON suppliers(company_id, name);
        CREATE INDEX IF NOT EXISTS suppliers_company_active_idx ON suppliers(company_id, is_active);
      `);
            console.log('✅ Índices para suppliers creados');
        } catch (error) {
            console.error('❌ Error creando índices de suppliers:', error);
        }

        console.log('🏁 Actualización de esquema finalizada exitosamente');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error fatal en actualización de esquema:', error);
        process.exit(1);
    }
}

updateSchema();
