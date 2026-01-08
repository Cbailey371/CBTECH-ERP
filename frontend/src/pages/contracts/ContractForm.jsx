import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { contractService } from '../../services/contractService';
import * as customerService from '../../services/customerService';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Calendar, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Combobox } from '../../components/ui/Combobox';

export default function ContractForm() {
    const { token, selectedCompany } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);

    const [formData, setFormData] = useState({
        code: '',
        customerId: '',
        title: '',
        description: '',
        status: 'draft',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        value: 0,
        billingCycle: 'monthly',
        slaDetails: '',
        renewalType: 'manual'
    });

    useEffect(() => {
        if (selectedCompany) {
            loadCustomers();
            if (isEditMode) loadContract();
        }
    }, [selectedCompany, id]);

    const loadCustomers = async () => {
        const response = await customerService.getCustomers(token, selectedCompany.id, { is_active: 'true', limit: 100 });
        if (response.success) setCustomers(response.customers);
    };

    const loadContract = async () => {
        setLoading(true);
        const response = await contractService.getContract(token, selectedCompany.id, id);
        if (response.success && response.contract) {
            const c = response.contract;
            setFormData({
                code: c.code || '',
                customerId: c.customerId,
                title: c.title,
                description: c.description || '',
                status: c.status,
                startDate: c.startDate,
                endDate: c.endDate || '',
                value: c.value,
                billingCycle: c.billingCycle,
                slaDetails: c.slaDetails || '',
                renewalType: c.renewalType,
                fileUrl: c.fileUrl || ''
            });
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            if (formData.code) data.append('code', formData.code);
            data.append('customerId', formData.customerId);
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('status', formData.status);
            data.append('startDate', formData.startDate);
            if (formData.endDate) data.append('endDate', formData.endDate);
            data.append('value', formData.value);
            data.append('billingCycle', formData.billingCycle);
            data.append('slaDetails', formData.slaDetails);
            data.append('renewalType', formData.renewalType);

            if (formData.file) {
                data.append('file', formData.file);
            }

            let response;
            if (isEditMode) {
                response = await contractService.updateContract(token, selectedCompany.id, id, data);
            } else {
                response = await contractService.createContract(token, selectedCompany.id, data);
            }

            if (response.success) {
                navigate('/contracts');
            } else {
                alert(response.message);
            }
        } catch (error) {
            console.error('Error saving contract:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate('/contracts')} className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft size={24} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{isEditMode ? 'Editar Contrato' : 'Nuevo Contrato'}</h1>
                    <p className="text-muted-foreground text-sm">Define los términos, vigencia y montos</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="bg-card border-border backdrop-blur-sm">
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Título del Contrato *</label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ej. Servicio de Mantenimiento Anual"
                                required
                                className="bg-background border-input"
                            />
                        </div>

                        <div className="md:col-span-1 space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Código (Opcional)</label>
                            <Input
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                placeholder="Ej. CONT-2024-001"
                                className="bg-background border-input"
                            />
                        </div>

                        <div className="md:col-span-1 space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Cliente *</label>
                            <Combobox
                                options={customers.map(c => ({ value: c.id, label: c.name }))}
                                value={formData.customerId}
                                onChange={(value) => setFormData({ ...formData, customerId: value })}
                                placeholder="Seleccionar Cliente..."
                                className="w-full"
                            />
                        </div>

                        <div className="md:col-span-1 space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Estado</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="draft">Borrador</option>
                                <option value="active">Activo</option>
                                <option value="expired">Vencido</option>
                                <option value="cancelled">Cancelado</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Fecha Inicio *</label>
                            <Input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                                className="bg-background border-input"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Fecha Fin (Opcional)</label>
                            <Input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="bg-background border-input"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Ciclo de Facturación</label>
                            <select
                                value={formData.billingCycle}
                                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="monthly">Mensual</option>
                                <option value="quarterly">Trimestral</option>
                                <option value="yearly">Anual</option>
                                <option value="one_time">Pago Único</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Monto / Valor ($)</label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                className="bg-background border-input"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Tipo de Renovación</label>
                            <select
                                value={formData.renewalType}
                                onChange={(e) => setFormData({ ...formData, renewalType: e.target.value })}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="manual">Manual</option>
                                <option value="auto">Automática</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border backdrop-blur-sm">
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Contrato Firmado (PDF/Word)</label>
                            <div className="flex items-center gap-4">
                                <Input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                                    className="bg-background border-input text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                                />
                                {formData.fileUrl && !formData.file && (
                                    <a
                                        href={formData.fileUrl.startsWith('http') ? formData.fileUrl : `${(import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace('/api', '')}${formData.fileUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:text-primary/80 text-sm flex items-center gap-1"
                                    >
                                        <FileText size={16} /> Ver actual
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Descripción / Detalles</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-input rounded-lg h-24 resize-none text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Descripción general del contrato..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">SLA / Alcance del Servicio</label>
                            <textarea
                                value={formData.slaDetails}
                                onChange={(e) => setFormData({ ...formData, slaDetails: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-input rounded-lg h-32 resize-none text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Detalles de niveles de servicio, alcance y exclusiones..."
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="ghost" onClick={() => navigate('/contracts')} className="text-muted-foreground hover:text-foreground">
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Save size={20} className="mr-2" />
                        {loading ? 'Guardando...' : 'Guardar Contrato'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
