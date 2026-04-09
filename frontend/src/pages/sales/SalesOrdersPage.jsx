import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import * as salesOrderService from '../../services/salesOrderService';
import { Plus, Search, Eye, FileText, Truck, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';

export default function SalesOrdersPage() {
    const { token, selectedCompany } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

    useEffect(() => {
        if (selectedCompany) fetchOrders();
    }, [selectedCompany, searchTerm, startDate, endDate, statusFilter]);

    const fetchOrders = async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                page,
                search: searchTerm,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                status: statusFilter === 'all' ? undefined : statusFilter || undefined
            };
            const response = await salesOrderService.getOrders(token, selectedCompany.id, params);
            if (response.success) {
                setOrders(response.orders);
                setPagination(response.pagination);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (order) => {
        // High priority: Electronic Invoice check
        if (order.feDocument || (order.fe_documents && order.fe_documents.length > 0)) {
            return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Autorizada DGI</Badge>;
        }

        if (order.status === 'draft') return <Badge variant="outline" className="bg-muted text-muted-foreground border-border">No Fiscalizada</Badge>;
        if (order.status === 'cancelled') return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Cancelada</Badge>;

        // Priority to Payment Status
        if (order.paymentStatus === 'paid') return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Pagada</Badge>;
        if (order.paymentStatus === 'partial') return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">Abono</Badge>;

        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Fiscalizada</Badge>;
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Facturas de Venta</h1>
                    <p className="text-muted-foreground mt-1">Administra tus facturas fiscales y órdenes de venta.</p>
                </div>
                <Button onClick={() => navigate('/sales-orders/new')} className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" /> Nueva Factura
                </Button>
            </div>

            <Card className="bg-card border-border">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por número o cliente..."
                                className="pl-9 w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full md:w-40"
                            />
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full md:w-40"
                            />
                            <select
                                className="flex h-9 w-full md:w-40 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">Todos</option>
                                <option value="draft">No Fiscalizada (Borrador)</option>
                                <option value="fulfilled">Autorizada DGI (Fiscalizada)</option>
                                <option value="cancelled">Anulada / Cancelada</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Número</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell></TableRow>
                                ) : orders.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-8">No hay facturas que coincidan con los filtros.</TableCell></TableRow>
                                ) : (
                                    orders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                {order.orderNumber}
                                                {order.creditNotes && order.creditNotes.length > 0 && (
                                                    <AlertCircle 
                                                        className="w-4 h-4 text-orange-500 cursor-pointer animate-pulse" 
                                                        title={`Esta factura tiene ${order.creditNotes.length} Nota(s) de Crédito asociada(s). Haz clic para ir a NC.`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate('/credit-notes', { state: { searchTerm: order.orderNumber } });
                                                        }}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>{order.customer?.name}</TableCell>
                                            <TableCell>{new Date(order.issueDate).toLocaleDateString()}</TableCell>
                                            <TableCell>${parseFloat(order.total).toFixed(2)}</TableCell>
                                            <TableCell>{getStatusBadge(order)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => navigate(`/sales-orders/${order.id}`)}>
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                {order.feDocument && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={async () => {
                                                            try {
                                                                const baseUrl = import.meta.env.VITE_API_URL || (window.location.origin + '/api');
                                                                const url = `${baseUrl}/sales-orders/download-cafe?id=${order.feDocument.id}`;
                                                                const response = await api.get(url, { responseType: 'blob' });
                                                                const blob = new Blob([response.data], { type: 'application/pdf' });
                                                                const downloadUrl = window.URL.createObjectURL(blob);
                                                                const link = document.createElement('a');
                                                                link.href = downloadUrl;
                                                                link.setAttribute('download', `CAFE_${order.orderNumber}.pdf`);
                                                                document.body.appendChild(link);
                                                                link.click();
                                                                link.remove();
                                                                window.URL.revokeObjectURL(downloadUrl);
                                                            } catch (error) {
                                                                console.error('Error downloading PDF:', error);
                                                            }
                                                        }}
                                                        title="Descargar CAFE (PDF)"
                                                    >
                                                        <FileText className="w-4 h-4 text-emerald-600" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => navigate(`/delivery-notes/new?sourceOrderId=${order.id}`)}
                                                    title="Generar Nota de Entrega"
                                                >
                                                    <Truck className="w-4 h-4 text-primary" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Cards View */}
                    <div className="md:hidden space-y-4">
                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">Cargando facturas...</div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No hay facturas.</div>
                        ) : (
                            orders.map(order => (
                                <div 
                                    key={order.id} 
                                    className="border border-border rounded-xl p-4 bg-card active:bg-muted/30 transition-colors shadow-sm"
                                    onClick={() => navigate(`/sales-orders/${order.id}`)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-primary">{order.orderNumber}</span>
                                            {order.creditNotes && order.creditNotes.length > 0 && (
                                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                            )}
                                        </div>
                                        {getStatusBadge(order)}
                                    </div>
                                    
                                    <div className="mb-4">
                                        <div className="text-sm font-semibold text-foreground line-clamp-1">
                                            {order.customer?.name}
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(order.issueDate).toLocaleDateString()}
                                            </span>
                                            <span className="text-lg font-black text-foreground">
                                                ${parseFloat(order.total).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-3 border-t border-border/50">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="flex-1 h-10 gap-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/sales-orders/${order.id}`);
                                            }}
                                        >
                                            <Eye size={16} /> Ver
                                        </Button>
                                        
                                        {order.feDocument && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 h-10 gap-2 text-emerald-600 border-emerald-500/20 bg-emerald-500/5"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        const baseUrl = import.meta.env.VITE_API_URL || (window.location.origin + '/api');
                                                        const url = `${baseUrl}/sales-orders/download-cafe?id=${order.feDocument.id}`;
                                                        const response = await api.get(url, { responseType: 'blob' });
                                                        const blob = new Blob([response.data], { type: 'application/pdf' });
                                                        const downloadUrl = window.URL.createObjectURL(blob);
                                                        const link = document.createElement('a');
                                                        link.href = downloadUrl;
                                                        link.setAttribute('download', `CAFE_${order.orderNumber}.pdf`);
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        link.remove();
                                                        window.URL.revokeObjectURL(downloadUrl);
                                                    } catch (error) {
                                                        console.error('Error downloading PDF:', error);
                                                    }
                                                }}
                                            >
                                                <FileText size={16} /> PDF
                                            </Button>
                                        )}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="p-2 h-10 w-10 flex items-center justify-center text-primary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/delivery-notes/new?sourceOrderId=${order.id}`);
                                            }}
                                            title="Generar Nota de Entrega"
                                        >
                                            <Truck size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="flex items-center justify-between mt-6 border-t border-border pt-4">
                        <div className="text-sm text-muted-foreground">
                            Mostrando <span className="font-medium">{orders.length}</span> de <span className="font-medium">{pagination.total}</span> facturas
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchOrders(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                            >
                                Anterior
                            </Button>
                            <div className="flex items-center px-4 text-sm font-medium">
                                Página {pagination.page} de {pagination.totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchOrders(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
