const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../config/database');
const FE_IssuerConfig = require('../models/FE_IssuerConfig');
const FE_Document = require('../models/FE_Document');

// Import other models if relationships need to be established during sync
const Company = require('../models/company');
const SalesOrder = require('../models/SalesOrder');

async function syncFepaModels() {
    try {
        console.log('🔄 Connecting to Database...');
        await sequelize.authenticate();
        console.log('✅ Connection established.');

        console.log('🚧 Syncing FE_IssuerConfig...');
        await FE_IssuerConfig.sync({ alter: true });
        console.log('✅ FE_IssuerConfig synced.');

        console.log('🚧 Syncing FE_Document...');
        await FE_Document.sync({ alter: true });
        console.log('✅ FE_Document synced.');

        console.log('🎉 FEPA Tables created/updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error syncing models:', error);
        process.exit(1);
    }
}

syncFepaModels();
