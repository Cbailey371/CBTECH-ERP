import React, { useState, useEffect } from 'react';
import { X, Save, UserPlus } from 'lucide-react';
import { Combobox } from '../ui/Combobox';
import { useAuth } from '../../context/AuthProvider';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { userService } from '../../services/userService';
import { customerService } from '../../services/customerService';

export default function ProjectModal({ isOpen, onClose, onSubmit, project, loading }) {
    const { token, selectedCompany } = useAuth();
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        status: 'planning',
        responsibleId: '',
        responsibleExternal: '',
        customerId: '',
        startDate: '',
        endDate: ''
    });
    const [users, setUsers] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [useExternalResponsible, setUseExternalResponsible] = useState(false);

    useEffect(() => {
        if (isOpen && selectedCompany) {
            loadUsers();
            loadCustomers();
        }
    }, [isOpen, selectedCompany]);

    useEffect(() => {
        if (project) {
            setFormData({
                code: project.code || '',
                name: project.name || '',
                description: project.description || '',
                status: project.status || 'planning',
                responsibleId: project.responsibleId || '',
                responsibleExternal: project.responsibleExternal || '',
                customerId: project.customerId || '',
                startDate: project.startDate || '',
                endDate: project.endDate || ''
            });
            setUseExternalResponsible(!!project.responsibleExternal);
        } else {
            setFormData({
                code: '',
                name: '',
                description: '',
                status: 'planning',
                responsibleId: '',
                responsibleExternal: '',
                customerId: '',
                startDate: '',
                endDate: ''
            });
            setUseExternalResponsible(false);
        }
    }, [project, isOpen]);

    const loadUsers = async () => {
        try {
            console.log('Loading users...');
            const response = await userService.getUsers(token, { is_active: 'true' });
            console.log('Users response:', response);
            if (response.success) {
                setUsers(response.data || []);
            } else {
                console.error('Users response unsuccessful:', response);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const loadCustomers = async () => {
        try {
            console.log('Loading customers...');
            const response = await customerService.getCustomers(token, selectedCompany.id, { is_active: 'true' });
            console.log('Customers response:', response);
            if (response.success) {
                setCustomers(response.customers || []);
            } else {
                console.error('Customers response unsuccessful:', response);
            }
        } catch (error) {
            console.error('Error loading customers:', error);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Preparar data limpiando campos según el modo de responsable
        const submitData = {
            code: formData.code || null,
            name: formData.name,
            description: formData.description || null,
            status: formData.status,
            responsibleId: useExternalResponsible ? null : (formData.responsibleId || null),
            responsibleExternal: useExternalResponsible ? formData.responsibleExternal : null,
            customerId: formData.customerId || null,
            startDate: formData.startDate || null,
            endDate: formData.endDate || null
        };

        onSubmit(submitData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background border border-border rounded-lg w-full max-w-2xl shadow-xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-border sticky top-0 bg-background z-10">
                    <h2 className="text-xl font-bold text-foreground">
                        {project ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Código */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Código</label>
                            <Input
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                placeholder="Ej: PROJ-2024-001"
                            />
                        </div>

                        {/* Nombre */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Nombre del Proyecto *</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Implementación ERP"
                                required
                            />
                        </div>

                        {/* Cliente */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Cliente</label>
                            <Combobox
                                options={customers.map(c => ({ value: c.id, label: c.name }))}
                                value={formData.customerId}
                                onChange={(value) => setFormData({ ...formData, customerId: value })}
                                placeholder="Seleccionar Cliente..."
                                searchPlaceholder="Buscar cliente..."
                            />
                        </div>

                        {/* Estado */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Estado</label>
                            <select
                                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="planning">Planificación</option>
                                <option value="in_progress">En Progreso</option>
                                <option value="on_hold">En Pausa</option>
                                <option value="completed">Completado</option>
                                <option value="cancelled">Cancelado</option>
                            </select>
                        </div>

                        {/* Responsable */}
                        <div className="space-y-2 md:col-span-2">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-medium text-muted-foreground">Responsable</label>
                                <button
                                    type="button"
                                    onClick={() => setUseExternalResponsible(!useExternalResponsible)}
                                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                                >
                                    <UserPlus size={14} />
                                    {useExternalResponsible ? 'Seleccionar del sistema' : 'Responsable externo'}
                                </button>
                            </div>

                            {useExternalResponsible ? (
                                <Input
                                    value={formData.responsibleExternal}
                                    onChange={(e) => setFormData({ ...formData, responsibleExternal: e.target.value })}
                                    placeholder="Nombre del responsable externo"
                                />
                            ) : (
                                <Combobox
                                    options={users.map(u => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }))}
                                    value={formData.responsibleId}
                                    onChange={(value) => setFormData({ ...formData, responsibleId: value })}
                                    placeholder="Seleccionar Responsable..."
                                    searchPlaceholder="Buscar usuario..."
                                />
                            )}
                        </div>

                        {/* Descripción */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="block text-sm font-medium text-muted-foreground">Descripción</label>
                            <textarea
                                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none min-h-[100px]"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Descripción del proyecto..."
                            />
                        </div>

                        {/* Fecha Inicio */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Fecha de Inicio</label>
                            <Input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full bg-background border border-input rounded-lg py-2 pl-3 pr-10 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        {/* Fecha Fin */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Fecha de Fin</label>
                            <Input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full bg-background border border-input rounded-lg py-2 pl-3 pr-10 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            <Save size={18} className="mr-2" />
                            {loading ? 'Guardando...' : 'Guardar Proyecto'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
