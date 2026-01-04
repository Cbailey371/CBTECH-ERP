const { sequelize } = require('../models');

async function fixNullSequences() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Find max sequence
        const [results] = await sequelize.query(`SELECT MAX(sequence) as max_seq FROM quotations WHERE company_id = 1`);
        let nextSeq = (results[0].max_seq || 0) + 1;

        // Find rows with null sequence
        const [nullRows] = await sequelize.query(`SELECT id FROM quotations WHERE sequence IS NULL`);
        console.log(`Found ${nullRows.length} rows with null sequence.`);

        for (const row of nullRows) {
            await sequelize.query(`UPDATE quotations SET sequence = ${nextSeq} WHERE id = ${row.id}`);
            console.log(`Updated quotation ${row.id} to sequence ${nextSeq}`);
            nextSeq++;
        }

        process.exit(0);
    } catch (error) {
        console.error('Error fixing null sequences:', error);
        process.exit(1);
    }
}

fixNullSequences();
