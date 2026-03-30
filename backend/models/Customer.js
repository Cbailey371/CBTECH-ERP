const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'company_id',
    references: {
      model: 'companies',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [2, 200],
      notEmpty: true
    }
  },
  tradeName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'trade_name',
    validate: {
      len: [2, 200],
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    set(value) {
      if (value === '') {
        this.setDataValue('email', null);
      } else {
        this.setDataValue('email', value);
      }
    },
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  taxId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'tax_id'
  },
  dv: {
    type: DataTypes.STRING(4),
    allowNull: false,
    field: 'dv',
    validate: {
      notEmpty: true,
      len: [1, 4]
    }
  },
  tipoReceptor: {
    type: DataTypes.STRING(2),
    allowNull: true,
    field: 'tipo_receptor',
    defaultValue: '01',
    comment: '01: Contribuyente, 02: Consumidor Final, 03: Gobierno, 04: Extranjero'
  },
  tipoIdentificacion: {
    type: DataTypes.STRING(2),
    allowNull: true,
    field: 'tipo_identificacion',
    defaultValue: '02',
    comment: '01: Cedula, 02: RUC, 03: Pasaporte'
  },
  codUbi: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'cod_ubi',
    comment: 'Formato: Provincia-Distrito-Corregimiento (ej: 8-8-1)'
  },
  paisReceptor: {
    type: DataTypes.STRING(2),
    allowNull: true,
    field: 'pais_receptor',
    defaultValue: 'PA'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  },
  objetoRetencion: {
    type: DataTypes.STRING(2),
    allowNull: true,
    field: 'objeto_retencion',
    comment: 'ID del catálogo de Objetos de Retención DGI'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
  }, {
    tableName: 'customers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['company_id'],
        name: 'customers_company_id_idx'
      },
      {
        unique: true,
        fields: ['company_id', 'tax_id', 'dv'],
        name: 'customers_company_taxid_dv_unique'
      },
      {
        fields: ['company_id', 'email'],
        name: 'customers_company_email_idx'
      },
      {
        fields: ['company_id', 'is_active'],
        name: 'customers_company_active_idx'
      }
    ],
    hooks: {
      beforeValidate: (customer) => {
        if (customer.email === '') {
          customer.email = null;
        }
      },
      beforeCreate: (customer) => {
        if (customer.email === '') {
          customer.email = null;
        }
      },
      beforeUpdate: (customer) => {
        if (customer.email === '') {
          customer.email = null;
        }
      }
    }
  });

  module.exports = Customer;
