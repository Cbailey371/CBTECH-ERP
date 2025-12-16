import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export default function CompanyModal({ isOpen, onClose, onSave, company, loading }) {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        legal_name: '',
        tax_id: '',
        dv: '',
        email: '',
        address_line1: '',
        city: '',
        phone: ''
    });

    useEffect(() => {
        if (company) {
            setFormData({
                code: company.code || '',
                name: company.name || '',
                legal_name: company.legalName || '',
                tax_id: company.taxId || '',
                dv: company.dv || '',
                email: company.email || '',
                address_line1: company.addressLine1 || '',
                city: company.city || '',
                phone: company.phone || ''
            });
        } else {
            setFormData({
                code: '',
                name: '',
                legal_name: '',
                tax_id: '',
                dv: '',
                email: '',
                address_line1: '',
                city: '',
                phone: ''
            });
        }
    }, [company, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-card border-border text-foreground">
                <DialogHeader>
                    <DialogTitle>{company ? 'Editar Empresa' : 'Nueva Empresa'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Código (Opcional)</label>
                            <Input
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                className="bg-background border-input"
                                placeholder="Ej. EMP-001"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Nombre Comercial</label>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="bg-background border-input"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Razón Social</label>
                        <Input
                            name="legal_name"
                            value={formData.legal_name}
                            onChange={handleChange}
                            className="bg-background border-input"
                            required
                        />
                    </div>


                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">RUC / Tax ID</label>
                            <div className="flex space-x-2">
                                <Input
                                    name="tax_id"
                                    value={formData.tax_id}
                                    onChange={handleChange}
                                    className="bg-background border-input flex-1"
                                    required
                                />
                                <div className="w-20">
                                    <Input
                                        name="dv"
                                        value={formData.dv}
                                        onChange={handleChange}
                                        className="bg-background border-input"
                                        placeholder="DV"
                                        maxLength={4}
                                    />
                                </div>
                            </div>
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
                        <label className="text-sm font-medium text-muted-foreground">Dirección</label>
                        <Input
                            name="address_line1"
                            value={formData.address_line1}
                            onChange={handleChange}
                            className="bg-background border-input"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Ciudad</label>
                            <Input
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="bg-background border-input"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                            <Input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="bg-background border-input"
                                placeholder="+507 ..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : (company ? 'Actualizar' : 'Crear')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
}
