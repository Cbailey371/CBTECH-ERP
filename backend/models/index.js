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
const SalesOrder = require('./SalesOrder');
const SalesOrderItem = require('./SalesOrderItem');
const Product = require('./Product');
const Project = require('./Project');
const Task = require('./Task');
const Contract = require('./Contract');
const Supplier = require('./Supplier');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderItem = require('./PurchaseOrderItem');
const PacProvider = require('./PacProvider');
const FE_IssuerConfig = require('./FE_IssuerConfig');
const CreditNote = require('./CreditNote');
const Payment = require('./Payment');
const DeliveryNote = require('./DeliveryNote');
const DeliveryNoteItem = require('./DeliveryNoteItem');
const FE_Document = require('./FE_Document');
const AuditLog = require('./AuditLog');

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

// Items y Productos
QuotationItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(QuotationItem, { foreignKey: 'productId', as: 'quotationItems' });

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

// Órdenes de Venta (Sales Orders)
Company.hasMany(SalesOrder, { foreignKey: 'companyId', as: 'salesOrders' });
SalesOrder.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Customer.hasMany(SalesOrder, { foreignKey: 'customerId', as: 'salesOrders' });
SalesOrder.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

SalesOrder.hasMany(SalesOrderItem, { foreignKey: 'salesOrderId', as: 'items' });
SalesOrderItem.belongsTo(SalesOrder, { foreignKey: 'salesOrderId', as: 'salesOrder' });

Product.hasMany(SalesOrderItem, { foreignKey: 'productId', as: 'salesOrderItems' });
SalesOrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Quotation.hasOne(SalesOrder, { foreignKey: 'quotationId', as: 'salesOrder' });
SalesOrder.belongsTo(Quotation, { foreignKey: 'quotationId', as: 'quotation' });

SalesOrder.hasOne(FE_Document, { foreignKey: 'sales_order_id', as: 'feDocument' });
FE_Document.belongsTo(SalesOrder, { foreignKey: 'sales_order_id', as: 'salesOrder' });


// Sales Orders & Credit Notes
SalesOrder.hasMany(CreditNote, { foreignKey: 'salesOrderId', as: 'creditNotes' });
CreditNote.belongsTo(SalesOrder, { foreignKey: 'salesOrderId', as: 'salesOrder' });

CreditNote.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
CreditNote.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
CreditNote.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Payments
Payment.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Payment.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Payment.belongsTo(SalesOrder, { foreignKey: 'salesOrderId', as: 'salesOrder' });
Payment.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

SalesOrder.hasMany(Payment, { foreignKey: 'salesOrderId', as: 'payments' });
Customer.hasMany(Payment, { foreignKey: 'customerId', as: 'payments' });
Company.hasMany(Payment, { foreignKey: 'companyId', as: 'payments' });

// Delivery Notes
Company.hasMany(DeliveryNote, { foreignKey: 'companyId', as: 'deliveryNotes' });
DeliveryNote.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Customer.hasMany(DeliveryNote, { foreignKey: 'customerId', as: 'deliveryNotes' });
DeliveryNote.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

SalesOrder.hasMany(DeliveryNote, { foreignKey: 'salesOrderId', as: 'deliveryNotes' });
DeliveryNote.belongsTo(SalesOrder, { foreignKey: 'salesOrderId', as: 'salesOrder' });

DeliveryNote.hasMany(DeliveryNoteItem, { foreignKey: 'deliveryNoteId', as: 'items' });
DeliveryNoteItem.belongsTo(DeliveryNote, { foreignKey: 'deliveryNoteId', as: 'deliveryNote' });

Product.hasMany(DeliveryNoteItem, { foreignKey: 'productId', as: 'deliveryNoteItems' });
DeliveryNoteItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

DeliveryNote.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Auditoría
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
AuditLog.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
Company.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });

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
  SalesOrder,
  SalesOrderItem,
  PacProvider,
  FE_IssuerConfig,
  CreditNote,
  Payment,
  DeliveryNote,
  DeliveryNoteItem,
  FE_Document,
  AuditLog,
  sequelize
};

module.exports = models;
