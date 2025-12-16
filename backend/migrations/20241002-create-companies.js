'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('companies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      // Información Básica
      name: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Nombre de la empresa'
      },
      legal_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Razón social'
      },
      trade_name: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: 'Nombre comercial'
      },
      
      // Identificación Fiscal
      tax_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'NIT/RUC/Tax ID'
      },
      tax_id_type: {
        type: Sequelize.ENUM('NIT', 'RUC', 'RFC', 'CUIT', 'RUT', 'OTHER'),
        allowNull: false,
        defaultValue: 'NIT',
        comment: 'Tipo de documento fiscal'
      },
      verification_digit: {
        type: Sequelize.STRING(2),
        allowNull: true,
        comment: 'Dígito de verificación'
      },
      
      // Información de Contacto
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        validate: {
          isEmail: true
        },
        comment: 'Email principal'
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Teléfono principal'
      },
      mobile: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Teléfono móvil'
      },
      website: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Sitio web'
      },
      
      // Dirección
      address_line1: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Dirección línea 1'
      },
      address_line2: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Dirección línea 2'
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Ciudad'
      },
      state_province: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Estado/Provincia/Departamento'
      },
      postal_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Código postal'
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'Colombia',
        comment: 'País'
      },
      
      // Información Fiscal y Tributaria
      tax_regime: {
        type: Sequelize.ENUM('COMMON', 'SIMPLIFIED', 'SPECIAL', 'EXEMPT'),
        allowNull: false,
        defaultValue: 'COMMON',
        comment: 'Régimen tributario'
      },
      taxpayer_type: {
        type: Sequelize.ENUM('VAT_RESPONSIBLE', 'LARGE_TAXPAYER', 'SELF_RETAINER', 'SIMPLIFIED_REGIME', 'NON_RESPONSIBLE'),
        allowNull: false,
        defaultValue: 'VAT_RESPONSIBLE',
        comment: 'Tipo de contribuyente'
      },
      economic_activity: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Actividad económica principal'
      },
      ciiu_code: {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: 'Código CIIU'
      },
      
      // Branding y Visual
      logo_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL del logo de la empresa'
      },
      primary_color: {
        type: Sequelize.STRING(7),
        allowNull: true,
        defaultValue: '#3B82F6',
        comment: 'Color primario corporativo (hex)'
      },
      secondary_color: {
        type: Sequelize.STRING(7),
        allowNull: true,
        defaultValue: '#64748B',
        comment: 'Color secundario corporativo (hex)'
      },
      
      // Configuración Operativa
      default_currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'COP',
        comment: 'Moneda por defecto (ISO 4217)'
      },
      timezone: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'America/Bogota',
        comment: 'Zona horaria'
      },
      fiscal_year_start: {
        type: Sequelize.STRING(5),
        allowNull: false,
        defaultValue: '01-01',
        comment: 'Inicio del año fiscal (MM-DD)'
      },
      
      // Control y Estado
      is_main_company: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Es la empresa principal'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Estado activo/inactivo'
      },
      
      // Metadatos
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Notas adicionales'
      },
      
      // Timestamps
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Agregar índices
    await queryInterface.addIndex('companies', ['tax_id'], {
      unique: true,
      name: 'companies_tax_id_unique'
    });
    
    await queryInterface.addIndex('companies', ['name'], {
      name: 'companies_name_index'
    });
    
    await queryInterface.addIndex('companies', ['is_main_company'], {
      name: 'companies_is_main_index'
    });
    
    await queryInterface.addIndex('companies', ['is_active'], {
      name: 'companies_is_active_index'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('companies');
  }
};