const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserCompany = sequelize.define('UserCompany', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
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
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'user', 'viewer'),
    allowNull: false,
    defaultValue: 'user',
    comment: 'Rol específico del usuario en esta empresa'
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Permisos específicos del usuario en esta empresa'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_default',
    comment: 'Empresa por defecto para el usuario'
  },
  assignedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'assigned_by',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  assignedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'assigned_at'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas sobre el acceso del usuario a la empresa'
  }
}, {
  tableName: 'user_companies',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'company_id'],
      name: 'user_company_unique'
    },
    {
      fields: ['user_id'],
      name: 'user_companies_user_id_idx'
    },
    {
      fields: ['company_id'],
      name: 'user_companies_company_id_idx'
    }
  ],
  hooks: {
    beforeCreate: async (userCompany, options) => {
      // Si se marca como empresa por defecto, desmarcar otras del mismo usuario
      if (userCompany.isDefault) {
        await UserCompany.update(
          { isDefault: false },
          { 
            where: { 
              userId: userCompany.userId,
              id: { [sequelize.Sequelize.Op.ne]: userCompany.id || 0 }
            },
            transaction: options.transaction
          }
        );
      }
    },
    beforeUpdate: async (userCompany, options) => {
      // Si se marca como empresa por defecto, desmarcar otras del mismo usuario
      if (userCompany.changed('isDefault') && userCompany.isDefault) {
        await UserCompany.update(
          { isDefault: false },
          { 
            where: { 
              userId: userCompany.userId,
              id: { [sequelize.Sequelize.Op.ne]: userCompany.id }
            },
            transaction: options.transaction
          }
        );
      }
    }
  }
});

// Métodos de instancia
UserCompany.prototype.hasPermission = function(permission) {
  if (!this.permissions || typeof this.permissions !== 'object') {
    return false;
  }
  return this.permissions[permission] === true;
};

UserCompany.prototype.addPermission = function(permission) {
  if (!this.permissions) {
    this.permissions = {};
  }
  this.permissions[permission] = true;
  this.changed('permissions', true);
};

UserCompany.prototype.removePermission = function(permission) {
  if (this.permissions && this.permissions[permission]) {
    delete this.permissions[permission];
    this.changed('permissions', true);
  }
};

// Métodos estáticos
UserCompany.getUserCompanies = async function(userId, options = {}) {
  return await this.findAll({
    where: { 
      userId,
      isActive: true,
      ...options.where
    },
    include: options.include || [],
    order: [['isDefault', 'DESC'], ['created_at', 'ASC']]
  });
};

UserCompany.getCompanyUsers = async function(companyId, options = {}) {
  return await this.findAll({
    where: { 
      companyId,
      isActive: true,
      ...options.where
    },
    include: options.include || [],
    order: [['role', 'ASC'], ['created_at', 'ASC']]
  });
};

UserCompany.setDefaultCompany = async function(userId, companyId) {
  const transaction = await sequelize.transaction();
  
  try {
    // Desmarcar empresa por defecto actual
    await this.update(
      { isDefault: false },
      { 
        where: { userId },
        transaction
      }
    );
    
    // Marcar nueva empresa por defecto
    await this.update(
      { isDefault: true },
      { 
        where: { userId, companyId },
        transaction
      }
    );
    
    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = UserCompany;