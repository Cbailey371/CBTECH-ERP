import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supplierService } from '../../services/supplierService';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Building2, Phone, Mail, MapPin, User, FileText, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

export default function SupplierDetail() {
    const { token, selectedCompany } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [supplier, setSupplier] = useState(null);

    useEffect(() => {
        if (selectedCompany && id) {
            loadSupplier();
        }
    }, [selectedCompany, id]);

    const loadSupplier = async () => {
        setLoading(true);
        const response = await supplierService.getSupplier(token, selectedCompany.id, id);
        if (response.success) {
            setSupplier(response.supplier);
        }
        setLoading(false);
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando información del proveedor...</div>;
    if (!supplier) return <div className="p-8 text-center text-destructive">Proveedor no encontrado</div>;

    return (
        <div className="space-y-4 md:space-y-6 animate-fadeIn pb-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2 md:px-0">
                <div className="flex items-start md:items-center gap-3 md:gap-4 w-full md:w-auto">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/suppliers')} className="text-muted-foreground hover:text-foreground h-10 w-10 shrink-0">
                        <ArrowLeft size={24} />
                    </Button>
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <div className="p-2 md:p-3 bg-secondary rounded-lg border border-border shrink-0">
                            <Building2 className="text-primary w-6 h-6 md:w-8 md:h-8" />
                        </div>
                        <div className="overflow-hidden">
                            <h1 className="text-xl md:text-3xl font-bold text-foreground truncate">{supplier.name}</h1>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="font-mono text-[10px] md:text-sm px-1.5 py-0.5 bg-muted rounded text-foreground inline-block truncate">
                                    {supplier.code ? `${supplier.code} | ` : ''}{supplier.ruc}-{supplier.dv}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium border ${supplier.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                                    {supplier.isActive ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-full md:w-auto">
                    <Button onClick={() => navigate(`/suppliers/${supplier.id}/edit`)} variant="outline" className="w-full md:w-auto border-border text-foreground hover:bg-accent h-10">
                        <Edit size={18} className="mr-2" />
                        Editar Proveedor
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-2 md:px-0">
                {/* Contact Info */}
                <Card className="bg-card/50 border-border backdrop-blur-sm md:col-span-1 h-fit shadow-md">
                    <CardHeader className="p-4 md:p-6">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2 text-foreground">
                            <User size={18} className="text-primary" />
                            Información de Contacto
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4">
                        {supplier.contactName && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-muted rounded-full">
                                    <User size={16} className="text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Vendedor / Contacto</p>
                                    <p className="text-sm text-foreground font-medium">{supplier.contactName}</p>
                                </div>
                            </div>
                        )}
                        {supplier.email && (
                            <a href={`mailto:${supplier.email}`} className="flex items-start gap-3 group active:bg-muted/50 p-1 -m-1 rounded-lg transition-colors">
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <Mail size={16} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Correo Electrónico</p>
                                    <p className="text-sm text-foreground font-medium break-all group-hover:text-primary transition-colors">{supplier.email}</p>
                                </div>
                            </a>
                        )}
                        {supplier.phone && (
                            <a href={`tel:${supplier.phone}`} className="flex items-start gap-3 group active:bg-muted/50 p-1 -m-1 rounded-lg transition-colors">
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <Phone size={16} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Teléfono</p>
                                    <p className="text-sm text-foreground font-medium group-hover:text-primary transition-colors">{supplier.phone}</p>
                                </div>
                            </a>
                        )}
                        {supplier.address && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-muted rounded-full">
                                    <MapPin size={16} className="text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Dirección</p>
                                    <p className="text-sm text-foreground leading-relaxed">{supplier.address}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Commercial Details */}
                <div className="md:col-span-2 space-y-4 md:space-y-6">
                    <Card className="bg-card/50 border-border backdrop-blur-sm shadow-md">
                        <CardHeader className="p-4 md:p-6">
                            <CardTitle className="text-base md:text-lg flex items-center gap-2 text-foreground">
                                <FileText size={18} className="text-blue-400" />
                                Detalles Comerciales
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 md:p-6 pt-0 md:pt-0 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Condición de Pago</p>
                                <p className="text-base text-foreground font-bold capitalize">
                                    {supplier.paymentTerms ? supplier.paymentTerms.replace(/_/g, ' ') : 'No especificado'}
                                </p>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Fecha de Registro</p>
                                <div className="flex items-center gap-2 text-foreground font-medium">
                                    <Calendar size={14} className="text-muted-foreground" />
                                    {new Date(supplier.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Notas</p>
                                <div className="bg-background/50 p-4 rounded-lg border border-border text-sm text-muted-foreground whitespace-pre-wrap min-h-[100px]">
                                    {supplier.notes || 'Sin notas adicionales.'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Historial (Placeholder mejorado) */}
                    <Card className="bg-card/30 border-border/50 border-dashed backdrop-blur-sm shadow-sm overflow-hidden">
                        <CardHeader className="p-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                                <Calendar size={16} />
                                Actividad Reciente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-2">
                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                                <FileText size={24} className="text-muted-foreground/50" />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Próximamente</h3>
                                <p className="text-xs text-muted-foreground/70">Historial completo de compras y facturación.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
