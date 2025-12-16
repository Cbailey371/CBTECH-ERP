const { sequelize } = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const UserRole = require('./UserRole');
const Company = require('./company');
const UserCompany = require('./UserCompany');
const Customer = require('./Customer');
const Quotation = require('./Quotation');
const QuotationItem = require('./QuotationItem');
// const SalesOrder = require('./SalesOrder');
const Product = require('./Product');
const Project = require('./Project');
const Task = require('./Task');
const Contract = require('./Contract');
const Supplier = require('./Supplier');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderItem = require('./PurchaseOrderItem');

// Definir asociaciones
// Usuarios y Roles (Many-to-Many)
User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: 'userId',
  otherKey: 'roleId',
  as: 'roles'
});

Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: 'roleId',
  otherKey: 'userId',
  as: 'users'
});

// Roles y Permisos (Many-to-Many)
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions'
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles'
});

// Asociaciones directas para UserRole
UserRole.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserRole.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
UserRole.belongsTo(User, { foreignKey: 'assignedBy', as: 'assignedByUser' });

// Asociaciones directas para RolePermission
RolePermission.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
RolePermission.belongsTo(Permission, { foreignKey: 'permissionId', as: 'permission' });

// Usuarios y Empresas (Many-to-Many)
User.belongsToMany(Company, {
  through: UserCompany,
  foreignKey: 'userId',
  otherKey: 'companyId',
  as: 'companies'
});

Company.belongsToMany(User, {
  through: UserCompany,
  foreignKey: 'companyId',
  otherKey: 'userId',
  as: 'users'
});

// Asociaciones directas para UserCompany
UserCompany.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserCompany.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
UserCompany.belongsTo(User, { foreignKey: 'assignedBy', as: 'assignedByUser' });

// Empresas y Clientes
Company.hasMany(Customer, { foreignKey: 'companyId', as: 'customers' });
Customer.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Empresas y Proveedores
Company.hasMany(Supplier, { foreignKey: 'companyId', as: 'suppliers' });
Supplier.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Clientes y Cotizaciones
Customer.hasMany(Quotation, { foreignKey: 'customerId', as: 'quotations' });
Quotation.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Empresas y Cotizaciones
Company.hasMany(Quotation, { foreignKey: 'companyId', as: 'quotations' });
Quotation.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Cotizaciones e Items
Quotation.hasMany(QuotationItem, { foreignKey: 'quotationId', as: 'items' });
QuotationItem.belongsTo(Quotation, { foreignKey: 'quotationId', as: 'quotation' });

// Empresas y Productos
Company.hasMany(Product, { foreignKey: 'companyId', as: 'products' });
Product.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Empresas y Proyectos
Company.hasMany(Project, { foreignKey: 'companyId', as: 'projects' });
Project.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Empresas y Contratos
Company.hasMany(Contract, { foreignKey: 'companyId', as: 'contracts' });
Contract.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Proyectos y Contratos
Project.hasMany(Contract, { foreignKey: 'projectId', as: 'contracts' });
Contract.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// Proyectos y Tareas
Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks' });
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// Proyectos y Usuarios (Responsable)
User.hasMany(Project, { foreignKey: 'responsibleId', as: 'responsibleProjects' });
Project.belongsTo(User, { foreignKey: 'responsibleId', as: 'responsible' });

// Tareas y Usuarios (Asignado a)
User.hasMany(Task, { foreignKey: 'assignedTo', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });

// Tareas y Subtareas (Jerarquía)
Task.hasMany(Task, { foreignKey: 'parentId', as: 'subtasks' });
Task.belongsTo(Task, { foreignKey: 'parentId', as: 'parent' });

// Proyectos y Clientes
Customer.hasMany(Project, { foreignKey: 'customerId', as: 'projects' });
Project.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Clientes y Contratos
Customer.hasMany(Contract, { foreignKey: 'customerId', as: 'contracts' });
Contract.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Órdenes de Compra
Company.hasMany(PurchaseOrder, { foreignKey: 'companyId', as: 'purchaseOrders' });
PurchaseOrder.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplierId', as: 'purchaseOrders' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'purchaseOrderId', as: 'items' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId', as: 'purchaseOrder' });

Product.hasMany(PurchaseOrderItem, { foreignKey: 'productId', as: 'purchaseOrderItems' });
PurchaseOrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

const models = {
  User,
  Role,
  Permission,
  RolePermission,
  UserRole,
  Company,
  UserCompany,
  Customer,
  Supplier,
  Quotation,
  QuotationItem,
  Product,
  Project,
  Task,
  Contract,
  PurchaseOrder,
  PurchaseOrderItem,
  sequelize
};

module.exports = models;
