import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
            const queryParams = new URLSearchParams();
            if (searchTerm) queryParams.append('search', searchTerm);
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);
            if (statusFilter && statusFilter !== 'all') queryParams.append('status', statusFilter);

            const baseUrl = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${baseUrl}/api/credit-notes?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'x-company-id': selectedCompany.id
                }
            });
            const data = await response.json();
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
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Notas de Crédito</h1>
                <Button onClick={() => navigate('/credit-notes/new')} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Nota de Crédito
                </Button>
            </div>

            <Card className="border-border bg-card">
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por número, cliente o factura..."
                                className="pl-9 w-full bg-background border-input text-foreground"
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
                                <option value="all">Todos</option>
                                <option value="draft">Borrador</option>
                                <option value="authorized">Fiscalizada</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-border">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="text-muted-foreground">Número</TableHead>
                                    <TableHead className="text-muted-foreground">Cliente</TableHead>
                                    <TableHead className="text-muted-foreground">Factura Ref.</TableHead>
                                    <TableHead className="text-muted-foreground">Fecha</TableHead>
                                    <TableHead className="text-right text-muted-foreground">Total</TableHead>
                                    <TableHead className="text-center text-muted-foreground">Estado</TableHead>
                                    <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            Cargando notas de crédito...
                                        </TableCell>
                                    </TableRow>
                                ) : creditNotes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No se encontraron notas de crédito.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    creditNotes.map((note) => (
                                        <TableRow key={note.id} className="border-border hover:bg-muted/50">
                                            <TableCell className="font-medium text-foreground">{note.number}</TableCell>
                                            <TableCell className="text-muted-foreground">{note.customer?.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{note.salesOrder?.orderNumber}</TableCell>
                                            <TableCell className="text-muted-foreground">{new Date(note.date).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right font-mono text-foreground">
                                                ${Number(note.total).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-center">{statusBadge(note.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => navigate(`/credit-notes/${note.id}`)}>
                                                    Ver
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreditNotesPage;
