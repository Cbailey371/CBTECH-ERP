import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import * as salesOrderService from '../../services/salesOrderService';
import { Plus, Search, Eye, FileText } from 'lucide-react';
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
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

    useEffect(() => {
        if (selectedCompany) fetchOrders();
    }, [selectedCompany, searchTerm]);

    const fetchOrders = async (page = 1) => {
        setLoading(true);
        try {
            const response = await salesOrderService.getOrders(token, selectedCompany.id, { page, search: searchTerm });
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

    const getStatusBadge = (status) => {
        const styles = {
            draft: 'bg-muted text-muted-foreground',
            confirmed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            fulfilled: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            cancelled: 'bg-destructive/10 text-destructive border-destructive/20'
        };
        const labels = {
            draft: 'No Fiscalizada',
            confirmed: 'Confirmada',
            fulfilled: 'Fiscalizada', // Or fulfilled
            cancelled: 'Cancelada'
        };
        return <Badge variant="outline" className={styles[status]}>{labels[status] || status}</Badge>;
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
                    <div className="relative max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por número o cliente..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
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
                                <TableRow><TableCell colSpan={6} className="text-center py-8">No hay facturas registradas.</TableCell></TableRow>
                            ) : (
                                orders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                        <TableCell>{order.customer?.name}</TableCell>
                                        <TableCell>{new Date(order.issueDate).toLocaleDateString()}</TableCell>
                                        <TableCell>${parseFloat(order.total).toFixed(2)}</TableCell>
                                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => navigate(`/sales-orders/${order.id}`)}>
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
