require('dotenv').config();
const { sequelize } = require('../config/database');
const SalesOrder = require('../models/SalesOrder');
const SalesOrderItem = require('../models/SalesOrderItem');
const Product = require('../models/Product'); // Ensure dependency exists for consistency

const syncModels = async () => {
    try {
        console.log('🔄 Syncing SalesOrder models...');

        // Define relationships explicitly for sync (if not fully defined in models/index.js yet)
        // This ensures FK constraints are created correctly during sync
        SalesOrder.hasMany(SalesOrderItem, { foreignKey: 'salesOrderId' });
        SalesOrderItem.belongsTo(SalesOrder, { foreignKey: 'salesOrderId' });

        await SalesOrder.sync({ alter: true });
        await SalesOrderItem.sync({ alter: true });

        console.log('✅ SalesOrder and SalesOrderItem synced successfully!');
    } catch (error) {
        console.error('❌ Error syncing models:', error);
    } finally {
        await sequelize.close();
    }
};

syncModels();
