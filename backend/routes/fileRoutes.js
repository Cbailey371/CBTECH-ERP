const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const { companyContext, requireCompanyContext } = require('../middleware/companyContext');

// Directorio base de archivos (fuera del alcance estático público)
const UPLOADS_DIR = path.join(__dirname, '../uploads');

/**
 * GET /api/files/:filename
 * Sirve archivos validados por contexto de empresa
 */
router.get('/:filename', authenticateToken, companyContext, requireCompanyContext, (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(UPLOADS_DIR, filename);

        // Seguridad: Evitar Directory Traversal
        if (!filePath.startsWith(UPLOADS_DIR)) {
            return res.status(403).json({ success: false, message: 'Acceso denegated' });
        }

        // Verificar existencia
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Archivo no encontrado' });
        }

        // TODO: En una implementación más granular, verificar si el archivo específico 
        // pertenece a la empresa (ej. buscando en la tabla de contratos por fileUrl).
        // Por ahora, el requireCompanyContext garantiza que el usuario pertenece a UNA empresa activa.

        res.sendFile(filePath);
    } catch (error) {
        console.error('Error sirviendo archivo:', error);
        res.status(500).json({ success: false, message: 'Error al procesar el archivo' });
    }
});

module.exports = router;
