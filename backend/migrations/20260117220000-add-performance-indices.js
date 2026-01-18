'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Enable Extension for fast text search
        await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

        // 2. Sales Orders Indices
        await queryInterface.addIndex('sales_orders', ['company_id']);
        await queryInterface.addIndex('sales_orders', ['status']);
        await queryInterface.addIndex('sales_orders', ['customer_id']);
        // Trigram index for order number searching
        await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS sales_orders_order_number_trgm_idx ON sales_orders USING gin (order_number gin_trgm_ops);');

        // 3. Customers Indices
        await queryInterface.addIndex('customers', ['company_id']);
        // Trigram index for customer name searching
        await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS customers_name_trgm_idx ON customers USING gin (name gin_trgm_ops);');

        // 4. Products Indices
        await queryInterface.addIndex('products', ['company_id']);
        await queryInterface.addIndex('products', ['sku']);
        await queryInterface.addIndex('products', ['code']);
        // Trigram index for product name searching
        await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON products USING gin (name gin_trgm_ops);');

        // 5. Quotations Indices
        await queryInterface.addIndex('quotations', ['company_id']);
        await queryInterface.addIndex('quotations', ['status']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex('sales_orders', ['company_id']);
        await queryInterface.removeIndex('sales_orders', ['status']);
        await queryInterface.removeIndex('sales_orders', ['customer_id']);
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS sales_orders_order_number_trgm_idx;');

        await queryInterface.removeIndex('customers', ['company_id']);
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS customers_name_trgm_idx;');

        await queryInterface.removeIndex('products', ['company_id']);
        await queryInterface.removeIndex('products', ['sku']);
        await queryInterface.removeIndex('products', ['code']);
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS products_name_trgm_idx;');

        await queryInterface.removeIndex('quotations', ['company_id']);
        await queryInterface.removeIndex('quotations', ['status']);
    }
};
