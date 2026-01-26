const { sequelize, DeliveryNote, DeliveryNoteItem, Customer, Product, SalesOrder, Company, User } = require('../models');
const { Op } = require('sequelize');
const { generateDeliveryNotePdf } = require('../services/pdf/deliveryNotePdfGenerator');

// --- Helpers ---
const getDeliveryNote = async (id, companyId) => {
    return await DeliveryNote.findOne({
        where: { id, companyId },
        include: [
            { model: Customer, as: 'customer' },
            { model: SalesOrder, as: 'salesOrder' },
            { model: DeliveryNoteItem, as: 'items', include: [{ model: Product, as: 'product' }] },
            { model: User, as: 'creator', attributes: ['username', 'email'] }
        ]
    });
};

// --- CRUD ---

exports.getDeliveryNotes = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status } = req.query;
        const companyId = req.companyContext?.companyId || req.user.companyId;

        const whereClause = { companyId };

        if (status && status !== 'all') whereClause.status = status;
        if (search) {
            whereClause[Op.or] = [
                { number: { [Op.iLike]: `%${search}%` } },
                { '$customer.name$': { [Op.iLike]: `%${search}%` } }
            ];
        }

        const offset = (page - 1) * limit;
        const { count, rows } = await DeliveryNote.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'number', 'date', 'status', 'notes', 'customerId'],
            include: [{ model: Customer, as: 'customer', attributes: ['name', 'id'] }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['date', 'DESC'], ['id', 'DESC']]
        });

        res.json({
            success: true,
            deliveryNotes: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.getDeliveryNoteById = async (req, res) => {
    try {
        const companyId = req.companyContext?.companyId || req.user.companyId;
        const note = await getDeliveryNote(req.params.id, companyId);
        if (!note) return res.status(404).json({ error: 'Nota de entrega no encontrada' });
        res.json({ success: true, deliveryNote: note });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createDeliveryNote = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const companyId = req.companyContext?.companyId || req.user.companyId;
        const { customerId, salesOrderId, date, notes, items } = req.body;

        if (!items || items.length === 0) throw new Error("La nota de entrega debe tener al menos un ítem.");

        // Generate Number robustly
        const year = new Date().getFullYear();
        const prefix = `NE-${year}-`;

        // Find the maximum number for this company and year using string comparison
        const lastNote = await DeliveryNote.findOne({
            where: {
                companyId,
                number: { [Op.like]: `${prefix}%` }
            },
            order: [['number', 'DESC']],
            transaction: t
        });

        let nextNum = 1;
        if (lastNote && lastNote.number) {
            const parts = lastNote.number.split('-');
            const lastSeq = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastSeq)) nextNum = lastSeq + 1;
        }

        // Self-healing loop in case numbers are skipped or manually entered
        let number;
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
            number = `${prefix}${String(nextNum).padStart(4, '0')}`;
            const existing = await DeliveryNote.findOne({
                where: { companyId, number },
                transaction: t
            });
            if (!existing) {
                isUnique = true;
            } else {
                nextNum++;
                attempts++;
            }
        }

        console.log(`[DEBUG] Generando número final: ${number} para compañía ${companyId}`);

        // Create Header
        const note = await DeliveryNote.create({
            companyId,
            customerId,
            salesOrderId: salesOrderId || null,
            number,
            date: date || new Date(),
            status: 'draft',
            notes,
            createdBy: req.user.id
        }, { transaction: t });

        // Create Items
        await DeliveryNoteItem.bulkCreate(
            items.map(item => ({
                deliveryNoteId: note.id,
                productId: item.productId || null,
                description: item.description,
                quantity: parseFloat(item.quantity) || 0
            })),
            { transaction: t }
        );

        await t.commit();
        const createdNote = await getDeliveryNote(note.id, companyId);
        res.status(201).json({ success: true, deliveryNote: createdNote });

    } catch (error) {
        await t.rollback();
        console.error('[CRITICAL] Error creating delivery note:', error);
        if (error.errors) {
            error.errors.forEach(e => console.error(`[VALIDATION] Field: ${e.path}, Message: ${e.message}, Value: ${e.value}`));
        }
        res.status(500).json({
            error: error.message || 'Error al crear la nota de entrega',
            details: error.errors ? error.errors.map(e => ({ message: e.message, field: e.path })) : error.message
        });
    }
};

exports.updateDeliveryNote = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const companyId = req.companyContext?.companyId || req.user.companyId;
        const { date, notes, items } = req.body;

        const note = await DeliveryNote.findOne({ where: { id, companyId }, transaction: t });
        if (!note) return res.status(404).json({ error: 'Nota de entrega no encontrada' });

        await note.update({
            date: date || note.date,
            notes: notes !== undefined ? notes : note.notes
        }, { transaction: t });

        // Update items if provided
        if (items && Array.isArray(items)) {
            // Very simple approach: delete and recreate if it's draft or for simplicity
            // In a more complex ERP we might want to track changes, but here bulk overwrite is common for drafts
            await DeliveryNoteItem.destroy({ where: { deliveryNoteId: id }, transaction: t });
            await DeliveryNoteItem.bulkCreate(
                items.map(item => ({
                    deliveryNoteId: id,
                    productId: item.productId || null,
                    description: item.description,
                    quantity: parseFloat(item.quantity) || 0
                })),
                { transaction: t }
            );
        }

        await t.commit();
        const updatedNote = await getDeliveryNote(id, companyId);
        res.json({ success: true, deliveryNote: updatedNote });
    } catch (error) {
        await t.rollback();
        console.error('[CRITICAL] Error updating delivery note:', error);
        if (error.errors) {
            error.errors.forEach(e => console.error(`[VALIDATION] Field: ${e.path}, Message: ${e.message}, Value: ${e.value}`));
        }
        res.status(500).json({
            error: error.message || 'Error al actualizar la nota de entrega',
            details: error.errors ? error.errors.map(e => ({ message: e.message, field: e.path })) : error.message
        });
    }
};

exports.updateDeliveryNoteStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const note = await DeliveryNote.findOne({ where: { id, companyId: req.user.companyId } });
        if (!note) return res.status(404).json({ error: 'Nota de entrega no encontrada' });

        await note.update({ status });
        res.json({ success: true, deliveryNote: note });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteDeliveryNote = async (req, res) => {
    try {
        const { id } = req.params;
        const note = await DeliveryNote.findOne({ where: { id, companyId: req.user.companyId } });
        if (!note) return res.status(404).json({ error: 'Nota de entrega no encontrada' });

        await note.destroy();
        res.json({ success: true, message: 'Nota de entrega eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.downloadPdf = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.companyContext?.companyId || req.user.companyId;

        const note = await getDeliveryNote(id, companyId);
        if (!note) return res.status(404).json({ error: 'Nota de entrega no encontrada' });

        const company = await Company.findByPk(companyId);
        console.log(`[DEBUG] Generando PDF para Nota #${id} (Compañía ${companyId})`);
        console.log(`[DEBUG] Document Logo en DB: ${company?.documentLogo}`);

        // Items defensive check moved here to be extra safe
        if (!note.items) note.items = [];
        console.log(`[DEBUG] Cantidad de ítems en nota: ${note.items.length}`);

        const pdfBuffer = await generateDeliveryNotePdf(note, company);

        res.contentType('application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="NotaEntrega_${note.number}.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({
            error: 'Error al generar el PDF',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
