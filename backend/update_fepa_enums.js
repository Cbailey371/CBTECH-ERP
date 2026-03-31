const { sequelize } = require('./config/database');

async function updateEnums() {
    try {
        console.log('🚀 Iniciando actualización de tipos ENUM en PostgreSQL...');
        
        // Postgres no permite ADD VALUE dentro de una transacción en algunas versiones
        // así que ejecutamos las consultas de forma independiente.
        
        const queries = [
            'ALTER TYPE "enum_fe_documents_doc_type" ADD VALUE IF NOT EXISTS \'02\'',
            'ALTER TYPE "enum_fe_documents_doc_type" ADD VALUE IF NOT EXISTS \'05\'',
            'ALTER TYPE "enum_fe_documents_status" ADD VALUE IF NOT EXISTS \'CERTIFIED\''
        ];

        for (const query of queries) {
            try {
                await sequelize.query(query);
                console.log(`✅ Ejecutado: ${query}`);
            } catch (err) {
                if (err.message.includes('already exists')) {
                    console.log(`ℹ️ Saltado (ya existe): ${query}`);
                } else {
                    throw err;
                }
            }
        }

        console.log('✨ Actualización completada con éxito.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error actualizando ENUMs:', error);
        process.exit(1);
    }
}

updateEnums();
