const { Sequelize, DataTypes, QueryTypes } = require('sequelize');
const path = require('path');

// Cargar variables de entorno
const envPath = path.join(__dirname, '../.env');
require('dotenv').config({ path: envPath });

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: false,
    }
);

async function syncSequences() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión establecida.');

        // Obtener todas las cotizaciones
        const quotations = await sequelize.query(
            'SELECT id, number, sequence, company_id FROM quotations',
            { type: QueryTypes.SELECT }
        );

        console.log(`🔍 Analizando ${quotations.length} cotizaciones...`);

        let updatedCount = 0;

        for (const q of quotations) {
            // Intentar extraer el número secuencial del formato "COT-YYYY-XXXX"
            // Ejemplo: COT-2025-0003 -> 3
            const match = q.number ? q.number.match(/COT-\d{4}-(\d+)/) : null;

            if (match) {
                const extractedSeq = parseInt(match[1], 10);

                // Si la secuencia actual es NULL o diferente al extraído, actualizar
                if (q.sequence !== extractedSeq) {
                    await sequelize.query(
                        'UPDATE quotations SET sequence = :seq WHERE id = :id',
                        {
                            replacements: { seq: extractedSeq, id: q.id },
                            type: QueryTypes.UPDATE
                        }
                    );

                    console.log(`🔄 Fix: ID ${q.id} (${q.number}) -> Sequence ${extractedSeq} (Estaba: ${q.sequence})`);
                    updatedCount++;
                }
            } else {
                console.warn(`⚠️  Formato no reconocido para ID ${q.id}: ${q.number}. Saltando.`);
            }
        }

        console.log('-----------------------------------');
        console.log(`✅ Proceso finalizado. Total actualizados: ${updatedCount}`);

        // Verificar el MAX sequence actual
        const maxSeq = await sequelize.query(
            'SELECT company_id, MAX(sequence) as max_seq FROM quotations GROUP BY company_id',
            { type: QueryTypes.SELECT }
        );
        console.log('📊 Secuencias actuales por empresa:', maxSeq);

    } catch (error) {
        console.error('❌ Error fatal:', error);
    } finally {
        await sequelize.close();
    }
}

syncSequences();
