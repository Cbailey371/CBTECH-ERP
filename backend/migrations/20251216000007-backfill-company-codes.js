'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // 1. Get all companies with NULL code
            const [companiesWithoutCode] = await queryInterface.sequelize.query(
                `SELECT id FROM companies WHERE code IS NULL OR code = '' ORDER BY id ASC`,
                { transaction }
            );

            if (companiesWithoutCode.length === 0) {
                console.log('No companies found without code. Skipping backfill.');
                await transaction.commit();
                return;
            }

            console.log(`Found ${companiesWithoutCode.length} companies without code.`);

            // 2. Find the highest existing EMP code to start sequence
            const [lastCodeResult] = await queryInterface.sequelize.query(
                `SELECT code FROM companies WHERE code LIKE 'EMP-%' ORDER BY code DESC LIMIT 1`,
                { transaction }
            );

            let nextSequence = 1;
            if (lastCodeResult.length > 0 && lastCodeResult[0].code) {
                const lastCode = lastCodeResult[0].code;
                const match = lastCode.match(/EMP-(\d+)/);
                if (match && match[1]) {
                    nextSequence = parseInt(match[1], 10) + 1;
                }
            }

            // 3. Update each company with a new code
            for (const company of companiesWithoutCode) {
                const newCode = `EMP-${String(nextSequence).padStart(3, '0')}`;
                await queryInterface.sequelize.query(
                    `UPDATE companies SET code = :code WHERE id = :id`,
                    {
                        replacements: { code: newCode, id: company.id },
                        transaction
                    }
                );
                console.log(`Assigned ${newCode} to company ID ${company.id}`);
                nextSequence++;
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            console.error('Error backfilling company codes:', error);
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        // No-op: We don't want to remove codes in rollback as it might delete valid data
    }
};
