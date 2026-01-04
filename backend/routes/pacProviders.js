const express = require('express');
const router = express.Router();
const { PacProvider } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Middleware to ensure admin access
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Acceso denegado. Se requiere administrador.' });
    }
    next();
};

// GET /api/pac-providers - List all
router.get('/', authenticateToken, async (req, res) => {
    try {
        const providers = await PacProvider.findAll({
            order: [['name', 'ASC']]
        });
        res.json({ success: true, data: providers });
    } catch (error) {
        console.error('Error fetching PAC providers:', error);
        res.status(500).json({ message: 'Error interno' });
    }
});

// POST /api/pac-providers - Create
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, code, website, test_url, prod_url, auth_type } = req.body;
        if (!name || !code) {
            return res.status(400).json({ message: 'Nombre y código requeridos' });
        }

        const exists = await PacProvider.findOne({ where: { code } });
        if (exists) {
            return res.status(400).json({ message: 'El código ya existe' });
        }

        const provider = await PacProvider.create({
            name, code, website, test_url, prod_url, auth_type
        });
        res.status(201).json({ success: true, data: provider });
    } catch (error) {
        console.error('Error creating PAC provider:', error);
        res.status(500).json({ message: 'Error interno' });
    }
});

// PUT /api/pac-providers/:id - Update
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, code, website, test_url, prod_url, auth_type, isActive } = req.body;
        const provider = await PacProvider.findByPk(req.params.id);

        if (!provider) {
            return res.status(404).json({ message: 'Proveedor no encontrado' });
        }

        if (code && code !== provider.code) {
            const exists = await PacProvider.findOne({ where: { code } });
            if (exists) return res.status(400).json({ message: 'El código ya existe' });
        }

        await provider.update({
            name, code, website, test_url, prod_url, auth_type, isActive
        });
        res.json({ success: true, data: provider });
    } catch (error) {
        console.error('Error updating PAC provider:', error);
        res.status(500).json({ message: 'Error interno' });
    }
});

// DELETE /api/pac-providers/:id
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const provider = await PacProvider.findByPk(req.params.id);
        if (!provider) return res.status(404).json({ message: 'Proveedor no encontrado' });

        await provider.destroy();
        res.json({ success: true, message: 'Eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting PAC provider:', error);
        res.status(500).json({ message: 'Error interno' });
    }
});

module.exports = router;
