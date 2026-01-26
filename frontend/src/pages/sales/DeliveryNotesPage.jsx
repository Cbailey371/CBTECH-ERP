import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as deliveryNoteService from '../../services/deliveryNoteService';
import { Plus, Search, Eye, FileText, Download, Trash2, CheckCircle, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';

export default function DeliveryNotesPage() {
    const { token, selectedCompany } = useAuth();
    const navigate = useNavigate();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

    useEffect(() => {
        if (selectedCompany) fetchNotes();
    }, [selectedCompany, searchTerm, statusFilter]);

    const fetchNotes = async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                page,
                search: searchTerm,
                status: statusFilter
            };
            const response = await deliveryNoteService.getDeliveryNotes(token, selectedCompany.id, params);
            if (response.success) {
                setNotes(response.deliveryNotes);
                setPagination(response.pagination);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (id, number) => {
        try {
            const blob = await deliveryNoteService.downloadDeliveryNotePdf(token, selectedCompany.id, id);
            // downloadDeliveryNotePdf already returns the blob from axios response.data
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `NotaEntrega_${number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading PDF:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta nota de entrega?')) return;
        try {
            const response = await deliveryNoteService.deleteDeliveryNote(token, selectedCompany.id, id);
            if (response.success) {
                fetchNotes(pagination.page);
            }
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            const response = await deliveryNoteService.updateDeliveryNoteStatus(token, selectedCompany.id, id, status);
            if (response.success) {
                fetchNotes(pagination.page);
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'draft') return <Badge variant="outline" className="bg-muted text-muted-foreground border-border">Borrador</Badge>;
        if (status === 'delivered') return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Entregado</Badge>;
        return <Badge>{status}</Badge>;
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Notas de Entrega</h1>
                    <p className="text-muted-foreground mt-1">Gestiona las entregas de tus productos a clientes.</p>
                </div>
                <Button onClick={() => navigate('/delivery-notes/new')} className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" /> Nueva Nota
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
                            <select
                                className="flex h-9 w-full md:w-40 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Todos los Estados</option>
                                <option value="draft">Borrador</option>
                                <option value="delivered">Entregado</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Número</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-8">Cargando...</TableCell></TableRow>
                            ) : notes.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-8">No hay notas de entrega que coincidan con los filtros.</TableCell></TableRow>
                            ) : (
                                notes.map(note => (
                                    <TableRow key={note.id}>
                                        <TableCell className="font-medium">{note.number}</TableCell>
                                        <TableCell>{note.customer?.name}</TableCell>
                                        <TableCell>{new Date(note.date).toLocaleDateString()}</TableCell>
                                        <TableCell>{getStatusBadge(note.status)}</TableCell>
                                        <TableCell className="text-right flex justify-end gap-2">
                                            {note.status === 'draft' && (
                                                <Button variant="ghost" size="icon" onClick={() => handleUpdateStatus(note.id, 'delivered')} title="Marcar como Entregado">
                                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                </Button>
                                            )}
                                            {note.status === 'delivered' && (
                                                <Button variant="ghost" size="icon" onClick={() => handleUpdateStatus(note.id, 'draft')} title="Revertir a Borrador">
                                                    <RotateCcw className="w-4 h-4 text-amber-500" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={() => navigate(`/delivery-notes/${note.id}`)} title="Ver/Editar">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDownload(note.id, note.number)} title="Descargar PDF">
                                                <Download className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(note.id)} title="Eliminar" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="w-4 h-4" />
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
