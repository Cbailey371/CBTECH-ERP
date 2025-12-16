import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Calendar, FileText, ShoppingBag, Trash2, Edit } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '../../components/ui/Dialog';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import { supplierService } from '../../services/supplierService';

export default function PurchaseOrdersPage() {
    console.log("Rendering PurchaseOrdersPage"); // Debug log
    const { token, selectedCompany } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    // Delete Dialog State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [poToDelete, setPoToDelete] = useState(null);

    const [filters, setFilters] = useState({
        search: '',
        status: '',
        supplierId: '',
    });

    useEffect(() => {
        if (selectedCompany) {
            loadSuppliers();
            loadPurchaseOrders();
        }
    }, [selectedCompany, filters.status, filters.supplierId]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (selectedCompany) loadPurchaseOrders();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters.search]);

    const loadSuppliers = async () => {
        try {
            const response = await supplierService.getSuppliers(token, selectedCompany.id, { is_active: 'true' });
            if (response.success) {
                setSuppliers(response.suppliers || []);
            }
        } catch (error) {
            console.error('Error loading suppliers:', error);
        }
    };

    const loadPurchaseOrders = async () => {
        try {
            setLoading(true);
            const response = await purchaseOrderService.getPurchaseOrders(token, selectedCompany.id, filters);
            if (response.success) {
                setPurchaseOrders(response.data.purchaseOrders);
            }
        } catch (error) {
            console.error('Error loading POs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (e, po) => {
        e.stopPropagation(); // Prevent card click
        setPoToDelete(po);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!poToDelete) return;
        try {
            await purchaseOrderService.deletePurchaseOrder(token, selectedCompany.id, poToDelete.id);
            setDeleteDialogOpen(false);
            setPoToDelete(null);
            loadPurchaseOrders(); // Refresh list
        } catch (error) {
            console.error('Error deleting PO:', error);
            alert('Error al eliminar la orden');
        }
    };

    const handleStatusChange = async (e, po, newStatus) => {
        e.stopPropagation();
        try {
            // Optimistic update or refresh? Refresh is safer.
            await purchaseOrderService.updatePOStatus(token, selectedCompany.id, po.id, newStatus);
            loadPurchaseOrders();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error al actualizar estado');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'draft': return 'bg-slate-500/10 text-slate-500 bordivide-border/20';
            case 'approval': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'approved': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'sent': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
            case 'partial_received': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'received': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'closed': return 'bg-slate-700/10 text-muted-foreground border-slate-700/20';
            case 'finalized': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'cancelled':
            case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-slate-500/10 text-slate-500';
        }
    };

    const statusOptions = [
        { value: 'draft', label: 'Borrador' },
        { value: 'approval', label: 'En Aprobación' },
        { value: 'approved', label: 'Aprobada' },
        { value: 'sent', label: 'Enviada' },
        { value: 'received', label: 'Recibida' },
        { value: 'finalized', label: 'Finalizada' },
        { value: 'cancelled', label: 'Cancelada' },
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Órdenes de Compra</h1>
                    <p className="text-muted-foreground">Gestiona tus compras y recepciones de inventario</p>
                </div>
                <Button onClick={() => navigate('/purchase-orders/new')} className="bg-primary-600 hover:bg-primary-700 text-foreground">
                    <Plus size={20} className="mr-2" />
                    Nueva Orden
                </Button>
            </div>

            {/* Filters */}
            <Card className="bg-card/50 border-border backdrop-blur-sm">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                            placeholder="Buscar por # o proveedor..."
                            className="pl-10 bg-background border-border"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>
                    <select
                        className="bg-background border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary-500"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">Todos los estados</option>
                        {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <select
                        className="bg-background border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary-500"
                        value={filters.supplierId}
                        onChange={(e) => setFilters({ ...filters, supplierId: e.target.value })}
                    >
                        <option value="">Todos los proveedores</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </CardContent>
            </Card>

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {purchaseOrders.map(po => (
                    <Card
                        key={po.id}
                        className="bg-card/50 border-border hover:border-primary transition-colors cursor-pointer group"
                        onClick={() => navigate(`/purchase-orders/${po.id}`)}
                    >
                        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="p-3 bg-muted rounded-lg group-hover:bg-muted/80 transition-colors">
                                    <ShoppingBag className="text-primary" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground text-lg">{po.orderNumber}</h3>
                                    <p className="text-muted-foreground text-sm">{po.supplier?.name}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {po.issueDate}
                                        </span>
                                        <span>•</span>
                                        <span>Items: {po.items?.length || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Status Selector */}
                                <div onClick={(e) => e.stopPropagation()}>
                                    <select
                                        className={`px-2 py-1 rounded-full text-xs font-medium border bg-transparent outline-none cursor-pointer ${getStatusColor(po.status)}`}
                                        value={po.status}
                                        onChange={(e) => handleStatusChange(e, po, e.target.value)}
                                    >
                                        {statusOptions.map(opt => (
                                            <option key={opt.value} value={opt.value} className="bg-card text-foreground">
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <span className="text-foreground font-bold text-lg w-24 text-right">
                                    ${parseFloat(po.total).toFixed(2)}
                                </span>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {po.status === 'draft' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:text-foreground"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log('Edit clicked for PO:', po);
                                                if (po && po.id) {
                                                    navigate(`/purchase-orders/${po.id}/edit`);
                                                }
                                            }}
                                        >
                                            <Edit size={18} />
                                        </Button>
                                    )}

                                    {(po.status === 'draft' || po.status === 'cancelled') && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                            onClick={(e) => handleDeleteClick(e, po)}
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {purchaseOrders.length === 0 && !loading && (
                    <div className="text-center py-12 text-muted-foreground">
                        No se encontraron órdenes de compra
                    </div>
                )}
            </div>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="bg-card border-border text-foreground">
                    <DialogHeader>
                        <DialogTitle>Eliminar Orden de Compra</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            ¿Está seguro que desea eliminar la orden <strong>{poToDelete?.orderNumber}</strong>?
                            Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            className="border-border text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-foreground"
                        >
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
