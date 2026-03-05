require('dotenv').config();
const { PacProvider } = require('./models');
const { sequelize } = require('./config/database');

async function run() {
    try {
        await sequelize.authenticate();
        const [provider, created] = await PacProvider.findOrCreate({
            where: { code: 'DIGIFACT' },
            defaults: {
                name: 'Digifact',
                website: 'https://www.digifact.com.pa/',
                test_url: 'https://testnucpa.digifact.com/api',
                prod_url: 'https://nucpa.digifact.com/api',
                auth_type: 'USER_PASS',
                isActive: true
            }
        });

        if (created) {
            console.log('Digifact PAC Provider added successfully.');
        } else {
            console.log('Digifact PAC Provider already exists. Updating auth_type...');
            await provider.update({ auth_type: 'USER_PASS' });
            console.log('Updated successfully.');
        }
    } catch (err) {
        console.error('Error adding PAC provider:', err);
    } finally {
        process.exit();
    }
}
run();
