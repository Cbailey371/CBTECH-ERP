import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Plus, Search, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';

const CreditNotesPage = () => {
    const [creditNotes, setCreditNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const { selectedCompany } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (selectedCompany) {
            fetchCreditNotes();
        }
    }, [selectedCompany, searchTerm, startDate, endDate, statusFilter]);

    const fetchCreditNotes = async () => {
        try {
            setLoading(true);
            const params = {
                search: searchTerm || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                status: (statusFilter && statusFilter !== 'all') ? statusFilter : undefined
            };

            const response = await api.get('/credit-notes', { params });
            const data = response.data;
            
            if (data.success) {
                setCreditNotes(data.creditNotes);
            }
        } catch (error) {
            console.error('Error fetching credit notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const statusBadge = (status) => {
        switch (status) {
            case 'authorized': return <Badge className="bg-green-500">Fiscalizada</Badge>;
            case 'draft': return <Badge variant="secondary">Borrador</Badge>;
            case 'cancelled': return <Badge variant="destructive">Cancelada</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Notas de Crédito</h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">Gestiona las devoluciones y ajustes de facturación.</p>
                </div>
                <Button onClick={() => navigate('/credit-notes/new')} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 h-11">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Nota
                </Button>
            </div>

            <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex flex-col gap-4">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por número, cliente o factura..."
                                className="pl-10 w-full h-11 bg-background"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto">
                            <div className="flex flex-col gap-1 col-span-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Desde</label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="h-10 text-xs md:text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1 col-span-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Hasta</label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-10 text-xs md:text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1 col-span-2 md:w-48">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Estado</label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">Todos los Estados</option>
                                    <option value="draft">Borrador</option>
                                    <option value="authorized">Fiscalizada</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Número</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Factura Ref.</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-center">Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-8">Cargando...</TableCell></TableRow>
                                ) : creditNotes.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-8">No se encontraron registros.</TableCell></TableRow>
                                ) : (
                                    creditNotes.map((note) => (
                                        <TableRow key={note.id} className="border-border hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-mono font-bold text-primary">{note.number}</TableCell>
                                            <TableCell className="font-medium">{note.customer?.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{note.salesOrder?.orderNumber}</TableCell>
                                            <TableCell>{new Date(note.date).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right font-bold">${Number(note.total).toFixed(2)}</TableCell>
                                            <TableCell className="text-center">{statusBadge(note.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => navigate(`/credit-notes/${note.id}`)} className="h-8">
                                                    Ver Detalle
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
                            <div className="p-10 text-center text-muted-foreground animate-pulse">Cargando...</div>
                        ) : creditNotes.length === 0 ? (
                            <div className="p-10 text-center text-muted-foreground font-medium">No se encontraron registros.</div>
                        ) : (
                            creditNotes.map((note) => (
                                <div 
                                    key={note.id} 
                                    className="p-4 space-y-3 active:bg-muted/30 transition-colors"
                                    onClick={() => navigate(`/credit-notes/${note.id}`)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-black text-lg text-primary">{note.number}</span>
                                                {statusBadge(note.status)}
                                            </div>
                                            <p className="font-bold text-foreground text-sm line-clamp-1">{note.customer?.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Total</p>
                                            <p className="text-lg font-black text-foreground">${Number(note.total).toFixed(2)}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-xs bg-muted/20 p-2 rounded-lg">
                                        <div className="flex items-center gap-1 text-muted-foreground font-medium">
                                            <FileText size={12} /> Factura: <span className="text-foreground">{note.salesOrder?.orderNumber || '-'}</span>
                                        </div>
                                        <div className="text-muted-foreground font-medium">
                                            {new Date(note.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreditNotesPage;
