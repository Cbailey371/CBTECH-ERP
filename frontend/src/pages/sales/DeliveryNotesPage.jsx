import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as deliveryNoteService from '../../services/deliveryNoteService';
import { Plus, Search, Eye, FileText, Download, Trash2, CheckCircle, RotateCcw, PenTool } from 'lucide-react';
import SignaturePad from '../../components/SignaturePad';
import { Dialog, DialogContent } from '@mui/material';
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
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [selectedNoteForSignature, setSelectedNoteForSignature] = useState(null);

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

    const handleSaveSignature = async (data) => {
        try {
            const response = await deliveryNoteService.saveSignature(token, selectedCompany.id, selectedNoteForSignature.id, data);
            if (response.success) {
                setIsSignatureModalOpen(false);
                setSelectedNoteForSignature(null);
                fetchNotes(pagination.page);
                alert('Firma guardada correctamente.');
            }
        } catch (error) {
            console.error('Error saving signature:', error);
            alert('Error al guardar la firma.');
        }
    };

    const openSignatureModal = (note) => {
        setSelectedNoteForSignature(note);
        setIsSignatureModalOpen(true);
    };

    const getStatusBadge = (status) => {
        if (status === 'draft') return <Badge variant="outline" className="bg-muted text-muted-foreground border-border">Borrador</Badge>;
        if (status === 'delivered') return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Entregado</Badge>;
        return <Badge>{status}</Badge>;
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Notas de Entrega</h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">Gestiona las entregas de tus productos a clientes.</p>
                </div>
                <Button onClick={() => navigate('/delivery-notes/new')} className="w-full sm:w-auto bg-primary hover:bg-primary/90 h-11">
                    <Plus className="w-4 h-4 mr-2" /> Nueva Nota
                </Button>
            </div>

            <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por número o cliente..."
                                className="pl-10 w-full h-11"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <select
                                className="flex h-11 w-full md:w-48 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
                <CardContent className="p-0 sm:p-6">
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
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
                                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-medium">No hay notas de entrega.</TableCell></TableRow>
                                ) : (
                                    notes.map(note => (
                                        <TableRow key={note.id} className="hover:bg-muted/50 transition-colors">
                                            <TableCell className="font-mono font-bold text-primary">{note.number}</TableCell>
                                            <TableCell className="font-medium">{note.customer?.name}</TableCell>
                                            <TableCell>{new Date(note.date).toLocaleDateString()}</TableCell>
                                            <TableCell>{getStatusBadge(note.status)}</TableCell>
                                            <TableCell className="text-right flex justify-end gap-1">
                                                {note.status === 'draft' && (
                                                    <Button variant="ghost" size="icon" onClick={() => handleUpdateStatus(note.id, 'delivered')} title="Marcar como Entregado" className="h-8 w-8 text-emerald-500 hover:bg-emerald-50">
                                                        <CheckCircle className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {note.status === 'delivered' && (
                                                    <Button variant="ghost" size="icon" onClick={() => handleUpdateStatus(note.id, 'draft')} title="Revertir a Borrador" className="h-8 w-8 text-amber-500 hover:bg-amber-50">
                                                        <RotateCcw className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" onClick={() => openSignatureModal(note)} title="Firmar Nota" className={`h-8 w-8 ${note.signature ? 'text-emerald-500 hover:bg-emerald-50' : 'text-blue-500 hover:bg-blue-50'}`}>
                                                    <PenTool className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => navigate(`/delivery-notes/${note.id}`)} title="Ver/Editar" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDownload(note.id, note.number)} title="Descargar PDF" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(note.id)} title="Eliminar" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-border">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando...</div>
                        ) : notes.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground font-medium">No hay registros disponibles.</div>
                        ) : (
                            notes.map(note => (
                                <div key={note.id} className="p-4 space-y-4 active:bg-muted/30 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-black text-lg text-primary">{note.number}</span>
                                                {getStatusBadge(note.status)}
                                            </div>
                                            <p className="font-bold text-foreground text-sm line-clamp-1">{note.customer?.name}</p>
                                            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                                <FileText size={12} /> {new Date(note.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => handleDownload(note.id, note.number)}
                                                className="p-2.5 bg-muted rounded-xl text-foreground active:scale-95 transition-transform"
                                            >
                                                <Download size={20} />
                                            </button>
                                            <button 
                                                onClick={() => navigate(`/delivery-notes/${note.id}`)}
                                                className="p-2.5 bg-primary/10 text-primary rounded-xl active:scale-95 transition-transform"
                                            >
                                                <Eye size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 pt-2">
                                        <div className="flex gap-2 flex-1">
                                            <button
                                                onClick={() => openSignatureModal(note)}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-sm ${
                                                    note.signature 
                                                        ? 'bg-emerald-500 text-white shadow-emerald-200' 
                                                        : 'bg-blue-600 text-white shadow-blue-200'
                                                }`}
                                            >
                                                <PenTool size={18} />
                                                {note.signature ? 'Firmada' : 'Firmar'}
                                            </button>

                                            {note.status === 'draft' ? (
                                                <button
                                                    onClick={() => handleUpdateStatus(note.id, 'delivered')}
                                                    className="aspect-square flex items-center justify-center p-3 bg-emerald-100 text-emerald-600 rounded-xl active:scale-95 transition-all"
                                                    title="Entregar"
                                                >
                                                    <CheckCircle size={22} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleUpdateStatus(note.id, 'draft')}
                                                    className="aspect-square flex items-center justify-center p-3 bg-amber-100 text-amber-600 rounded-xl active:scale-95 transition-all"
                                                    title="Revertir"
                                                >
                                                    <RotateCcw size={22} />
                                                </button>
                                            )}
                                        </div>
                                        
                                        <button 
                                            onClick={() => handleDelete(note.id)}
                                            className="p-3 text-muted-foreground hover:text-destructive active:bg-destructive/10 rounded-xl"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <Dialog 
                open={isSignatureModalOpen} 
                onClose={() => setIsSignatureModalOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogContent sx={{ p: 0 }}>
                    {selectedNoteForSignature && (
                        <SignaturePad 
                            onSave={handleSaveSignature}
                            onCancel={() => setIsSignatureModalOpen(false)}
                            noteNumber={selectedNoteForSignature.number}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
