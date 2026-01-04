'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // 1. Add columns to pac_providers
            // Check if columns exist first to avoid errors if run multiple times or if sync was used partially
            const tableInfo = await queryInterface.describeTable('pac_providers');

            if (!tableInfo.test_url) {
                await queryInterface.addColumn('pac_providers', 'test_url', {
                    type: Sequelize.STRING,
                    allowNull: true
                }, { transaction });
            }

            if (!tableInfo.prod_url) {
                await queryInterface.addColumn('pac_providers', 'prod_url', {
                    type: Sequelize.STRING,
                    allowNull: true
                }, { transaction });
            }

            if (!tableInfo.auth_type) {
                // ENUM handling for Postgres can be tricky. Using STRING for safety in migration if generic, 
                // or explicitly handling ENUM type creation. 
                // Simplest portable way given prior issues: Use STRING or ensure ENUM type exists.
                // Let's try standard ENUM.
                await queryInterface.addColumn('pac_providers', 'auth_type', {
                    type: Sequelize.ENUM('API_KEY', 'USER_PASS', 'OAUTH'),
                    defaultValue: 'API_KEY'
                }, { transaction });
            }

            // 2. Create fe_issuer_configs table
            await queryInterface.createTable('fe_issuer_configs', {
                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: Sequelize.INTEGER
                },
                company_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'companies',
                        key: 'id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE'
                },
                ruc: { type: Sequelize.STRING(20) },
                dv: { type: Sequelize.STRING(2) },
                razon_social: { type: Sequelize.STRING },
                direccion: { type: Sequelize.STRING },
                sucursal: { type: Sequelize.STRING(10), defaultValue: '0000' },
                punto_de_venta: { type: Sequelize.STRING(10), defaultValue: '01' },
                pac_provider: { type: Sequelize.STRING(20), defaultValue: 'WEBPOS' },
                environment: { type: Sequelize.ENUM('TEST', 'PROD'), defaultValue: 'TEST' },
                auth_data: { type: Sequelize.JSONB }, // Stores API Key, User/Pass, etc.
                is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
                created_at: { allowNull: false, type: Sequelize.DATE },
                updated_at: { allowNull: false, type: Sequelize.DATE }
            }, { transaction });

            // 3. Create fe_documents table
            await queryInterface.createTable('fe_documents', {
                id: {
                    allowNull: false,
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                company_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'companies',
                        key: 'id'
                    }
                },
                sales_order_id: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: {
                        model: 'sales_orders',
                        key: 'id'
                    }
                },
                doc_type: {
                    type: Sequelize.ENUM('01', '03', '04'),
                    allowNull: false,
                    defaultValue: '01'
                },
                cufe: {
                    type: Sequelize.STRING(66),
                    allowNull: true,
                    unique: true
                },
                qr_url: { type: Sequelize.TEXT, allowNull: true },
                xml_signed: { type: Sequelize.TEXT, allowNull: true },
                auth_date: { type: Sequelize.DATE, allowNull: true },
                status: {
                    type: Sequelize.ENUM('DRAFT', 'SIGNING', 'AUTHORIZED', 'REJECTED', 'ANNULLED'),
                    defaultValue: 'DRAFT',
                    allowNull: false
                },
                rejection_reason: { type: Sequelize.TEXT, allowNull: true },
                pac_name: { type: Sequelize.STRING(50), allowNull: true },
                environment: {
                    type: Sequelize.ENUM('TEST', 'PROD'),
                    allowNull: false,
                    defaultValue: 'TEST'
                },
                created_at: { allowNull: false, type: Sequelize.DATE },
                updated_at: { allowNull: false, type: Sequelize.DATE }
            }, { transaction });

            // Add indexes
            await queryInterface.addIndex('fe_documents', ['cufe'], {
                unique: true,
                transaction,
                name: 'fe_documents_cufe_unique_idx'
            });

            await queryInterface.addIndex('fe_documents', ['sales_order_id'], {
                transaction,
                name: 'fe_documents_sales_order_idx'
            });

            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    },

    async down(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            await queryInterface.dropTable('fe_documents', { transaction });
            await queryInterface.dropTable('fe_issuer_configs', { transaction });

            // Removing columns is riskier if data exists, but for down migration:
            await queryInterface.removeColumn('pac_providers', 'test_url', { transaction });
            await queryInterface.removeColumn('pac_providers', 'prod_url', { transaction });
            await queryInterface.removeColumn('pac_providers', 'auth_type', { transaction });

            // Optionally drop ENUM types if Postgres
            await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pac_providers_auth_type";', { transaction });
            await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_fe_issuer_configs_environment";', { transaction });
            await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_fe_documents_doc_type";', { transaction });
            await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_fe_documents_status";', { transaction });
            await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_fe_documents_environment";', { transaction });

            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }
};
