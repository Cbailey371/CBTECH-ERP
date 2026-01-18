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
        const companyId = req.user.companyId;
        const { customerId, salesOrderId, date, notes, items } = req.body;

        if (!items || items.length === 0) throw new Error("La nota de entrega debe tener al menos un ítem.");

        // Generate Number
        const count = await DeliveryNote.count({ where: { companyId }, transaction: t });
        const number = `NE-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

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
        console.error('Error creating delivery note:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateDeliveryNote = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const { date, notes } = req.body;

        const note = await DeliveryNote.findOne({ where: { id, companyId } });
        if (!note) return res.status(404).json({ error: 'Nota de entrega no encontrada' });

        await note.update({
            date: date || note.date,
            notes: notes !== undefined ? notes : note.notes
        });

        const updatedNote = await getDeliveryNote(id, companyId);
        res.json({ success: true, deliveryNote: updatedNote });
    } catch (error) {
        console.error('Error updating delivery note:', error);
        res.status(500).json({ error: error.message });
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
