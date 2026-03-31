const { Customer } = require('../models');

async function seed() {
  try {
    const customers = [
      {
        name: 'IT GREEN S A',
        tradeName: 'IT GREEN S A',
        taxId: '1954423-1-732405',
        dv: '04',
        email: 'ventas@itgreenpa.com',
        phone: '+507 6618-0149',
        address: 'San antonio, ciudad de Panama',
        tipoReceptor: '01',
        tipoIdentificacion: '02',
        codUbi: '8-8-12',
        paisReceptor: 'PA',
        companyId: 1
      },
      {
        name: 'CONSTRUPLAZA S.A.',
        tradeName: 'CONSTRUPLAZA S.A.',
        taxId: '3101289562',
        dv: '00',
        email: 'luis.segura@construplaza.com',
        phone: '+506 8915 2525',
        address: 'San José, Escazú, San Rafael',
        tipoReceptor: '04',
        tipoIdentificacion: '03',
        codUbi: '',
        paisReceptor: 'CR',
        companyId: 1
      },
      {
        name: 'Parlamento Lat',
        tradeName: 'Parlamento Latinoamericano y Carib',
        taxId: '8-nt-2-8151',
        dv: '84',
        email: 'ibrahim.hidalgo@parlatino.org',
        phone: '201-9000',
        address: 'Av. Amador, Panamá',
        tipoReceptor: '03',
        tipoIdentificacion: '02',
        codUbi: '8-8-14',
        paisReceptor: 'PA',
        objetoRetencion: '1',
        companyId: 1
      }
    ];

    for (const data of customers) {
      const [customer, created] = await Customer.findOrCreate({
        where: { taxId: data.taxId, companyId: data.companyId },
        defaults: data
      });
      if (created) {
        console.log(`Cliente creado: ${customer.name}`);
      } else {
        await customer.update(data);
        console.log(`Cliente actualizado: ${customer.name}`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('Error seeding customers:', err);
    process.exit(1);
  }
}

seed();
