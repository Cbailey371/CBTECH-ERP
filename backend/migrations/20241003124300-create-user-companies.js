'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Crear ENUM para role de forma idempotente
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_user_companies_role') THEN
          CREATE TYPE "enum_user_companies_role" AS ENUM ('admin', 'manager', 'user', 'viewer');
        END IF;
      END$$;
    `);

    // Crear tabla user_companies, si no existe
    await queryInterface.createTable('user_companies', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      role: {
        type: 'enum_user_companies_role',
        allowNull: false,
        defaultValue: 'user'
      },
      permissions: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      assigned_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      assigned_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Crear índices de forma segura usando IF NOT EXISTS
    await queryInterface.sequelize.query(`CREATE UNIQUE INDEX IF NOT EXISTS "user_company_unique" ON "user_companies" ("user_id", "company_id");`);
    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS "user_companies_user_id_idx" ON "user_companies" ("user_id");`);
    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS "user_companies_company_id_idx" ON "user_companies" ("company_id");`);
    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS "user_companies_is_active_idx" ON "user_companies" ("is_active");`);
    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS "user_companies_is_default_idx" ON "user_companies" ("is_default");`);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_companies');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_user_companies_role";');
  }
};