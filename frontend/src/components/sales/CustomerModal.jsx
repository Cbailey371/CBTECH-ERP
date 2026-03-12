import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export default function CustomerModal({ isOpen, onClose, onSave, customer, loading }) {
    const [formData, setFormData] = useState({
        name: '',
        tradeName: '',
        taxId: '',
        dv: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        tipoReceptor: '01',
        tipoIdentificacion: '02',
        codUbi: '',
        paisReceptor: 'PA'
    });

    useEffect(() => {
        if (customer) {
            setFormData({
                code: customer.code || '',
                name: customer.name || '',
                tradeName: customer.tradeName || '',
                taxId: customer.taxId || '',
                dv: customer.dv || '',
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.address || '',
                notes: customer.notes || '',
                tipoReceptor: customer.tipoReceptor || '01',
                tipoIdentificacion: customer.tipoIdentificacion || '02',
                codUbi: customer.codUbi || '',
                paisReceptor: customer.paisReceptor || 'PA'
            });
        } else {
            setFormData({
                name: '',
                tradeName: '',
                taxId: '',
                dv: '',
                email: '',
                phone: '',
                address: '',
                notes: '',
                tipoReceptor: '01',
                tipoIdentificacion: '02',
                codUbi: '',
                paisReceptor: 'PA'
            });
        }
    }, [customer, isOpen]);

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
            <DialogContent className="sm:max-w-[600px] bg-background border-border text-foreground">
                <DialogHeader>
                    <DialogTitle>{customer ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Código</label>
                                <Input
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    placeholder="Ej. CUST-001"
                                    className="bg-background border-input focus:border-ring"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Razón Social *</label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Nombre de la empresa"
                                    required
                                    className="bg-background border-input focus:border-ring"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Nombre Comercial</label>
                            <Input
                                name="tradeName"
                                value={formData.tradeName}
                                onChange={handleChange}
                                className="bg-background border-input"
                                required
                                placeholder="Ej. Mi Empresa"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">RUC / Identificación</label>
                            <Input
                                name="taxId"
                                value={formData.taxId}
                                onChange={handleChange}
                                className="bg-background border-input"
                                required
                                placeholder="Ej. 123456789"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">DV</label>
                            <Input
                                name="dv"
                                value={formData.dv}
                                onChange={handleChange}
                                className="bg-background border-input"
                                required
                                maxLength={2}
                                placeholder="00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <Input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="bg-background border-input"
                                placeholder="contacto@empresa.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                            <Input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="bg-background border-input"
                                placeholder="+507 6000-0000"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Dirección</label>
                        <Input
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="bg-background border-input"
                            placeholder="Ciudad, Calle, Edificio..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Notas</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Información adicional..."
                        />
                    </div>

                    <div className="pt-4 border-t border-border">
                        <h4 className="text-sm font-semibold text-foreground mb-4">Datos Requeridos por DGI (Facturación Electrónica)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Tipo de Receptor</label>
                                <select
                                    name="tipoReceptor"
                                    value={formData.tipoReceptor}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="01">01 - Contribuyente (B2B)</option>
                                    <option value="02">02 - Consumidor Final (B2C)</option>
                                    <option value="03">03 - Gobierno</option>
                                    <option value="04">04 - Extranjero</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Tipo de Identificación</label>
                                <select
                                    name="tipoIdentificacion"
                                    value={formData.tipoIdentificacion}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="01">01 - Cédula</option>
                                    <option value="02">02 - RUC</option>
                                    <option value="03">03 - Pasaporte</option>
                                    <option value="04">04 - Id. Extranjera</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Cod. Ubicación (Ej. 8-8-12)</label>
                                <Input
                                    name="codUbi"
                                    value={formData.codUbi}
                                    onChange={handleChange}
                                    placeholder="Prov-Dist-Correg"
                                    className="bg-background border-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">País Receptor</label>
                                <select
                                    name="paisReceptor"
                                    value={formData.paisReceptor}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="PA">Panamá (PA)</option>
                                    <option value="US">Estados Unidos (US)</option>
                                    <option value="CO">Colombia (CO)</option>
                                    <option value="CR">Costa Rica (CR)</option>
                                    <option value="EX">Otro País/Región</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : (customer ? 'Actualizar' : 'Crear')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
