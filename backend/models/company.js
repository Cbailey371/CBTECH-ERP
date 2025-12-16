const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // Información Básica
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
  legalName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'legal_name',
    validate: {
      len: [2, 200],
      notEmpty: true
    }
  },
  tradeName: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'trade_name',
    validate: {
      len: [2, 200]
    }
  },

  // Identificación Fiscal
  taxId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'tax_id',
    validate: {
      len: [5, 50],
      notEmpty: true
    }
  },
  dv: {
    type: DataTypes.STRING(4),
    allowNull: true,
    field: 'dv',
    validate: {
      len: [1, 4]
    }
  },
  taxIdType: {
    type: DataTypes.ENUM('RUC', 'DV', 'PE', 'N', 'E', 'OTHER'),
    allowNull: false,
    defaultValue: 'RUC',
    field: 'tax_id_type'
  },
  verificationDigit: {
    type: DataTypes.STRING(2),
    allowNull: true,
    field: 'verification_digit',
    validate: {
      len: [1, 2]
    }
  },

  // Información de Contacto
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [7, 20]
    }
  },
  mobile: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [7, 20]
    }
  },
  website: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  industry: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [2, 100]
    },
    comment: 'Sector o industria de la empresa'
  },

  // Dirección
  addressLine1: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'address_line1',
    validate: {
      len: [5, 255],
      notEmpty: true
    }
  },
  addressLine2: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'address_line2'
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [2, 100],
      notEmpty: true
    }
  },
  stateProvince: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'state_province'
  },
  postalCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'postal_code'
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Panamá',
    validate: {
      len: [2, 100],
      notEmpty: true
    }
  },

  // Configuración Operativa
  defaultCurrency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'PAB',
    field: 'default_currency',
    validate: {
      len: [3, 3],
      isUppercase: true
    }
  },
  timezone: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'America/Panama'
  },

  // Configuración Fiscal
  taxName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'ITBMS',
    field: 'tax_name',
    comment: 'Nombre del impuesto principal (ej: ITBMS, IVA, VAT)'
  },
  taxRate: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: false,
    defaultValue: 0.07,
    field: 'tax_rate',
    validate: {
      min: 0,
      max: 1
    },
    comment: 'Tasa de impuesto como decimal (0.07 = 7%)'
  },

  // Control y Estado
  isMainCompany: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_main_company'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  },

  // Metadatos
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'companies',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',

  // Hooks para validaciones custom
  hooks: {
    beforeCreate: async (company, options) => {
      // Validar que solo haya una empresa principal
      if (company.isMainCompany) {
        const existingMainCompany = await Company.findOne({
          where: { isMainCompany: true }
        });
        if (existingMainCompany) {
          throw new Error('Solo puede existir una empresa principal');
        }
      }
    },
    beforeUpdate: async (company, options) => {
      // Validar que solo haya una empresa principal
      if (company.changed('isMainCompany') && company.isMainCompany) {
        const existingMainCompany = await Company.findOne({
          where: {
            isMainCompany: true,
            id: { [require('sequelize').Op.ne]: company.id }
          }
        });
        if (existingMainCompany) {
          throw new Error('Solo puede existir una empresa principal');
        }
      }
    }
  },

  // Métodos de instancia
  instanceMethods: {
    getFullAddress() {
      let address = this.addressLine1;
      if (this.addressLine2) address += `, ${this.addressLine2}`;
      address += `, ${this.city}`;
      if (this.stateProvince) address += `, ${this.stateProvince}`;
      if (this.postalCode) address += ` ${this.postalCode}`;
      address += `, ${this.country}`;
      return address;
    },

    getDisplayName() {
      return this.tradeName || this.name;
    }
  },

  // Métodos de clase
  classMethods: {
    async getMainCompany() {
      return await this.findOne({
        where: { isMainCompany: true, isActive: true }
      });
    }
  }
});

// Métodos de instancia (forma moderna)
Company.prototype.getFullAddress = function () {
  let address = this.addressLine1;
  if (this.addressLine2) address += `, ${this.addressLine2}`;
  address += `, ${this.city}`;
  if (this.stateProvince) address += `, ${this.stateProvince}`;
  if (this.postalCode) address += ` ${this.postalCode}`;
  address += `, ${this.country}`;
  return address;
};

Company.prototype.getDisplayName = function () {
  return this.tradeName || this.name;
};

// Métodos de clase (forma moderna)
Company.getMainCompany = async function () {
  return await this.findOne({
    where: { isMainCompany: true, isActive: true }
  });
};

module.exports = Company;