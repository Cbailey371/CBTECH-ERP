import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Combobox } from '../ui/Combobox';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';

export default function TaskModal({ isOpen, onClose, onSave, task, projectId, loading, existingTasks = [] }) {
    const { } = useAuth(); // token removed
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        code: '',
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        assignedTo: '',
        externalResponsibleName: '',
        isExternal: false,
        dueDate: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadUsers();
        }
    }, [isOpen]);

    useEffect(() => {
        if (task) {
            setFormData({
                code: task.code || '',
                title: task.title || '',
                description: task.description || '',
                status: task.status || 'pending',
                priority: task.priority || 'medium',
                assignedTo: task.assignedTo || '',
                externalResponsibleName: task.externalResponsibleName || '',
                isExternal: !!task.externalResponsibleName,
                dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
                parentId: task.parentId || ''
            });
        } else {
            setFormData({
                code: '',
                title: '',
                description: '',
                status: 'pending',
                priority: 'medium',
                assignedTo: '',
                externalResponsibleName: '',
                isExternal: false,
                dueDate: '',
                parentId: ''
            });
        }
    }, [task, isOpen]);

    const loadUsers = async () => {
        try {
            const response = await userService.getUsers({ is_active: 'true' });
            if (response.success) {
                setUsers(response.data || []);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            projectId: parseInt(projectId)
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-card border-border text-foreground">
                <DialogHeader>
                    <DialogTitle>{task ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-[120px_1fr] gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Código</label>
                            <Input
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className="bg-background border-input"
                                placeholder="Ej. T-01"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Título *</label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="bg-background border-input"
                                placeholder="Ej. Revisar documentación"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Detalles de la tarea..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Estado</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="pending">Pendiente</option>
                                <option value="in_progress">En Progreso</option>
                                <option value="review">En Revisión</option>
                                <option value="completed">Completada</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Prioridad</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="low">Baja</option>
                                <option value="medium">Media</option>
                                <option value="high">Alta</option>
                                <option value="critical">Crítica</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Asignado a</label>
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    id="isExternal"
                                    checked={formData.isExternal}
                                    onChange={(e) => {
                                        const isExternal = e.target.checked;
                                        setFormData(prev => ({
                                            ...prev,
                                            isExternal,
                                            assignedTo: isExternal ? '' : prev.assignedTo,
                                            externalResponsibleName: isExternal ? prev.externalResponsibleName : ''
                                        }));
                                    }}
                                    className="rounded border-input bg-background text-primary focus:ring-primary"
                                />
                                <label htmlFor="isExternal" className="text-xs text-muted-foreground cursor-pointer select-none">
                                    Responsable Externo
                                </label>
                            </div>

                            {formData.isExternal ? (
                                <Input
                                    value={formData.externalResponsibleName || ''}
                                    onChange={(e) => setFormData({ ...formData, externalResponsibleName: e.target.value })}
                                    className="bg-background border-input"
                                    placeholder="Nombre del responsable externo..."
                                />
                            ) : (
                                <Combobox
                                    options={users.map(u => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }))}
                                    value={formData.assignedTo}
                                    onChange={(value) => setFormData({ ...formData, assignedTo: value })}
                                    placeholder="Seleccionar..."
                                    searchPlaceholder="Buscar usuario..."
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Fecha Vencimiento</label>
                            <Input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                className="bg-background border-input"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Tarea Principal (Opcional)</label>
                        <Combobox
                            options={existingTasks
                                .filter(t => !task || t.id !== task.id) // Avoid self-reference
                                .map(t => ({ value: t.id, label: t.title }))}
                            value={formData.parentId}
                            onChange={(value) => setFormData({ ...formData, parentId: value })}
                            placeholder="Seleccionar tarea padre..."
                            searchPlaceholder="Buscar tarea..."
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : (task ? 'Actualizar' : 'Crear Tarea')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
