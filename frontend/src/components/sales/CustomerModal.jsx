import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import panamaLocations from '../../utils/panamaLocations.json';
import panamaCountries from '../../utils/panamaCountries.json';
import panamaRetentions from '../../utils/panamaRetentions.json';
import panamaCPBS from '../../utils/panamaCPBS.json';

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
        paisReceptor: 'PA',
        objetoRetencion: ''
    });

    const [selectedProvinciaId, setSelectedProvinciaId] = useState('');
    const [selectedDistritoId, setSelectedDistritoId] = useState('');

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
                paisReceptor: customer.paisReceptor || 'PA',
                objetoRetencion: customer.objetoRetencion || ''
            });

            // Si el cliente tiene codUbi, configurar los selects de provincia y distrito
            if (customer.codUbi) {
                const parts = customer.codUbi.split('-');
                if (parts.length >= 2) {
                    setSelectedProvinciaId(parts[0]);
                    setSelectedDistritoId(`${parts[0]}-${parts[1]}`);
                }
            } else {
                setSelectedProvinciaId('');
                setSelectedDistritoId('');
            }
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
                paisReceptor: 'PA',
                objetoRetencion: ''
            });
            setSelectedProvinciaId('');
            setSelectedDistritoId('');
        }
    }, [customer, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProvinciaChange = (e) => {
        const provId = e.target.value;
        setSelectedProvinciaId(provId);
        setSelectedDistritoId('');
        setFormData(prev => ({ ...prev, codUbi: '' })); // Reset corregimiento
    };

    const handleDistritoChange = (e) => {
        const distId = e.target.value;
        setSelectedDistritoId(distId);
        setFormData(prev => ({ ...prev, codUbi: '' })); // Reset corregimiento
    };

    const provSelected = useMemo(() => panamaLocations.find(p => p.id === selectedProvinciaId), [selectedProvinciaId]);
    const distSelected = useMemo(() => provSelected?.distritos.find(d => d.id === selectedDistritoId), [provSelected, selectedDistritoId]);

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
                            <div className="space-y-4 col-span-2 border p-3 rounded-md border-border bg-muted/20">
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-1 block">Ubicación Geográfica (DGI)</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <select
                                            value={selectedProvinciaId}
                                            onChange={handleProvinciaChange}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            disabled={formData.paisReceptor !== 'PA'}
                                        >
                                            <option value="">-- Provincia --</option>
                                            {panamaLocations.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={selectedDistritoId}
                                            onChange={handleDistritoChange}
                                            disabled={!selectedProvinciaId || formData.paisReceptor !== 'PA'}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">-- Distrito --</option>
                                            {provSelected?.distritos.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                        <select
                                            name="codUbi"
                                            value={formData.codUbi}
                                            onChange={handleChange}
                                            disabled={!selectedDistritoId || formData.paisReceptor !== 'PA'}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">-- Corregimiento --</option>
                                            {distSelected?.corregimientos.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        Código resultante: {formData.codUbi || '(Ninguno)'} -- Requerido solo para operaciones locales en Panamá.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2 col-span-2">
                                <label className="text-sm font-medium text-muted-foreground">País Receptor</label>
                                <select
                                    name="paisReceptor"
                                    value={formData.paisReceptor}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {panamaCountries.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2 col-span-2">
                                <label className="text-sm font-medium text-muted-foreground">Objeto de Retención (DGI)</label>
                                <select
                                    name="objetoRetencion"
                                    value={formData.objetoRetencion}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">-- Sin Retención --</option>
                                    {panamaRetentions.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            {formData.tipoReceptor === '03' && (
                                <div className="space-y-2 col-span-2 bg-blue-50 p-3 rounded-md border border-blue-200">
                                    <p className="text-xs font-semibold text-blue-800">Facturación a Gobierno detectada:</p>
                                    <ul className="text-[10px] text-blue-700 list-disc ml-4">
                                        <li>Es obligatorio usar el Catálogo CPBS en los ítems de factura.</li>
                                        <li>Asegúrese de que el RUC sea válido para Organismos de Gobierno.</li>
                                    </ul>
                                </div>
                            )}
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
