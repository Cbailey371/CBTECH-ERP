import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthProvider';
import * as companyService from '../../services/companyService';

import * as pacProviderService from '../../services/pacProviderService';

export default function CompanyModal({ isOpen, onClose, onSave, company, loading }) {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [pacProviders, setPacProviders] = useState([]);

    // ... existing state ...

    useEffect(() => {
        if (isOpen) {
            // Fetch PAC Providers when modal opens to get fresh data
            pacProviderService.getPacProviders(token).then(res => {
                if (res.success) setPacProviders(res.data);
            }).catch(err => console.error('Error loading PAC providers', err));
        }
    }, [token, isOpen]);

    // ... existing effects ...

    // ... inside render ...

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

    const [fiscalData, setFiscalData] = useState({
        ruc: '',
        dv: '',
        razonSocial: '',
        direccion: '',
        sucursal: '0000',
        puntoDeVenta: '01',
        pacProvider: 'WEBPOS',
        environment: 'TEST',
        pacUser: '',
        pacPassword: '',
        apiKey: '',
        resolutionNumber: ''
    });

    useEffect(() => {
        if (isOpen) {
            setActiveTab('general');
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

                // Fetch Fiscal Config
                companyService.getFiscalConfig(token, company.id).then(res => {
                    if (res.success && res.config) {
                        const c = res.config;
                        setFiscalData({
                            ruc: c.ruc || company.taxId || '',
                            dv: c.dv || company.dv || '',
                            razonSocial: c.razonSocial || company.legalName || '',
                            direccion: c.direccion || company.addressLine1 || '',
                            sucursal: c.sucursal || '0000',
                            puntoDeVenta: c.puntoDeVenta || '01',
                            pacProvider: c.pacProvider || 'WEBPOS',
                            environment: c.environment || 'TEST',
                            pacUser: c.authData?.user || '',
                            pacUser: c.authData?.user || '',
                            pacPassword: c.authData?.password || '',
                            apiKey: c.authData?.apiKey || '',
                            resolutionNumber: c.authData?.resolutionNumber || ''
                        });
                    } else {
                        // Pre-fill defaults from company info
                        setFiscalData({
                            ruc: company.taxId || '',
                            dv: company.dv || '',
                            razonSocial: company.legalName || '',
                            direccion: company.addressLine1 || '',
                            sucursal: '0000',
                            puntoDeVenta: '01',
                            pacProvider: 'WEBPOS',
                            environment: 'TEST',
                            pacUser: '',
                            pacUser: '',
                            pacPassword: '',
                            apiKey: '',
                            resolutionNumber: ''
                        });
                    }
                }).catch(console.error);

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
                setFiscalData({
                    ruc: '', dv: '', razonSocial: '', direccion: '', sucursal: '0000',
                    puntoDeVenta: '01', pacProvider: 'WEBPOS', environment: 'TEST',
                    pacUser: '', pacPassword: '', apiKey: '', resolutionNumber: ''
                });
            }
        }
    }, [company, isOpen, token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFiscalChange = (e) => {
        const { name, value } = e.target;
        setFiscalData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Save General Data
        await onSave(formData);

        // Use a small delay or ensure company ID is available. 
        // If creating new company, onSave needs to return the new ID or handle it.
        // For now, assuming editing existing companies for fiscal config is the primary use case.
        if (company) {
            try {
                await companyService.updateFiscalConfig(token, company.id, fiscalData);
                // Feedback is handled by parent refresh or silent success
            } catch (err) {
                console.error('Error saving fiscal data', err);
                alert('Error al guardar configuración fiscal');
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{company ? 'Editar Empresa' : 'Nueva Empresa'}</DialogTitle>
                </DialogHeader>

                <div className="flex border-b border-border mb-4">
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                        onClick={() => setActiveTab('general')}
                    >
                        Generales
                    </button>
                    {company && (
                        <button
                            className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'fiscal' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                            onClick={() => setActiveTab('fiscal')}
                        >
                            Facturación Electrónica (PAC)
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {activeTab === 'general' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Código (Opcional)</label>
                                    <Input name="code" value={formData.code} onChange={handleChange} className="bg-background border-input" placeholder="Ej. EMP-001" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Nombre Comercial</label>
                                    <Input name="name" value={formData.name} onChange={handleChange} className="bg-background border-input" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Razón Social</label>
                                <Input name="legal_name" value={formData.legal_name} onChange={handleChange} className="bg-background border-input" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">RUC / Tax ID</label>
                                    <div className="flex space-x-2">
                                        <Input name="tax_id" value={formData.tax_id} onChange={handleChange} className="bg-background border-input flex-1" required />
                                        <div className="w-20">
                                            <Input name="dv" value={formData.dv} onChange={handleChange} className="bg-background border-input" placeholder="DV" maxLength={4} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                                    <Input type="email" name="email" value={formData.email} onChange={handleChange} className="bg-background border-input" required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Dirección</label>
                                <Input name="address_line1" value={formData.address_line1} onChange={handleChange} className="bg-background border-input" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Ciudad</label>
                                    <Input name="city" value={formData.city} onChange={handleChange} className="bg-background border-input" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                                    <Input name="phone" value={formData.phone} onChange={handleChange} className="bg-background border-input" placeholder="+507 ..." />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'fiscal' && (
                        <div className="space-y-4 p-1">
                            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-md mb-4">
                                <p className="text-xs text-amber-500">
                                    Estos datos son utilizados para la comunicación con el Proveedor de Autorización Calificado (PAC).
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Proveedor PAC</label>
                                    <select name="pacProvider" value={fiscalData.pacProvider} onChange={handleFiscalChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                                        <option value="">Seleccione un PAC...</option>
                                        {pacProviders.length > 0 ? (
                                            pacProviders.map(p => (
                                                <option key={p.id} value={p.code}>{p.name}</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="WEBPOS">WEBPOS</option>
                                                <option value="THEFACTORY">The Factory HKA</option>
                                                <option value="GURU">GuruSoft</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Ambiente</label>
                                    <select name="environment" value={fiscalData.environment} onChange={handleFiscalChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                                        <option value="TEST">Pruebas (Sandbox)</option>
                                        <option value="PROD">Producción</option>
                                    </select>
                                </div>
                            </div>

                            {(() => {
                                const selectedProvider = pacProviders.find(p => p.code === fiscalData.pacProvider);
                                const authType = selectedProvider?.auth_type || 'API_KEY'; // Default to API_KEY if not found (e.g. initial load) or explicitly set

                                return (
                                    <>
                                        {authType === 'API_KEY' && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-muted-foreground">API Key</label>
                                                <Input name="apiKey" value={fiscalData.apiKey} onChange={handleFiscalChange} className="bg-background border-input" />
                                            </div>
                                        )}

                                        {(authType === 'USER_PASS' || authType === 'OAUTH') && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-muted-foreground">Usuario PAC</label>
                                                    <Input name="pacUser" value={fiscalData.pacUser} onChange={handleFiscalChange} className="bg-background border-input" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-muted-foreground">Contraseña PAC</label>
                                                    <Input type="password" name="pacPassword" value={fiscalData.pacPassword} onChange={handleFiscalChange} className="bg-background border-input" />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">No. Resolución</label>
                                <Input name="resolutionNumber" value={fiscalData.resolutionNumber} onChange={handleFiscalChange} className="bg-background border-input" placeholder="Ej. 201-..." />
                            </div>

                            <div className="grid grid-cols-4 gap-4 border-t border-border pt-4">
                                <div className="col-span-1 space-y-2">
                                    <label className="text-xs text-muted-foreground">Sucursal</label>
                                    <Input name="sucursal" value={fiscalData.sucursal} onChange={handleFiscalChange} className="bg-background border-input h-8 text-xs" />
                                </div>
                                <div className="col-span-1 space-y-2">
                                    <label className="text-xs text-muted-foreground">Pto. Venta</label>
                                    <Input name="puntoDeVenta" value={fiscalData.puntoDeVenta} onChange={handleFiscalChange} className="bg-background border-input h-8 text-xs" />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs text-muted-foreground">RUC (Fiscal)</label>
                                    <Input name="ruc" value={fiscalData.ruc} onChange={handleFiscalChange} className="bg-background border-input h-8 text-xs" />
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : (company ? 'Guardar Cambios' : 'Crear')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
}
