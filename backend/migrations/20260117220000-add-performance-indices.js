'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Enable Extension for fast text search
        await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

        // Helper function to create index safely
        const createIndexSafe = async (table, cols, name) => {
            try {
                await queryInterface.addIndex(table, cols, { name });
            } catch (e) {
                console.log(`[INFO] Index ${name} on ${table} might already exist, skipping...`);
            }
        };

        // 2. Sales Orders Indices
        await createIndexSafe('sales_orders', ['company_id'], 'sales_orders_company_id');
        await createIndexSafe('sales_orders', ['status'], 'sales_orders_status');
        await createIndexSafe('sales_orders', ['customer_id'], 'sales_orders_customer_id');

        // Trigram index for order number searching
        await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS sales_orders_order_number_trgm_idx ON sales_orders USING gin (order_number gin_trgm_ops);');

        // 3. Customers Indices
        await createIndexSafe('customers', ['company_id'], 'customers_company_id');

        // Trigram index for customer name searching
        await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS customers_name_trgm_idx ON customers USING gin (name gin_trgm_ops);');

        // 4. Products Indices
        await createIndexSafe('products', ['company_id'], 'products_company_id');
        await createIndexSafe('products', ['sku'], 'products_sku');
        await createIndexSafe('products', ['code'], 'products_code');

        // Trigram index for product name searching
        await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON products USING gin (name gin_trgm_ops);');

        // 5. Quotations Indices
        await createIndexSafe('quotations', ['company_id'], 'quotations_company_id');
        await createIndexSafe('quotations', ['status'], 'quotations_status');
    },

    down: async (queryInterface, Sequelize) => {
        // Down migration remains simple as dropping non-existent stuff doesn't usually crash with IF EXISTS
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS sales_orders_company_id;');
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS sales_orders_status;');
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS sales_orders_customer_id;');
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS sales_orders_order_number_trgm_idx;');

        await queryInterface.sequelize.query('DROP INDEX IF EXISTS customers_company_id;');
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS customers_name_trgm_idx;');

        await queryInterface.sequelize.query('DROP INDEX IF EXISTS products_company_id;');
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS products_sku;');
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS products_code;');
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS products_name_trgm_idx;');

        await queryInterface.sequelize.query('DROP INDEX IF EXISTS quotations_company_id;');
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS quotations_status;');
    }
};
