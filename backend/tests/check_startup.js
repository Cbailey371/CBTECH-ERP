try {
    console.log('1. Cargando configuración de DB...');
    const { sequelize } = require('../config/database');
    console.log('✅ Configuración DB cargada.');

    console.log('2. Cargando modelos...');
    const models = require('../models');
    console.log('✅ Modelos cargados.');

    console.log('3. Verificando sincronización...');
    // No sincronizamos, solo verificamos que el objeto sequelize sea válido
    if (models.sequelize) {
        console.log('✅ Instancia Sequelize presente en models.');
    } else {
        console.error('❌ Instancia Sequelize NO encontrada en models.');
    }

    console.log('4. Cargando rutas de cotizaciones...');
    require('../routes/quotations');
    console.log('✅ Rutas cotizaciones cargadas.');

    console.log('✨ PRUEBA DE ARRANQUE EXITOSA (Modelos y Rutas básicas)');
    process.exit(0);

} catch (error) {
    console.error('\n❌ ERROR FATAL AL INICIAR:', error);
    process.exit(1);
}
