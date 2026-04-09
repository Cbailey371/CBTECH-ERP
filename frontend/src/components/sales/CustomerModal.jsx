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
        objetoRetencion: '',
        isTaxExempt: false
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
                objetoRetencion: customer.objetoRetencion || '',
                isTaxExempt: customer.isTaxExempt || false
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
                objetoRetencion: '',
                isTaxExempt: false
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
            <DialogContent className="sm:max-w-[650px] w-[95vw] md:w-full max-h-[92vh] overflow-y-auto bg-background border-border text-foreground p-0 rounded-xl">
                <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
                    <DialogTitle className="text-xl font-bold">{customer ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
                </div>

                <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-8">
                    {/* Información Básica */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-6 w-1 bg-primary rounded-full" />
                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Información General</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                    Código <span className="text-[10px] lowercase font-normal opacity-70">(Opcional)</span>
                                </label>
                                <Input
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    placeholder="CUST-001"
                                    className="h-11 md:h-10 bg-muted/30 border-border focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Razón Social *</label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Nombre de la empresa"
                                    required
                                    className="h-11 md:h-10 bg-muted/30 border-border"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Nombre Comercial</label>
                            <Input
                                name="tradeName"
                                value={formData.tradeName}
                                onChange={handleChange}
                                className="h-11 md:h-10 bg-muted/30 border-border"
                                required
                                placeholder="Nombre de fantasía"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2 space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase">RUC / Cédula *</label>
                                <Input
                                    name="taxId"
                                    value={formData.taxId}
                                    onChange={handleChange}
                                    className="h-11 md:h-10 bg-muted/30 border-border"
                                    required
                                    placeholder="123456789"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase">DV *</label>
                                <Input
                                    name="dv"
                                    value={formData.dv}
                                    onChange={handleChange}
                                    className="h-11 md:h-10 bg-muted/30 border-border"
                                    required
                                    maxLength={2}
                                    placeholder="00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contacto */}
                    <div className="space-y-4 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-6 w-1 bg-primary rounded-full" />
                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Contacto y Ubicación</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Email</label>
                                <Input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="h-11 md:h-10 bg-muted/30 border-border font-medium"
                                    placeholder="ejemplo@correo.com"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Teléfono</label>
                                <Input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="h-11 md:h-10 bg-muted/30 border-border font-medium"
                                    placeholder="6XXX-XXXX"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Dirección Física</label>
                            <Input
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="h-11 md:h-10 bg-muted/30 border-border"
                                placeholder="Provincia, Distrito, Corregimiento..."
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Notas Internas</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className="flex min-h-[100px] w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                placeholder="Detalles relevantes sobre el cliente..."
                            />
                        </div>
                    </div>

                    {/* DGI Info */}
                    <div className="space-y-4 pt-4 border-t border-border/50 p-4 bg-muted/10 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-6 w-1 bg-amber-500 rounded-full" />
                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Facturación Electrónica (DGI)</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Tipo de Receptor</label>
                                <select
                                    name="tipoReceptor"
                                    value={formData.tipoReceptor}
                                    onChange={handleChange}
                                    className="flex h-12 md:h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                                >
                                    <option value="01">Contribuyente (B2B)</option>
                                    <option value="02">Consumidor Final (B2C)</option>
                                    <option value="03">Gobierno</option>
                                    <option value="04">Extranjero</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Tipo de Identificación</label>
                                <select
                                    name="tipoIdentificacion"
                                    value={formData.tipoIdentificacion}
                                    onChange={handleChange}
                                    className="flex h-12 md:h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                                >
                                    <option value="01">Cédula</option>
                                    <option value="02">RUC</option>
                                    <option value="03">Pasaporte</option>
                                    <option value="04">Id. Extranjera</option>
                                </select>
                            </div>

                            <div className="md:col-span-2 space-y-3">
                                <label className="text-xs font-bold text-muted-foreground uppercase block">Ubicación Geográfica Panamá</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <select
                                        value={selectedProvinciaId}
                                        onChange={handleProvinciaChange}
                                        disabled={formData.paisReceptor !== 'PA'}
                                        className="h-12 md:h-10 rounded-lg border border-border bg-background px-3 text-sm"
                                    >
                                        <option value="">Provincia</option>
                                        {panamaLocations.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={selectedDistritoId}
                                        onChange={handleDistritoChange}
                                        disabled={!selectedProvinciaId || formData.paisReceptor !== 'PA'}
                                        className="h-12 md:h-10 rounded-lg border border-border bg-background px-3 text-sm"
                                    >
                                        <option value="">Distrito</option>
                                        {provSelected?.distritos.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                    <select
                                        name="codUbi"
                                        value={formData.codUbi}
                                        onChange={handleChange}
                                        disabled={!selectedDistritoId || formData.paisReceptor !== 'PA'}
                                        className="h-12 md:h-10 rounded-lg border border-border bg-background px-3 text-sm"
                                    >
                                        <option value="">Corregimiento</option>
                                        {distSelected?.corregimientos.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {formData.codUbi && (
                                    <div className="text-[10px] bg-primary/10 text-primary-foreground font-mono px-2 py-1 rounded inline-block">
                                        Código DGI: {formData.codUbi}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">País de Residencia</label>
                                <select
                                    name="paisReceptor"
                                    value={formData.paisReceptor}
                                    onChange={handleChange}
                                    className="flex h-12 md:h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium"
                                >
                                    {panamaCountries.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Objeto de Retención</label>
                                <select
                                    name="objetoRetencion"
                                    value={formData.objetoRetencion}
                                    onChange={handleChange}
                                    className="flex h-12 md:h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                >
                                    <option value="">Sin Retención Especial</option>
                                    {panamaRetentions.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 transition-all hover:bg-emerald-500/10 active:scale-[0.99] cursor-pointer"
                                 onClick={() => setFormData(prev => ({ ...prev, isTaxExempt: !prev.isTaxExempt }))}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-all ${formData.isTaxExempt ? 'bg-emerald-500 border-emerald-500' : 'border-emerald-500/50'}`}>
                                        {formData.isTaxExempt && <div className="w-3 h-1.5 border-l-2 border-b-2 border-white -rotate-45 mb-1" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-foreground">Exento de ITBMS</p>
                                        <p className="text-[11px] text-muted-foreground leading-tight">Activar solo si el cliente posee exoneración fiscal total autorizada.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {formData.tipoReceptor === '03' && (
                            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                <div className="flex gap-3">
                                    <div className="w-5 h-5 rounded-full bg-blue-500 text-background flex items-center justify-center text-[10px] font-bold">i</div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold mb-1">Facturación a Gobierno</p>
                                        <p className="text-[10px] opacity-80">Recuerde que las facturas a gobierno requieren obligatoriamente el código CPBS en los productos.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="sticky bottom-0 z-10 bg-background/80 backdrop-blur-md border-t border-border p-4 -mx-4 md:-mx-6 flex flex-col sm:flex-row gap-2 mt-auto">
                        <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:flex-1 h-12 md:h-10 text-muted-foreground font-bold order-2 sm:order-1">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="w-full sm:flex-1 h-12 md:h-10 bg-primary font-bold shadow-lg shadow-primary/20 order-1 sm:order-2">
                            {loading ? 'Guardando...' : (customer ? 'Actualizar Cliente' : 'Crear Cliente')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
