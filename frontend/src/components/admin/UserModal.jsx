import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import * as companyService from '../../services/companyService';
import { useAuth } from '../../context/AuthContext';

export default function UserModal({ isOpen, onClose, onSave, user, loading }) {
    const { token } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        role: 'user',
        selectedCompanies: [] // Array de IDs de empresas seleccionadas
    });
    const [availableCompanies, setAvailableCompanies] = useState([]);

    useEffect(() => {
        const loadCompanies = async () => {
            try {
                const response = await companyService.getAllCompanies(token);
                if (response.success) {
                    setAvailableCompanies(response.data.companies);
                }
            } catch (error) {
                console.error('Error loading companies:', error);
            }
        };

        if (isOpen) {
            loadCompanies();
        }
    }, [isOpen, token]);

    useEffect(() => {
        if (user) {
            setFormData({
                code: user.code || '',
                username: user.username || '',
                email: user.email || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                password: '', // No mostrar password al editar
                role: user.role || 'user',
                selectedCompanies: user.companies ? user.companies.map(c => c.id) : []
            });
        } else {
            setFormData({
                code: '',
                username: '',
                email: '',
                firstName: '',
                lastName: '',
                password: '',
                role: 'user',
                selectedCompanies: []
            });
        }
    }, [user, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCompanyToggle = (companyId) => {
        setFormData(prev => {
            const currentSelected = prev.selectedCompanies || [];
            if (currentSelected.includes(companyId)) {
                return { ...prev, selectedCompanies: currentSelected.filter(id => id !== companyId) };
            } else {
                return { ...prev, selectedCompanies: [...currentSelected, companyId] };
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-card border-border text-foreground">
                <DialogHeader>
                    <DialogTitle>{user ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Código (Opcional)</label>
                        <Input
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            className="bg-background border-input"
                            placeholder="Ej. USR-001"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                            <Input
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="bg-background border-input"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Apellido</label>
                            <Input
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="bg-background border-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Usuario</label>
                            <Input
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="bg-background border-input"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <Input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="bg-background border-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                            {user ? 'Contraseña (Opcional - Dejar en blanco para mantener)' : 'Contraseña'}
                        </label>
                        <Input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="bg-background border-input"
                            required={!user}
                            placeholder={user ? "••••••••" : ""}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Rol Global</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                        >
                            <option value="user">Usuario</option>
                            <option value="admin">Administrador</option>
                            <option value="manager">Gerente</option>
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground">Asignar Empresas</label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-border rounded-md bg-muted/20">
                            {availableCompanies.map(company => (
                                <label key={company.id} className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-accent rounded">
                                    <input
                                        type="checkbox"
                                        checked={formData.selectedCompanies.includes(company.id)}
                                        onChange={() => handleCompanyToggle(company.id)}
                                        className="rounded border-input bg-background text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm text-foreground truncate">{company.name}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Selecciona las empresas a las que este usuario tendrá acceso.</p>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : (user ? 'Actualizar' : 'Crear')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
