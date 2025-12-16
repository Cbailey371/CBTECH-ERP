import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { contractService } from '../../services/contractService';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Calendar, Info, DollarSign, Clock, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

export default function ContractDetail() {
    const { token, selectedCompany } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedCompany && id) {
            loadContract();
        }
    }, [selectedCompany, id]);

    const loadContract = async () => {
        setLoading(true);
        const response = await contractService.getContract(token, selectedCompany.id, id);
        if (response.success) {
            setContract(response.contract);
        } else {
            navigate('/contracts');
        }
        setLoading(false);
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando detalles...</div>;
    if (!contract) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <Button variant="ghost" onClick={() => navigate('/contracts')} className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft size={20} className="mr-2" />
                    Volver
                </Button>
                <Button onClick={() => navigate(`/contracts/${id}/edit`)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Edit size={18} className="mr-2" />
                    Editar
                </Button>
            </div>

            {/* Header Card */}
            <Card className="bg-card/50 border-border backdrop-blur-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">
                                {contract.code && <span className="text-muted-foreground mr-2 font-mono text-2xl">[{contract.code}]</span>}
                                {contract.title}
                            </h1>
                            <p className="text-xl text-primary font-medium">{contract.customer?.name}</p>
                            <p className="text-muted-foreground mt-2">{contract.description}</p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                            <span className="px-4 py-1.5 rounded-full bg-secondary border border-border text-secondary-foreground font-medium text-sm uppercase tracking-wide">
                                {contract.status}
                            </span>
                            <div className="text-right mt-2">
                                <span className="text-sm text-muted-foreground block">Valor Contrato</span>
                                <span className="text-2xl font-bold text-success">${parseFloat(contract.value).toFixed(2)}</span>
                                <span className="text-xs text-muted-foreground ml-1">/{contract.billingCycle}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Details Column */}
                <div className="md:col-span-2 space-y-6">
                    {contract.fileUrl && (
                        <Card className="bg-card/50 border-border backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                                    <FileText size={20} className="text-primary" />
                                    Documento del Contrato
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg border border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-background rounded-lg border border-border">
                                            <FileText className="text-primary" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-foreground font-medium">Contrato Firmado</p>
                                            <p className="text-xs text-muted-foreground">Documento adjunto</p>
                                        </div>
                                    </div>
                                    <a
                                        href={contract.fileUrl.startsWith('http') ? contract.fileUrl : `${(import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace('/api', '')}${contract.fileUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors font-medium"
                                    >
                                        Ver / Descargar
                                    </a>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="bg-card/50 border-border backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                                <Info size={20} className="text-info" />
                                SLA y Alcance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {contract.slaDetails || 'Sin detalles de SLA especificados.'}
                        </CardContent>
                    </Card>

                    <Card className="bg-card/50 border-border backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                                <DollarSign size={20} className="text-success" />
                                Historial de Facturación
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground italic text-center py-4">
                                El historial de facturación se implementará en futuras versiones.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    <Card className="bg-card/50 border-border backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                                <Calendar size={20} className="text-purple-500" />
                                Fechas Clave
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-xs text-muted-foreground uppercase tracking-wide block">Fecha Inicio</label>
                                <span className="text-foreground font-medium">{contract.startDate}</span>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground uppercase tracking-wide block">Fecha Vencimiento</label>
                                <span className={`font-medium ${contract.endDate ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {contract.endDate || 'Indefinido'}
                                </span>
                            </div>
                            <div className="pt-2 border-t border-border">
                                <label className="text-xs text-muted-foreground uppercase tracking-wide block">Renovación</label>
                                <span className="text-foreground font-medium capitalize flex items-center gap-2">
                                    <Clock size={14} className="text-muted-foreground" />
                                    {contract.renewalType === 'auto' ? 'Automática' : 'Manual'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
