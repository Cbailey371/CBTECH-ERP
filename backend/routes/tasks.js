const express = require('express');
const router = express.Router();
const { Task, User, Project } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { companyContext, requireCompanyContext, requireCompanyPermission,
    getCompanyFilter
} = require('../middleware/companyContext');
const { generateCode } = require('../utils/codeGenerator');

// Middleware para todas las rutas
router.use(authenticateToken);
router.use(companyContext);
router.use(requireCompanyContext);

// GET /api/tasks - Listar tareas (con filtros opcionales)
router.get('/', async (req, res) => {
    try {
        const { projectId, status, assignedTo, limit = 100, offset = 0 } = req.query;
        const companyId = req.companyContext.companyId;

        const where = {};

        if (projectId) {
            where.projectId = projectId;
        }

        if (status) {
            where.status = status;
        }

        if (assignedTo) {
            where.assignedTo = assignedTo;
        }

        // Verificar que las tareas pertenezcan a proyectos de la empresa
        const { count, rows } = await Task.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [
                {
                    model: User,
                    as: 'assignee',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                },
                {
                    model: Project,
                    as: 'project',
                    where: { companyId },
                    attributes: ['id', 'name']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '../debug_tasks.log');
        fs.appendFileSync(logPath, `\n[${new Date().toISOString()}]GET / tasks - Found: ${count} tasks for query: ${JSON.stringify(where)} `);

        res.json({
            success: true,
            data: {
                total: count,
                tasks: rows
            }
        });
    } catch (error) {
        console.error('Error al listar tareas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tareas',
            error: error.message
        });
    }
});

// POST /api/tasks - Crear tarea
router.post('/', async (req, res) => {
    try {
        const companyId = req.companyContext.companyId;
        const { projectId, title, description, status, priority, assignedTo, externalResponsibleName, dueDate, parentId } = req.body;

        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '../debug_tasks.log');
        fs.appendFileSync(logPath, `\n[${new Date().toISOString()}]POST / tasks - Project: ${projectId} - Title: ${title} `);

        if (!projectId || !title) {
            return res.status(400).json({
                success: false,
                message: 'El proyecto y el título son obligatorios'
            });
        }

        // Verificar que el proyecto pertenezca a la empresa
        const project = await Project.findOne({
            where: { id: projectId, companyId }
        });

        if (!project) {
            fs.appendFileSync(logPath, `\nProject not found or mismatch company`);
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }

        let taskCode = code;
        if (!taskCode) {
            // Task codes can be scoped to Project or Company.
            // Using Company scope to keep it simple and consistent as per request "TASK-{001}"
            taskCode = await generateCode(Task, 'TASK', { project_id: projectId }, 3);
        }

        // Create the task
        const task = await Task.create({
            code: taskCode,
            projectId,
            title,
            description,
            status: status || 'pending', // Changed from 'todo' back to 'pending' to match original default
            priority: priority || 'medium',
            assignedTo: assignedTo || null,
            externalResponsibleName: externalResponsibleName || null,
            dueDate: dueDate || null,
            parentId: parentId || null
        });

        fs.appendFileSync(logPath, `\nTask created: ${task.id} `);

        const taskWithRelations = await Task.findByPk(task.id, {
            include: [
                {
                    model: User,
                    as: 'assignee',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                },
                {
                    model: Project,
                    as: 'project',
                    attributes: ['id', 'name']
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Tarea creada exitosamente',
            data: { task: taskWithRelations }
        });
    } catch (error) {
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '../debug_tasks.log');
        fs.appendFileSync(logPath, `\n[ERROR] ${error.message} \n${error.stack} \n`);

        console.error('Error al crear tarea:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear la tarea',
            error: error.message
        });
    }
});

// PUT /api/tasks/:id - Actualizar tarea
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.companyContext.companyId;
        const { title, description, status, priority, assignedTo, externalResponsibleName, dueDate } = req.body;

        const task = await Task.findOne({
            include: [
                {
                    model: Project,
                    as: 'project',
                    where: { companyId }
                }
            ],
            where: { id }
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            });
        }

        // Auto-marcar completedAt si cambia a completed
        const updateData = {
            title,
            description,
            status,
            priority,
            assignedTo,
            externalResponsibleName,
            dueDate
        };

        if (status === 'completed' && task.status !== 'completed') {
            updateData.completedAt = new Date();
        } else if (status !== 'completed') {
            updateData.completedAt = null;
        }

        await task.update(updateData);

        const taskWithRelations = await Task.findByPk(task.id, {
            include: [
                {
                    model: User,
                    as: 'assignee',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                },
                {
                    model: Project,
                    as: 'project',
                    attributes: ['id', 'name']
                }
            ]
        });

        res.json({
            success: true,
            message: 'Tarea actualizada exitosamente',
            data: { task: taskWithRelations }
        });
    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la tarea'
        });
    }
});

// DELETE /api/tasks/:id - Eliminar tarea
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.companyContext.companyId;

        const task = await Task.findOne({
            include: [
                {
                    model: Project,
                    as: 'project',
                    where: { companyId }
                }
            ],
            where: { id }
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            });
        }

        await task.destroy();

        res.json({
            success: true,
            message: 'Tarea eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la tarea'
        });
    }
});

module.exports = router;
