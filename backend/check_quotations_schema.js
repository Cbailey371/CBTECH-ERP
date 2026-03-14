const { sequelize } = require('./models');
async function checkSchema() {
  try {
    const tableInfo = await sequelize.getQueryInterface().describeTable('quotations');
    console.log('Columns in quotations table:', Object.keys(tableInfo));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkSchema();
