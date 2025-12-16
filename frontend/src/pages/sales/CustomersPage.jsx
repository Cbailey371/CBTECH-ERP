import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import * as customerService from '../../services/customerService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import CustomerModal from '../../components/sales/CustomerModal';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/Dialog';

export default function CustomersPage() {
    const { token, selectedCompany } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current_page: 1,
        total_pages: 1,
        total_items: 0
    });

    // Delete state
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchCustomers = async (page = 1, search = '') => {
        if (!selectedCompany) return;
        setLoading(true);
        try {
            const response = await customerService.getCustomers(token, selectedCompany.id, { page, search });
            if (response.success) {
                setCustomers(response.customers);
                setPagination(response.pagination);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchCustomers(1, searchTerm);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, token, selectedCompany]);

    const handleCreate = () => {
        setCurrentCustomer(null);
        setIsModalOpen(true);
    };

    const handleEdit = (customer) => {
        setCurrentCustomer(customer);
        setIsModalOpen(true);
    };

    const handleDelete = (customer) => {
        setCustomerToDelete(customer);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!customerToDelete) return;

        setDeleting(true);
        try {
            await customerService.deleteCustomer(token, selectedCompany.id, customerToDelete.id);
            alert('Cliente eliminado exitosamente');
            setIsDeleteModalOpen(false);
            setCustomerToDelete(null);
            fetchCustomers(pagination.current_page, searchTerm);
        } catch (error) {
            console.error('Error deleting customer:', error);
            alert('Error al eliminar cliente');
        } finally {
            setDeleting(false);
        }
    };

    const handleStatusChange = async (customer, newStatus) => {
        // Optimistic update
        const updatedCustomers = customers.map(c =>
            c.id === customer.id ? { ...c, isActive: newStatus === 'true' } : c
        );
        setCustomers(updatedCustomers);

        try {
            // Check if updateCustomerStatus exists, otherwise use updateCustomer
            if (customerService.updateCustomerStatus) {
                await customerService.updateCustomerStatus(token, selectedCompany.id, customer.id, newStatus === 'true');
            } else {
                await customerService.updateCustomer(token, selectedCompany.id, customer.id, { ...customer, isActive: newStatus === 'true' });
            }
            fetchCustomers(pagination.current_page, searchTerm);
        } catch (error) {
            console.error('Error updating customer status:', error);
            alert('Error al actualizar estado del cliente');
            fetchCustomers(pagination.current_page, searchTerm); // Revert on error
        }
    };

    const handleSave = async (formData) => {
        setActionLoading(true);
        try {
            if (currentCustomer) {
                await customerService.updateCustomer(token, selectedCompany.id, currentCustomer.id, formData);
            } else {
                await customerService.createCustomer(token, selectedCompany.id, formData);
            }
            setIsModalOpen(false);
            fetchCustomers(pagination.current_page, searchTerm);
        } catch (error) {
            console.error('Error saving customer:', error);
            alert(error.response?.data?.message || 'Error al guardar cliente');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Clientes</h1>
                    <p className="text-muted-foreground mt-1">Gestiona tu cartera de clientes y contactos.</p>
                </div>
                <Button onClick={handleCreate} className="bg-primary-600 hover:bg-primary-700 text-foreground shadow-lg shadow-primary-900/20">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Cliente
                </Button>
            </div>

            <Card className="bg-card border-border shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-xl font-semibold text-foreground">Lista de Clientes</CardTitle>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar clientes..."
                            className="pl-9 pr-4 py-2 w-[300px] bg-input border-border text-foreground"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-muted/50 border-border">
                                    <TableHead className="text-muted-foreground">Código</TableHead>
                                    <TableHead className="text-muted-foreground">Razón Social / Nombre</TableHead>
                                    <TableHead className="text-muted-foreground">RUC</TableHead>
                                    <TableHead className="text-muted-foreground">Contacto</TableHead>
                                    <TableHead className="text-muted-foreground">Estado</TableHead>
                                    <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Cargando clientes...
                                        </TableCell>
                                    </TableRow>
                                ) : customers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No se encontraron clientes.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    customers.map((customer) => (
                                        <TableRow key={customer.id} className="hover:bg-muted/50 border-border transition-colors">
                                            <TableCell className="text-muted-foreground font-mono text-sm">{customer.code || '-'}</TableCell>
                                            <TableCell className="font-medium text-foreground">
                                                <div className="font-bold">{customer.name}</div>
                                                <div className="text-xs text-muted-foreground">{customer.tradeName}</div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{customer.taxId}-{customer.dv}</TableCell>
                                            <TableCell className="text-foreground">
                                                <div className="text-xs">
                                                    <div className="text-foreground">{customer.email}</div>
                                                    <div className="text-muted-foreground">{customer.phone}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative inline-block">
                                                    <Badge className={customer.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                                                        {customer.isActive ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                    <select
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        value={customer.isActive ? "true" : "false"}
                                                        onChange={(e) => handleStatusChange(customer, e.target.value)}
                                                    >
                                                        <option value="true">Activo</option>
                                                        <option value="false">Inactivo</option>
                                                    </select>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDelete(customer)}
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

                    <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                        <div>
                            Mostrando {customers.length} de {pagination.total_items} clientes
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchCustomers(pagination.current_page - 1, searchTerm)}
                                disabled={pagination.current_page === 1}
                                className="border-input hover:bg-accent text-foreground"
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchCustomers(pagination.current_page + 1, searchTerm)}
                                disabled={pagination.current_page === pagination.total_pages}
                                className="border-input hover:bg-accent text-foreground"
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <CustomerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                customer={currentCustomer}
                loading={actionLoading}
            />

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-background border-border text-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Eliminar Cliente</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            ¿Está seguro que desea eliminar al cliente "{customerToDelete?.firstName} {customerToDelete?.lastName}"? Esta acción no se puede deshacer.
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
        </div >
    );
}
