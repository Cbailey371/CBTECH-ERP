const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Customer } = require('../models');
const { generateCode } = require('../utils/codeGenerator');
const { sequelize } = require('../config/database');

async function backfillCustomerCodes() {
    console.log('🚀 Iniciando backfill de códigos de clientes...');

    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida.');

        // Buscar clientes con código NULL
        const customersToUpdate = await Customer.findAll({
            where: {
                code: null
            },
            order: [['created_at', 'ASC']]
        });

        console.log(`📋 Se encontraron ${customersToUpdate.length} clientes sin código.`);

        for (const customer of customersToUpdate) {
            const newCode = await generateCode(
                Customer,
                'CLI',
                { companyId: customer.companyId },
                3
            );

            await customer.update({ code: newCode });
            console.log(`✅ Cliente [ID: ${customer.id}] "${customer.name}" actualizado con código: ${newCode}`);
        }

        console.log('\n✨ Backfill completado exitosamente.');

    } catch (error) {
        console.error('\n❌ ERROR DURANTE EL BACKFILL:', error);
    } finally {
        await sequelize.close();
    }
}

backfillCustomerCodes();
