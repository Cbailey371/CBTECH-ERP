import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import * as quotationService from '../../services/quotationService';
import { Plus, Search, Eye, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/Dialog';

export default function QuotationsPage() {
    const { token, selectedCompany } = useAuth();
    const navigate = useNavigate();
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        current_page: 1,
        total_pages: 1,
        total_items: 0
    });

    // Delete state
    const [quotationToDelete, setQuotationToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchQuotations = async (page = 1, search = '') => {
        if (!selectedCompany) return;
        setLoading(true);
        try {
            const response = await quotationService.getQuotations(token, selectedCompany.id, { page, search });
            if (response.success) {
                setQuotations(response.quotations);
                setPagination(response.pagination);
            }
        } catch (error) {
            console.error('Error fetching quotations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchQuotations(1, searchTerm);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, token, selectedCompany]);

    const handleStatusChange = async (quotation, newStatus) => {
        // Optimistic update
        const updatedQuotations = quotations.map(q =>
            q.id === quotation.id ? { ...q, status: newStatus } : q
        );
        setQuotations(updatedQuotations);

        try {
            await quotationService.updateQuotation(token, selectedCompany.id, quotation.id, { ...quotation, status: newStatus });
            fetchQuotations(pagination.current_page, searchTerm);
        } catch (error) {
            console.error('Error updating quotation status:', error);
            alert('Error al actualizar estado de la cotización');
            fetchQuotations(pagination.current_page, searchTerm); // Revert on error
        }
    };

    const handleDelete = (quotation) => {
        setQuotationToDelete(quotation);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!quotationToDelete) return;

        setDeleting(true);
        try {
            await quotationService.deleteQuotation(token, selectedCompany.id, quotationToDelete.id);
            alert('Cotización eliminada exitosamente');
            setIsDeleteModalOpen(false);
            setQuotationToDelete(null);
            fetchQuotations(pagination.current_page, searchTerm);
        } catch (error) {
            console.error('Error deleting quotation:', error);
            alert('Error al eliminar cotización');
        } finally {
            setDeleting(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            draft: 'bg-muted text-muted-foreground',
            sent: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            accepted: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            rejected: 'bg-destructive/10 text-destructive border-destructive/20',
            expired: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
        };
        const labels = {
            draft: 'Borrador',
            sent: 'Enviada',
            accepted: 'Aceptada',
            rejected: 'Rechazada',
            expired: 'Vencida'
        };

        return (
            <Badge variant="outline" className={styles[status] || 'bg-muted text-muted-foreground'}>
                {labels[status] || status}
            </Badge>
        );
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Cotizaciones</h1>
                    <p className="text-muted-foreground mt-1">Gestiona las cotizaciones y propuestas comerciales.</p>
                </div>
                <Button
                    onClick={() => navigate('/quotations/new')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Cotización
                </Button>
            </div>

            <Card className="bg-card border-border backdrop-blur-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center space-x-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por número o cliente..."
                                className="pl-9 bg-background border-input focus:border-ring transition-colors"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-muted/50 border-border">
                                    <TableHead className="text-muted-foreground">Número</TableHead>
                                    <TableHead className="text-muted-foreground">Cliente</TableHead>
                                    <TableHead className="text-muted-foreground">Fecha</TableHead>
                                    <TableHead className="text-muted-foreground">Total</TableHead>
                                    <TableHead className="text-muted-foreground">Estado</TableHead>
                                    <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Cargando cotizaciones...
                                        </TableCell>
                                    </TableRow>
                                ) : quotations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No se encontraron cotizaciones.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    quotations.map((quotation) => (
                                        <TableRow key={quotation.id} className="hover:bg-muted/50 border-border transition-colors">
                                            <TableCell className="font-medium text-foreground">
                                                {quotation.number}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {quotation.customer?.name}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(quotation.date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="font-medium text-foreground">
                                                ${parseFloat(quotation.total).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative inline-block">
                                                    {getStatusBadge(quotation.status)}
                                                    <select
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        value={quotation.status}
                                                        onChange={(e) => handleStatusChange(quotation, e.target.value)}
                                                    >
                                                        <option value="draft">Borrador</option>
                                                        <option value="sent">Enviada</option>
                                                        <option value="accepted">Aceptada</option>
                                                        <option value="rejected">Rechazada</option>
                                                        <option value="expired">Vencida</option>
                                                    </select>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => navigate(`/quotations/${quotation.id}`)}
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                        title="Ver detalle"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(quotation)}
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Paginación simple */}
                    <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                        <div>
                            Mostrando {quotations.length} de {pagination.total_items} resultados
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchQuotations(pagination.current_page - 1, searchTerm)}
                                disabled={pagination.current_page === 1}
                                className="border-input hover:bg-accent text-foreground"
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchQuotations(pagination.current_page + 1, searchTerm)}
                                disabled={pagination.current_page === pagination.total_pages}
                                className="border-input hover:bg-accent text-foreground"
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-background border-border text-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Eliminar Cotización</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            ¿Está seguro que desea eliminar la cotización "{quotationToDelete?.number}"? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} disabled={deleting} className="text-muted-foreground hover:text-foreground">
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-foreground border-0">
                            {deleting ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
