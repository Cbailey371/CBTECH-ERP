import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Box, CheckCircle, XCircle, Send, Edit, Play } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/Dialog";
import { purchaseOrderService } from '../../services/purchaseOrderService';

export default function PurchaseOrderDetail() {
    const { token, selectedCompany } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();

    const [loading, setLoading] = useState(true);
    const [po, setPo] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Reception Modal State
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const [receptionItems, setReceptionItems] = useState([]); // { itemId, maxQty, receiveQty }

    useEffect(() => {
        if (selectedCompany && id) {
            loadPO();
        }
    }, [selectedCompany, id]);

    const loadPO = async () => {
        try {
            setLoading(true);
            const response = await purchaseOrderService.getPurchaseOrder(token, id);
            if (response.success) {
                setPo(response.data);
            }
        } catch (error) {
            console.error('Error loading PO:', error);
            navigate('/purchase-orders');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!confirm(`¿Está seguro de cambiar el estado a ${newStatus}?`)) return;

        setActionLoading(true);
        try {
            await purchaseOrderService.updatePOStatus(token, id, newStatus);
            loadPO();
        } catch (error) {
            console.error('Error changing status:', error);
            alert('Error al cambiar el estado');
        } finally {
            setActionLoading(false);
        }
    };

    const openReceiveModal = () => {
        // Initialize reception items with remaining quantities
        const itemsToReceive = po.items.map(item => ({
            itemId: item.id,
            description: item.description,
            ordered: parseFloat(item.quantity),
            received: parseFloat(item.receivedQuantity),
            remaining: parseFloat(item.quantity) - parseFloat(item.receivedQuantity),
            receiveNow: 0 // Input field
        })).filter(i => i.remaining > 0);

        setReceptionItems(itemsToReceive);
        setIsReceiveModalOpen(true);
    };

    const handleReceiveSubmit = async () => {
        const itemsToSubmit = receptionItems
            .filter(i => parseFloat(i.receiveNow) > 0)
            .map(i => ({
                itemId: i.itemId,
                quantityReceived: parseFloat(i.receiveNow)
            }));

        if (itemsToSubmit.length === 0) {
            alert('Ingrese al menos una cantidad para recibir');
            return;
        }

        setActionLoading(true);
        try {
            await purchaseOrderService.receivePOItems(token, id, itemsToSubmit);
            setIsReceiveModalOpen(false);
            loadPO();
        } catch (error) {
            console.error('Error receiving items:', error);
            alert('Error al registrar recepción');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading || !po) return <div className="p-8 text-foreground">Cargando...</div>;

    const getStatusBadge = (status) => {
        const styles = {
            draft: 'bg-muted text-muted-foreground border-border',
            approval: 'bg-warning/10 text-warning border-warning/20',
            approved: 'bg-info/10 text-info border-info/20',
            sent: 'bg-primary/10 text-primary border-primary/20',
            partial_received: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
            received: 'bg-success/10 text-success border-success/20',
            closed: 'bg-secondary/10 text-secondary-foreground border-border',
            cancelled: 'bg-destructive/10 text-destructive border-destructive/20'
        };
        const labels = {
            draft: 'Borrador',
            approval: 'En Aprobación',
            approved: 'Aprobada',
            sent: 'Enviada',
            partial_received: 'Parcialmente Recibida',
            received: 'Recibida',
            closed: 'Cerrada',
            cancelled: 'Cancelada'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.draft}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/purchase-orders')} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-foreground">{po.orderNumber}</h1>
                            {getStatusBadge(po.status)}
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">{po.supplier.name} • {po.issueDate}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="border-border text-foreground hover:bg-accent">
                        <Printer size={16} className="mr-2" />
                        Imprimir
                    </Button>

                    {po.status === 'draft' && (
                        <>
                            <Button variant="outline" onClick={() => navigate(`/purchase-orders/${id}/edit`)} className="border-border text-foreground hover:bg-accent">
                                <Edit size={16} className="mr-2" />
                                Editar
                            </Button>
                            <Button onClick={() => handleStatusChange('approval')} disabled={actionLoading} className="bg-warning hover:bg-warning/90 text-warning-foreground">
                                <Play size={16} className="mr-2" />
                                Solicitar Aprobación
                            </Button>
                        </>
                    )}

                    {po.status === 'approval' && (
                        <Button onClick={() => handleStatusChange('approved')} disabled={actionLoading} className="bg-success hover:bg-success/90 text-success-foreground">
                            <CheckCircle size={16} className="mr-2" />
                            Aprobar
                        </Button>
                    )}

                    {po.status === 'approved' && (
                        <Button onClick={() => handleStatusChange('sent')} disabled={actionLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Send size={16} className="mr-2" />
                            Marcar Enviada
                        </Button>
                    )}

                    {['sent', 'partial_received'].includes(po.status) && (
                        <Button onClick={openReceiveModal} disabled={actionLoading} className="bg-orange-600 hover:bg-orange-700 text-white">
                            <Box size={16} className="mr-2" />
                            Recibir Mercancía
                        </Button>
                    )}

                    {['received', 'partial_received'].includes(po.status) && po.status !== 'closed' && (
                        <Button variant="outline" onClick={() => handleStatusChange('closed')} disabled={actionLoading} className="border-border text-foreground hover:bg-accent">
                            <CheckCircle size={16} className="mr-2" />
                            Cerrar Orden
                        </Button>
                    )}
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card/50 border-border">
                    <CardHeader><CardTitle className="text-foreground text-sm">Proveedor</CardTitle></CardHeader>
                    <CardContent className="text-muted-foreground">
                        <p className="font-bold text-foreground text-lg">{po.supplier.name}</p>
                        <p className="text-sm">RUC: {po.supplier.ruc}</p>
                        <p className="text-sm">Email: {po.supplier.email}</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 border-border">
                    <CardHeader><CardTitle className="text-foreground text-sm">Fechas y Términos</CardTitle></CardHeader>
                    <CardContent className="text-muted-foreground space-y-1">
                        <div className="flex justify-between"><span>Emisión:</span> <span className="text-foreground">{po.issueDate}</span></div>
                        <div className="flex justify-between"><span>Entrega:</span> <span className="text-foreground">{po.deliveryDate || '-'}</span></div>
                        <div className="flex justify-between"><span>Términos:</span> <span className="text-foreground">{po.paymentTerms || '-'}</span></div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 border-border">
                    <CardHeader><CardTitle className="text-foreground text-sm">Totales</CardTitle></CardHeader>
                    <CardContent className="space-y-1">
                        <div className="flex justify-between text-muted-foreground"><span>Subtotal:</span> <span>${parseFloat(po.subtotal).toFixed(2)}</span></div>
                        <div className="flex justify-between text-muted-foreground"><span>Impuestos:</span> <span>${parseFloat(po.taxTotal).toFixed(2)}</span></div>
                        <div className="flex justify-between text-foreground font-bold text-xl border-t border-border pt-2">
                            <span>Total:</span> <span>${parseFloat(po.total).toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Items Table */}
            <Card className="bg-card/50 border-border">
                <CardHeader><CardTitle className="text-foreground">Items</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-foreground">
                            <thead className="bg-card text-muted-foreground uppercase font-medium">
                                <tr>
                                    <th className="px-4 py-3">Producto</th>
                                    <th className="px-4 py-3 text-right">Cantidad</th>
                                    <th className="px-4 py-3 text-right">Recibido</th>
                                    <th className="px-4 py-3 text-right">Pendiente</th>
                                    <th className="px-4 py-3 text-right">Precio Unit.</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                </tr>

                            </thead>
                            <tbody className="divide-y divide-border">
                                {po.items.map((item) => {
                                    const qty = parseFloat(item.quantity);
                                    const received = parseFloat(item.receivedQuantity);
                                    const pending = Math.max(0, qty - received);
                                    const unitPrice = parseFloat(item.unitPrice);

                                    return (

                                        <tr key={item.id} className="hover:bg-accent/30">
                                            <td className="px-4 py-2">
                                                <div className="font-medium text-foreground">{item.description}</div>
                                                <div className="text-xs text-muted-foreground">{item.product?.code}</div>
                                            </td>
                                            <td className="px-4 py-2 text-right">{qty}</td>
                                            <td className="px-4 py-2 text-right text-success font-medium">{received}</td>
                                            <td className="px-4 py-2 text-right text-warning">{pending > 0 ? pending : '-'}</td>
                                            <td className="px-4 py-2 text-right">${unitPrice.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-right text-foreground">${(qty * unitPrice).toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {
                po.notes && (
                    <Card className="bg-card/50 border-border">
                        <CardHeader><CardTitle className="text-foreground text-sm">Notas</CardTitle></CardHeader>
                        <CardContent className="text-muted-foreground whitespace-pre-wrap">
                            {po.notes}
                        </CardContent>
                    </Card>
                )
            }

            {/* Reception Modal */}
            <Dialog open={isReceiveModalOpen} onOpenChange={setIsReceiveModalOpen}>
                <DialogContent className="max-w-3xl bg-card border-border max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Recibir Mercancía</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Ingrese las cantidades recibidas para cada item. Si deja el campo en 0, no se registrará recepción para ese item.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <table className="w-full text-left text-sm text-muted-foreground">
                            <thead className="bg-muted text-muted-foreground uppercase font-medium">
                                <tr>
                                    <th className="px-3 py-2">Producto</th>
                                    <th className="px-3 py-2 text-right">Pendiente</th>
                                    <th className="px-3 py-2 w-32 text-right">Recibir Ahora</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {receptionItems.map((item, idx) => (
                                    <tr key={item.itemId}>
                                        <td className="px-3 py-2 text-foreground">{item.description}</td>
                                        <td className="px-3 py-2 text-right">{item.remaining}</td>
                                        <td className="px-3 py-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                max={item.remaining}
                                                step="0.01"
                                                value={item.receiveNow}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const newItems = [...receptionItems];
                                                    newItems[idx].receiveNow = val;
                                                    setReceptionItems(newItems);
                                                }}
                                                className="bg-background border-border text-right h-8"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsReceiveModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                            Cancelar
                        </Button>
                        <Button onClick={handleReceiveSubmit} disabled={actionLoading} className="bg-orange-600 hover:bg-orange-700 text-white">
                            Confirmar Recepción
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div >
    );
}
