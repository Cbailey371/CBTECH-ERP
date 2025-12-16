'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Simplemente recrear la columna tax_id_type con los valores correctos
    await queryInterface.sequelize.query(`
      ALTER TABLE companies ADD COLUMN tax_id_type_new "public"."enum_companies_tax_id_type" NOT NULL DEFAULT 'RUC';
    `);
    
    // Actualizar valores: convertir cualquier valor existente a RUC
    await queryInterface.sequelize.query(`
      UPDATE companies SET tax_id_type_new = 'RUC';
    `);
    
    // Eliminar la columna antigua y renombrar la nueva
    await queryInterface.sequelize.query(`
      ALTER TABLE companies DROP COLUMN IF EXISTS tax_id_type;
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE companies RENAME COLUMN tax_id_type_new TO tax_id_type;
    `);
    
    // Actualizar valores por defecto para Panamá
    await queryInterface.sequelize.query(`
      ALTER TABLE companies ALTER COLUMN country SET DEFAULT 'Panamá';
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE companies ALTER COLUMN default_currency SET DEFAULT 'PAB';
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE companies ALTER COLUMN timezone SET DEFAULT 'America/Panama';
    `);
    
    // Actualizar registros existentes
    await queryInterface.sequelize.query(`
      UPDATE companies SET country = 'Panamá' WHERE country = 'Colombia';
    `);
    
    await queryInterface.sequelize.query(`
      UPDATE companies SET default_currency = 'PAB' WHERE default_currency = 'COP';
    `);
    
    await queryInterface.sequelize.query(`
      UPDATE companies SET timezone = 'America/Panama' WHERE timezone = 'America/Bogota';
    `);
    
    // Para tax_regime, vamos a mapear valores existentes
    await queryInterface.sequelize.query(`
      UPDATE companies SET tax_regime = 'ORDINARY' WHERE tax_regime = 'COMMON';
    `);
    
    // Para taxpayer_type, vamos a mapear valores existentes  
    await queryInterface.sequelize.query(`
      UPDATE companies SET taxpayer_type = 'JURIDICA' WHERE taxpayer_type IN ('VAT_RESPONSIBLE', 'LARGE_TAXPAYER', 'SELF_RETAINER', 'SIMPLIFIED_REGIME', 'NON_RESPONSIBLE');
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revertir cambios
    await queryInterface.sequelize.query(`
      ALTER TABLE companies ALTER COLUMN country SET DEFAULT 'Colombia';
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE companies ALTER COLUMN default_currency SET DEFAULT 'COP';
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE companies ALTER COLUMN timezone SET DEFAULT 'America/Bogota';
    `);
  }
};