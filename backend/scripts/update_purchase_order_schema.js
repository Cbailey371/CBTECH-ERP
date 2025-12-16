const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../config/database');
const PurchaseOrder = require('../models/PurchaseOrder');
const PurchaseOrderItem = require('../models/PurchaseOrderItem');

async function updateSchema() {
    try {
        console.log('Iniciando actualización del esquema para Órdenes de Compra...');

        // Sincronizar modelos
        // alter: true intenta modificar las tablas existentes para que coincidan con el modelo
        // force: false evita borrar los datos existentes
        await PurchaseOrder.sync({ alter: true });
        console.log('Tabla purchase_orders actualizada exitosamente.');

        await PurchaseOrderItem.sync({ alter: true });
        console.log('Tabla purchase_order_items actualizada exitosamente.');

        console.log('Actualización de esquema completada.');
        process.exit(0);
    } catch (error) {
        console.error('Error al actualizar el esquema:', error);
        process.exit(1);
    }
}

updateSchema();
