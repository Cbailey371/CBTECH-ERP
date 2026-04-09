import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supplierService } from '../../services/supplierService';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';

export default function SupplierForm() {
    const { token, selectedCompany } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        ruc: '',
        dv: '',
        email: '',
        phone: '',
        address: '',
        contactName: '',
        paymentTerms: '',
        isActive: true, // Default to true
        notes: ''
    });

    useEffect(() => {
        if (selectedCompany && isEditMode) {
            loadSupplier();
        }
    }, [selectedCompany, id]);

    const loadSupplier = async () => {
        setLoading(true);
        const response = await supplierService.getSupplier(token, selectedCompany.id, id);
        if (response.success && response.supplier) {
            const s = response.supplier;
            setFormData({
                code: s.code || '',
                name: s.name,
                ruc: s.ruc || '',
                dv: s.dv || '',
                email: s.email || '',
                phone: s.phone || '',
                address: s.address || '',
                contactName: s.contactName || '',
                paymentTerms: s.paymentTerms || '',
                isActive: s.isActive,
                notes: s.notes || ''
            });
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let response;
            if (isEditMode) {
                response = await supplierService.updateSupplier(token, selectedCompany.id, id, formData);
            } else {
                response = await supplierService.createSupplier(token, selectedCompany.id, formData);
            }

            if (response.success) {
                navigate('/suppliers');
            } else {
                alert(response.message);
            }
        } catch (error) {
            console.error('Error saving supplier:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-20 md:pb-6">
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 px-2">
                <Button variant="ghost" size="icon" onClick={() => navigate('/suppliers')} className="text-muted-foreground hover:text-foreground h-10 w-10">
                    <ArrowLeft size={24} />
                </Button>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">{isEditMode ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h1>
                    <p className="text-muted-foreground text-xs md:text-sm">Información general y fiscal</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-2">
                <Card className="bg-card border-border backdrop-blur-sm shadow-md">
                    <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Código</label>
                            <Input
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                placeholder="Ej. PROV-001"
                                className="bg-background border-input h-11 md:h-10"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Razón Social / Nombre *</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej. Distribuidora S.A."
                                required
                                className="bg-background border-input h-11 md:h-10"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-muted-foreground">RUC</label>
                                <Input
                                    value={formData.ruc}
                                    onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                                    className="bg-background border-input h-11 md:h-10"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-muted-foreground">DV</label>
                                <Input
                                    value={formData.dv}
                                    onChange={(e) => setFormData({ ...formData, dv: e.target.value })}
                                    className="bg-background border-input h-11 md:h-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Correo Electrónico</label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="bg-background border-input h-11 md:h-10"
                                placeholder="proveedor@empresa.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Teléfono</label>
                            <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="bg-background border-input h-11 md:h-10"
                                placeholder="+507 ..."
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Dirección</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-input rounded-lg h-24 resize-none text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                placeholder="Ubicación física..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Contacto (Vendedor)</label>
                            <Input
                                value={formData.contactName}
                                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                placeholder="Nombre completo del contacto"
                                className="bg-background border-input h-11 md:h-10"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Condiciones de Pago</label>
                            <select
                                value={formData.paymentTerms}
                                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                                className="w-full h-11 md:h-10 px-3 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="contado">Contado</option>
                                <option value="credito_15">Crédito 15 días</option>
                                <option value="credito_30">Crédito 30 días</option>
                                <option value="credito_60">Crédito 60 días</option>
                            </select>
                        </div>

                        {isEditMode && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-muted-foreground">Estado</label>
                                <div className="flex items-center gap-3 py-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="rounded border-input bg-background text-primary focus:ring-primary h-6 w-6 md:h-5 md:w-5"
                                    />
                                    <span className="text-foreground font-medium">{formData.isActive ? 'Activo' : 'Inactivo'}</span>
                                </div>
                            </div>
                        )}

                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Notas Adicionales</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-input rounded-lg h-24 resize-none text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col-reverse md:flex-row justify-end gap-3 md:gap-4 fixed md:relative bottom-0 left-0 w-full md:w-auto p-4 md:p-0 bg-background/80 md:bg-transparent backdrop-blur-lg md:backdrop-blur-none border-t md:border-0 border-border z-10">
                    <Button type="button" variant="ghost" onClick={() => navigate('/suppliers')} className="w-full md:w-auto text-muted-foreground hover:text-foreground h-12 md:h-10">
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground h-12 md:h-10 shadow-lg shadow-primary/20">
                        <Save size={20} className="mr-2" />
                        {loading ? 'Guardando...' : 'Guardar Proveedor'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
