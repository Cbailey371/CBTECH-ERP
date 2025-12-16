const express = require('express');
const router = express.Router();
const { Project, Task, User, Customer, Company } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { companyContext, requireCompanyContext, requireCompanyPermission,
    getCompanyFilter
} = require('../middleware/companyContext');
const { generateCode } = require('../utils/codeGenerator');
const { Op } = require('sequelize');

// Middleware para todas las rutas
router.use(authenticateToken);
router.use(companyContext);
router.use(requireCompanyContext);

// GET /api/projects - Listar proyectos de la empresa
router.get('/', async (req, res) => {
    try {
        const { status, responsibleId, search, limit = 50, offset = 0 } = req.query;
        const companyId = req.companyContext.companyId;

        const where = { companyId, isActive: true };

        if (status) {
            where.status = status;
        }

        if (responsibleId) {
            where.responsibleId = responsibleId;
        }

        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `% ${search}% ` } },
                { description: { [Op.iLike]: `% ${search}% ` } }
            ];
        }

        const { count, rows } = await Project.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [
                {
                    model: User,
                    as: 'responsible',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                },
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Task,
                    as: 'tasks',
                    attributes: ['id', 'status']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Calcular progreso para cada proyecto
        const projectsWithProgress = rows.map(project => {
            const projectData = project.toJSON();
            const tasks = projectData.tasks || [];
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(t => t.status === 'completed').length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return {
                ...projectData,
                taskCount: totalTasks,
                completedTaskCount: completedTasks,
                progress
            };
        });

        res.json({
            success: true,
            data: {
                total: count,
                projects: projectsWithProgress
            }
        });
    } catch (error) {
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '../debug_projects.log');
        fs.appendFileSync(logPath, `\n[ERROR] ${error.message} \n${error.stack} \n`);

        console.error('Error al obtener proyecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proyecto',
            error: error.message
        });
    }
});

// GET /api/projects/:id - Obtener un proyecto con sus tareas
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.companyContext.companyId;
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '../debug_projects.log');

        const logMsg = `\n[${new Date().toISOString()}]GET / projects / ${id} - Company: ${companyId} `;
        fs.appendFileSync(logPath, logMsg);

        const simpleCheck = await Project.findByPk(id);
        fs.appendFileSync(logPath, `\nExists in DB ? ${!!simpleCheck} - CompanyID: ${simpleCheck?.companyId} `);

        const project = await Project.findOne({
            where: { id, companyId },
            include: [
                {
                    model: User,
                    as: 'responsible',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                },
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Task,
                    as: 'tasks',
                    include: [
                        {
                            model: User,
                            as: 'assignee',
                            attributes: ['id', 'firstName', 'lastName', 'email']
                        }
                    ]
                }
            ]
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }

        // Calcular progreso
        const tasks = project.tasks || [];
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const projectData = {
            ...project.toJSON(),
            taskCount: totalTasks,
            completedTaskCount: completedTasks,
            progress
        };

        res.json({
            success: true,
            data: { project: projectData }
        });
    } catch (error) {
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '../debug_projects.log');
        fs.appendFileSync(logPath, `\n[ERROR] ${error.message} \n${error.stack} \n`);

        console.error('Error al obtener proyecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el proyecto'
        });
    }
});

// POST /api/projects - Crear proyecto
router.post('/', async (req, res) => {
    try {
        const companyId = req.companyContext.companyId;
        const { name, description, status, responsibleId, responsibleExternal, customerId, startDate, endDate } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'El nombre es obligatorio'
            });
        }

        let projectCode = req.body.code;
        if (!projectCode) {
            projectCode = await generateCode(Project, 'PROJ', { companyId: req.companyContext.companyId }, 3);
        }

        const project = await Project.create({
            code: projectCode,
            companyId: req.companyContext.companyId,
            customerId,
            name,
            description,
            startDate,
            endDate,
            status: status || 'planning',
            responsibleId: responsibleId || null,
            responsibleExternal,
            budget: 0 // Adding default budget or from body if needed
        });

        const projectWithRelations = await Project.findByPk(project.id, {
            include: [
                {
                    model: User,
                    as: 'responsible',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Proyecto creado exitosamente',
            data: { project: projectWithRelations }
        });
    } catch (error) {
        console.error('Error al crear proyecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el proyecto',
            error: error.message
        });
    }
});

// PUT /api/projects/:id - Actualizar proyecto
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.companyContext.companyId;
        const { name, description, status, responsibleId, startDate, endDate, isActive } = req.body;

        const project = await Project.findOne({ where: { id, companyId } });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }

        await project.update({
            name,
            description,
            status,
            responsibleId,
            startDate,
            endDate,
            isActive
        });

        const projectWithRelations = await Project.findByPk(project.id, {
            include: [
                {
                    model: User,
                    as: 'responsible',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ]
        });

        res.json({
            success: true,
            message: 'Proyecto actualizado exitosamente',
            data: { project: projectWithRelations }
        });
    } catch (error) {
        console.error('Error al actualizar proyecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el proyecto'
        });
    }
});

// DELETE /api/projects/:id - Eliminar (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.companyContext.companyId;

        console.log(`Intento de eliminar proyecto ID: ${id} para empresa: ${companyId} `);

        const project = await Project.findOne({ where: { id, companyId } });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }

        await project.update({ isActive: false });

        res.json({
            success: true,
            message: 'Proyecto eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar proyecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el proyecto'
        });
    }
});

module.exports = router;
