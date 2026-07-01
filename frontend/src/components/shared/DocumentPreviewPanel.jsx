import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../ui/Dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Badge } from '../ui/Badge';

export default function DocumentPreviewPanel({ 
    isOpen, 
    onClose, 
    document, 
    title = 'Vista Previa de Documento'
}) {
    if (!document) return null;

    const getStatusBadge = (status) => {
        const styles = {
            draft: 'bg-muted text-muted-foreground',
            sent: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            accepted: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            rejected: 'bg-destructive/10 text-destructive border-destructive/20',
            expired: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
            invoiced: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
            paid: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            partial: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
            delivered: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            applied: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        };
        const labels = {
            draft: 'Borrador',
            sent: 'Enviado',
            accepted: 'Aceptado',
            rejected: 'Rechazado',
            expired: 'Vencido',
            invoiced: 'Facturado',
            pending: 'Pendiente',
            paid: 'Pagado',
            partial: 'Abonado',
            cancelled: 'Anulado',
            delivered: 'Entregado',
            applied: 'Aplicada',
        };

        return (
            <Badge variant="outline" className={styles[status] || 'bg-muted text-muted-foreground'}>
                {labels[status] || status}
            </Badge>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden bg-background border-border">
                <DialogHeader className="border-b border-border pb-4">
                    <div className="flex justify-between items-center pr-8">
                        <DialogTitle className="text-xl font-bold flex items-center gap-3">
                            {title}
                            <span className="text-primary font-mono">{document.number}</span>
                        </DialogTitle>
                        {getStatusBadge(document.status)}
                    </div>
                    <DialogDescription className="text-muted-foreground mt-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">Cliente</p>
                                <p className="font-medium text-foreground">{document.customer?.name || 'Cliente Genérico'}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">Fecha</p>
                                <p className="font-medium text-foreground">
                                    {new Date(document.date).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">Moneda</p>
                                <p className="font-medium text-foreground">{document.currency || 'USD'}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">Total</p>
                                <p className="font-bold text-foreground text-lg">${parseFloat(document.total || 0).toFixed(2)}</p>
                            </div>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto py-4">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="w-[100px]">Código</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="text-right">Cant.</TableHead>
                                <TableHead className="text-right">Precio</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(document.items || []).length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                        No se encontraron ítems detallados o se deben cargar al editar.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                (document.items || []).map((item, index) => (
                                    <TableRow key={index} className="border-border">
                                        <TableCell className="font-medium text-xs">
                                            {item.product?.sku || item.product?.code || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="line-clamp-2" title={item.description || item.product?.description}>
                                                {item.description || item.product?.description}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">{parseFloat(item.quantity).toFixed(2)}</TableCell>
                                        <TableCell className="text-right">${parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-medium">${parseFloat(item.total).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="border-t border-border pt-4 bg-muted/20 px-6 py-4 -mx-6 -mb-6">
                    <div className="flex justify-end gap-8">
                        <div className="space-y-2 text-right text-sm">
                            <p className="text-muted-foreground">Subtotal:</p>
                            {parseFloat(document.discount || 0) > 0 && <p className="text-muted-foreground">Descuento:</p>}
                            {parseFloat(document.tax || 0) > 0 && <p className="text-muted-foreground">Impuesto:</p>}
                            <p className="text-foreground font-bold text-base mt-2 pt-2 border-t border-border">Total:</p>
                        </div>
                        <div className="space-y-2 text-right text-sm font-medium">
                            <p className="text-foreground">${parseFloat(document.subtotal || 0).toFixed(2)}</p>
                            {parseFloat(document.discount || 0) > 0 && <p className="text-destructive">-${parseFloat(document.discount || 0).toFixed(2)}</p>}
                            {parseFloat(document.tax || 0) > 0 && <p className="text-foreground">${parseFloat(document.tax || 0).toFixed(2)}</p>}
                            <p className="text-primary font-bold text-base mt-2 pt-2 border-t border-border">
                                ${parseFloat(document.total || 0).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
