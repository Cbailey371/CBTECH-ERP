const { sequelize, Payment, SalesOrder, Customer, Company } = require('../models');
const { Op } = require('sequelize');

exports.createPayment = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { companyId } = req.companyContext;
        const { salesOrderId, customerId, amount, date, method, reference, notes } = req.body;
        const userId = req.user.id;

        // Validate Input
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'El monto debe ser mayor a 0' });
        }

        // Find Sales Order (lock for update)
        // We do NOT include Customer here to avoid "FOR UPDATE cannot be applied to the nullable side of an outer join" error
        const salesOrder = await SalesOrder.findOne({
            where: { id: salesOrderId, companyId },
            lock: t.LOCK.UPDATE,
            transaction: t
        });

        if (!salesOrder) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Factura no encontrada' });
        }

        // Verify Customer ID directly from FK
        // Ensure accurate comparison (String vs Number)
        if (String(salesOrder.customerId) !== String(customerId)) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'La factura no pertenece al cliente indicado' });
        }

        // Check Balance Overflow (Optional: Allow overpayment? Standard: Block or Treat as Credit)
        // For now, block if amount > balance + epsilon
        const currentBalance = parseFloat(salesOrder.balance);
        if (parseFloat(amount) > currentBalance + 0.01) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: `El monto (${amount}) excede el saldo pendiente (${currentBalance.toFixed(2)})`
            });
        }

        // Generate Payment Number
        const count = await Payment.count({ where: { company_id: companyId }, transaction: t });
        const year = new Date().getFullYear();
        const paymentNumber = `AB-${year}-${String(count + 1).padStart(4, '0')}`;

        // 1. Create Payment Record
        const payment = await Payment.create({
            company_id: companyId,
            customer_id: customerId,
            sales_order_id: salesOrderId,
            paymentNumber,
            date: date || new Date(),
            amount,
            method,
            reference,
            notes,
            created_by: userId
        }, { transaction: t });

        // 2. Update SalesOrder Totals
        const newPaidAmount = parseFloat(salesOrder.paidAmount) + parseFloat(amount);
        const newBalance = parseFloat(salesOrder.total) - newPaidAmount;

        let newStatus = 'partial';
        if (newBalance <= 0.01) {
            newStatus = 'paid';
        }

        await salesOrder.update({
            paidAmount: newPaidAmount,
            balance: newBalance,
            paymentStatus: newStatus
        }, { transaction: t });

        await t.commit();

        res.json({
            success: true,
            message: 'Pago registrado exitosamente',
            data: {
                payment,
                newBalance: newBalance.toFixed(2),
                newStatus
            }
        });

    } catch (error) {
        await t.rollback();
        console.error('Error creating payment:', error);
        res.status(500).json({ success: false, message: 'Error interno al registrar pago' });
    }
};

exports.getStatement = async (req, res) => {
    try {
        const { companyId } = req.companyContext;
        const { customerId } = req.params;

        const customer = await Customer.findOne({
            where: { id: customerId, companyId }
        });

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
        }

        // Get Unpaid Invoices
        const unpaidInvoices = await SalesOrder.findAll({
            where: {
                companyId,
                customerId,
                balance: { [Op.gt]: 0 },
                status: { [Op.notIn]: ['cancelled', 'draft'] } // Only confirmed invoices
            },
            order: [['issueDate', 'ASC']]
        });

        // Calculate Aging
        const today = new Date();
        const aging = {
            totalDue: 0,
            range0_30: 0,
            range31_60: 0,
            range61_90: 0,
            range90plus: 0
        };

        const invoicesFormatted = unpaidInvoices.map(inv => {
            const dueDate = new Date(inv.issueDate); // Assuming due upon receipt for simplicity, or add dueDate field later
            // Simple logic: Age based on Issue Date
            const diffTime = Math.abs(today - dueDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const balance = parseFloat(inv.balance);
            aging.totalDue += balance;

            if (diffDays <= 30) aging.range0_30 += balance;
            else if (diffDays <= 60) aging.range31_60 += balance;
            else if (diffDays <= 90) aging.range61_90 += balance;
            else aging.range90plus += balance;

            return {
                id: inv.id,
                number: inv.orderNumber,
                date: inv.issueDate,
                total: parseFloat(inv.total),
                paid: parseFloat(inv.paidAmount),
                balance: balance,
                ageDays: diffDays
            };
        });

        res.json({
            success: true,
            data: {
                customer: {
                    id: customer.id,
                    name: customer.name,
                    ruc: customer.taxId // Correct field mapping
                },
                aging,
                invoices: invoicesFormatted
            }
        });

    } catch (error) {
        console.error('Error fetching statement:', error);
        res.status(500).json({ success: false, message: error.message || 'Error al obtener estado de cuenta' });
    }
};

exports.deletePayment = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { companyId } = req.companyContext;
        const { id } = req.params;

        // 1. Find Payment
        const payment = await Payment.findOne({
            where: { id, company_id: companyId },
            transaction: t
        });

        if (!payment) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Pago no encontrado' });
        }

        // 2. Find Sales Order (Locked)
        const salesOrder = await SalesOrder.findOne({
            where: { id: payment.sales_order_id, companyId },
            lock: t.LOCK.UPDATE,
            transaction: t
        });

        if (!salesOrder) {
            // Should not happen if constraint exists, but safety check
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Factura origen no encontrada' });
        }

        // 3. Reverse Amounts
        const reverseAmount = parseFloat(payment.amount);
        const newPaidAmount = parseFloat(salesOrder.paidAmount) - reverseAmount;
        const newBalance = parseFloat(salesOrder.balance) + reverseAmount;

        // 4. Determine New Status
        // If paidAmount goes to 0 (or close), unpaid.
        // If balance > 0, partial.
        let newStatus = 'partial';
        if (newPaidAmount <= 0.01) newStatus = 'unpaid'; // Or whatever initial status is
        // Actually, initial status checks 'fulfilled' vs 'draft', paymentStatus is separate. 
        // We set paymentStatus.

        await salesOrder.update({
            paidAmount: newPaidAmount,
            balance: newBalance,
            paymentStatus: newStatus
        }, { transaction: t });

        // 5. Delete Payment
        await payment.destroy({ transaction: t });

        await t.commit();

        res.json({ success: true, message: 'Pago eliminado y saldo revertido' });

    } catch (error) {
        await t.rollback();
        console.error('Error deleting payment:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar pago' });
    }
};
