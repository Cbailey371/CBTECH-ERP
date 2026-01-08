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
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/suppliers')} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={24} />
                    </Button>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-card rounded-lg border border-border">
                            <Building2 className="text-primary" size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">{supplier.name}</h1>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <span className="font-mono text-sm px-2 py-0.5 bg-muted rounded text-foreground">{supplier.code ? `${supplier.code} | ` : ''}{supplier.ruc}-{supplier.dv}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${supplier.isActive ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                                    {supplier.isActive ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <Button onClick={() => navigate(`/suppliers/${supplier.id}/edit`)} variant="outline" className="border-border text-foreground hover:bg-accent">
                    <Edit size={18} className="mr-2" />
                    Editar
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Contact Info */}
                <Card className="bg-card/50 border-border backdrop-blur-sm md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                            <User size={20} className="text-primary" />
                            Información de Contacto
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {supplier.contactName && (
                            <div className="flex items-start gap-3">
                                <User size={18} className="text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Vendedor / Contacto</p>
                                    <p className="text-foreground font-medium">{supplier.contactName}</p>
                                </div>
                            </div>
                        )}
                        {supplier.email && (
                            <div className="flex items-start gap-3">
                                <Mail size={18} className="text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Correo Electrónico</p>
                                    <p className="text-foreground font-medium break-all">{supplier.email}</p>
                                </div>
                            </div>
                        )}
                        {supplier.phone && (
                            <div className="flex items-start gap-3">
                                <Phone size={18} className="text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Teléfono</p>
                                    <p className="text-foreground font-medium">{supplier.phone}</p>
                                </div>
                            </div>
                        )}
                        {supplier.address && (
                            <div className="flex items-start gap-3">
                                <MapPin size={18} className="text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Dirección</p>
                                    <p className="text-foreground">{supplier.address}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Commercial Details */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="bg-card/50 border-border backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                                <FileText size={20} className="text-blue-400" />
                                Condiciones Comerciales
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Condición de Pago</p>
                                <p className="text-lg text-foreground font-semibold capitalize">
                                    {supplier.paymentTerms ? supplier.paymentTerms.replace('_', ' ') : 'No especificado'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Fecha de Registro</p>
                                <div className="flex items-center gap-2 text-foreground">
                                    <Calendar size={16} className="text-muted-foreground" />
                                    {new Date(supplier.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm text-muted-foreground mb-2">Notas</p>
                                <div className="bg-muted/50 p-4 rounded-lg border border-border text-muted-foreground whitespace-pre-wrap">
                                    {supplier.notes || 'Sin notas adicionales.'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Placeholder for Purchase History */}
                    <Card className="bg-card/50 border-border backdrop-blur-sm opacity-75">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
                                <FileText size={20} />
                                Historial de Compras
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center py-8">
                            <p className="text-muted-foreground italic">Próximamente: Historial de Órdenes de Compra y Facturas</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
