const { sequelize } = require('../models');

async function patchData() {
    try {
        await sequelize.authenticate();

        // Patch Quotation 42
        await sequelize.query(`
            UPDATE quotation_items 
            SET description = 'Servicio de Alojamiento' 
            WHERE quotation_id = 42 AND (description IS NULL OR description = '')
        `);

        // Patch Order 7
        await sequelize.query(`
            UPDATE sales_order_items 
            SET description = 'Servicio de Alojamiento' 
            WHERE sales_order_id = 7 AND (description IS NULL OR description = '')
        `);

        console.log('Patched data successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

patchData();
