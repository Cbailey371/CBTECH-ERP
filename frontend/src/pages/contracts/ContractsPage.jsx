import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { contractService } from '../../services/contractService';
import * as customerService from '../../services/customerService';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, AlertTriangle, FileText, Calendar, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/Dialog";

export default function ContractsPage() {
    const { token, selectedCompany } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [contracts, setContracts] = useState([]);
    const [customers, setCustomers] = useState([]);

    const [filters, setFilters] = useState({
        search: '',
        status: '',
        customerId: '',
        expiringSoon: false
    });

    useEffect(() => {
        if (selectedCompany) {
            loadCustomers();

            const timer = setTimeout(() => {
                loadContracts();
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [selectedCompany, filters]); // Reload when filters change

    const loadCustomers = async () => {
        try {
            const response = await customerService.getCustomers(token, selectedCompany.id, { is_active: 'true' });
            if (response.success) {
                setCustomers(response.customers);
            }
        } catch (error) {
            console.error('Error loading customers:', error);
        }
    };

    const loadContracts = async () => {
        try {
            setLoading(true);
            const response = await contractService.getContracts(token, selectedCompany.id, filters);
            if (response.success) {
                setContracts(response.contracts);
            }
        } catch (error) {
            console.error('Error loading contracts:', error);
        } finally {
            setLoading(false);
        }
    };

    const [contractToDelete, setContractToDelete] = useState(null);

    const handleStatusChange = async (contractId, newStatus) => {
        try {
            // Optimistic update
            setContracts(contracts.map(c =>
                c.id === contractId ? { ...c, status: newStatus } : c
            ));

            const response = await contractService.updateContract(token, selectedCompany.id, contractId, { status: newStatus });

            if (!response.success) {
                // Revert on failure
                loadContracts();
                alert('Error al actualizar el estado: ' + response.message);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            loadContracts();
        }
    };

    const confirmDelete = (e, contract) => {
        e.stopPropagation();
        setContractToDelete(contract);
    };

    const handleDelete = async () => {
        if (!contractToDelete) return;

        try {
            const response = await contractService.deleteContract(token, selectedCompany.id, contractToDelete.id);
            if (response.success) {
                setContracts(contracts.filter(c => c.id !== contractToDelete.id));
                setContractToDelete(null);
            } else {
                alert('Error al eliminar el contrato: ' + response.message);
            }
        } catch (error) {
            console.error('Error deleting contract:', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'draft': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
            case 'expired': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'cancelled': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            default: return 'bg-slate-500/10 text-slate-500';
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            draft: 'Borrador',
            active: 'Activo',
            expired: 'Vencido',
            cancelled: 'Cancelado'
        };
        return labels[status] || status;
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
                    <p className="text-muted-foreground">Gestiona los contratos y suscripciones de tus clientes</p>
                </div>
                <Button onClick={() => navigate('/contracts/new')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus size={20} className="mr-2" />
                    Nuevo Contrato
                </Button>
            </div>

            {/* Filters */}
            <Card className="bg-card border-border backdrop-blur-sm">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                            placeholder="Buscar contrato..."
                            className="pl-10 bg-background border-input"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>
                    <select
                        className="bg-background border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">Todos los estados</option>
                        <option value="draft">Borrador</option>
                        <option value="active">Activo</option>
                        <option value="expired">Vencido</option>
                        <option value="cancelled">Cancelado</option>
                    </select>
                    <select
                        className="bg-background border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
                        value={filters.customerId}
                        onChange={(e) => setFilters({ ...filters, customerId: e.target.value })}
                    >
                        <option value="">Todos los clientes</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <div className="flex items-center gap-2 px-2 border border-border rounded-lg bg-background">
                        <input
                            type="checkbox"
                            id="expiring"
                            checked={filters.expiringSoon}
                            onChange={(e) => setFilters({ ...filters, expiringSoon: e.target.checked })}
                            className="rounded border-input bg-background text-primary focus:ring-ring"
                        />
                        <label htmlFor="expiring" className="text-muted-foreground text-sm cursor-pointer select-none flex items-center gap-2">
                            <AlertTriangle size={16} className="text-yellow-500" />
                            Vence pronto
                        </label>
                    </div>
                </CardContent>
            </Card>

            {/* List */}
            <div className="bg-card border border-border rounded-lg overflow-hidden backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-muted/50 border-border">
                            <TableHead className="text-muted-foreground">Código / Título</TableHead>
                            <TableHead className="text-muted-foreground">Cliente</TableHead>
                            <TableHead className="text-muted-foreground">Vigencia</TableHead>
                            <TableHead className="text-muted-foreground">Ciclo</TableHead>
                            <TableHead className="text-right text-muted-foreground">Valor</TableHead>
                            <TableHead className="text-muted-foreground">Estado</TableHead>
                            <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contracts.map(contract => (
                            <TableRow
                                key={contract.id}
                                className="hover:bg-muted/50 border-border transition-colors cursor-pointer group"
                                onClick={() => navigate(`/contracts/${contract.id}`)}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-secondary rounded-lg group-hover:bg-muted transition-colors">
                                            <FileText className="text-primary" size={20} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-foreground">{contract.title}</div>
                                            {contract.code && <div className="text-xs font-mono text-muted-foreground">{contract.code}</div>}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-foreground">
                                    {contract.customer?.name}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar size={14} />
                                        <span>{contract.startDate} - {contract.endDate || 'Indefinido'}</span>
                                    </div>
                                    {contract.renewalType === 'auto' && (
                                        <div className="text-xs text-emerald-500 mt-1">Renovación Auto</div>
                                    )}
                                </TableCell>
                                <TableCell className="capitalize text-muted-foreground">
                                    {contract.billingCycle === 'one_time' ? 'Pago Único' : contract.billingCycle}
                                </TableCell>
                                <TableCell className="text-right font-medium text-foreground">
                                    ${parseFloat(contract.value).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <select
                                            value={contract.status}
                                            onChange={(e) => handleStatusChange(contract.id, e.target.value)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background ${getStatusColor(contract.status)}`}
                                            style={{ backgroundImage: 'none', textAlignLast: 'center' }}
                                        >
                                            <option value="draft">Borrador</option>
                                            <option value="active">Activo</option>
                                            <option value="expired">Vencido</option>
                                            <option value="cancelled">Cancelado</option>
                                        </select>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => confirmDelete(e, contract)}
                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {contracts.length === 0 && !loading && (
                    <div className="text-center py-12 text-muted-foreground">
                        No se encontraron contratos con los filtros seleccionados
                    </div>
                )}
            </div>

            <Dialog open={!!contractToDelete} onOpenChange={(open) => !open && setContractToDelete(null)}>
                <DialogContent className="bg-slate-900 border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <AlertTriangle className="text-red-500" size={24} />
                            Eliminar Contrato
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            ¿Está seguro que desea eliminar el contrato <span className="text-white font-medium">{contractToDelete?.title}</span>?
                            Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setContractToDelete(null)}
                            className="text-slate-300 hover:text-white hover:bg-slate-800"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
