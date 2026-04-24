const { QuotationItem, Product } = require('./models');

async function fixCosts() {
  console.log('Iniciando actualización de costos históricos...');
  const items = await QuotationItem.findAll({
    where: { unitCost: 0 },
    include: [{ model: Product, as: 'product' }]
  });

  console.log(`Encontrados ${items.length} ítems sin costo.`);

  for (const item of items) {
    if (item.product) {
      await item.update({ unitCost: item.product.cost });
    }
  }

  console.log('¡Actualización completada!');
  process.exit(0);
}

fixCosts();
