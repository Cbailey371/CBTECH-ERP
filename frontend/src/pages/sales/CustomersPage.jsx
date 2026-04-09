import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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
import { FileText } from 'lucide-react';
import paymentService from '../../services/paymentService';
import { generateStatementPDF } from '../../utils/StatementPDF';

export default function CustomersPage() {
    const { token, selectedCompany } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
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

    const fetchCustomers = async (page = 1, search = '', status = 'all') => {
        if (!selectedCompany) return;
        setLoading(true);
        try {
            const params = { page, search };
            if (status !== 'all') params.is_active = status === 'active';

            const response = await customerService.getCustomers(params);
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
            fetchCustomers(1, searchTerm, filterStatus);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, filterStatus, token, selectedCompany]);

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
            await customerService.deleteCustomer(customerToDelete.id);
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
                await customerService.updateCustomerStatus(customer.id, newStatus === 'true');
            } else {
                await customerService.updateCustomer(customer.id, { ...customer, isActive: newStatus === 'true' });
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
                await customerService.updateCustomer(currentCustomer.id, formData);
            } else {
                await customerService.createCustomer(formData);
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

    const handleDownloadStatement = async (customer) => {
        // Prevent multiple clicks if needed, or simple loading toast
        if (!confirm(`¿Generar Estado de Cuenta para ${customer.name}?`)) return;

        try {
            console.log('Fetching statement for customer:', customer.id);
            const data = await paymentService.getStatement(token, selectedCompany.id, customer.id);
            console.log('Statement API Response:', data);

            if (data.success) {
                try {
                    console.log('Generating PDF with data:', data.data);
                    generateStatementPDF(data.data, selectedCompany);
                } catch (pdfError) {
                    console.error('PDF Generation Error:', pdfError);
                    alert('Error generando el archivo PDF: ' + pdfError.message);
                }
            } else {
                console.warn('API returned success:false', data);
                alert('No se pudo obtener la información: ' + (data.message || 'Error desconocido'));
            }
        } catch (error) {
            console.error('API Call Error:', error);
            const msg = error.message || (error.code ? `Error Code: ${error.code}` : 'Error de conexión');
            alert('Error al generar estado de cuenta: ' + msg);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1 md:px-0">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Clientes</h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">Gestione su cartera de clientes y contactos de forma eficiente.</p>
                </div>
                <Button 
                    onClick={handleCreate} 
                    className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 h-11 md:h-10"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Nuevo Cliente
                </Button>
            </div>

            <Card className="bg-card/50 border-border backdrop-blur-sm shadow-md">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-48">
                        <select
                            className="w-full h-11 md:h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/50 outline-none appearance-none"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">Todos los Estados</option>
                            <option value="active">Solo Activos</option>
                            <option value="inactive">Solo Inactivos</option>
                        </select>
                    </div>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre, RUC o código..."
                            className="pl-10 pr-4 h-11 md:h-10 w-full bg-background border-input text-foreground rounded-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {loading && customers.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground animate-pulse">Cargando clientes...</div>
            ) : customers.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-xl border-2 border-border border-dashed mx-1">
                    <Search size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-lg font-medium">No se encontraron clientes</p>
                    <p className="text-sm opacity-60">Intenta ajustar los términos de búsqueda o filtros</p>
                </div>
            ) : (
                <>
                    {/* Desktop View */}
                    <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-muted/50 border-border">
                                    <TableHead className="w-[120px]">Código</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>ID Fiscal / RUC</TableHead>
                                    <TableHead>Contacto</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.map((customer) => (
                                    <TableRow key={customer.id} className="hover:bg-muted/50 border-border transition-colors group">
                                        <TableCell className="text-muted-foreground font-mono text-xs">{customer.code || '-'}</TableCell>
                                        <TableCell className="font-medium">
                                            <div className="font-bold text-foreground group-hover:text-primary transition-colors">{customer.name}</div>
                                            <div className="text-xs text-muted-foreground">{customer.tradeName}</div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground font-medium">{customer.taxId}-{customer.dv}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="text-sm text-foreground">{customer.email || '-'}</div>
                                                <div className="text-xs text-muted-foreground">{customer.phone || '-'}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="relative inline-block">
                                                <Badge className={customer.isActive ? 'bg-emerald-500/10 text-emerald-400 border-none' : 'bg-destructive/10 text-destructive border-none'}>
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
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDownloadStatement(customer)} className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" title="Estado de Cuenta">
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(customer)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-4 px-1">
                        {customers.map((customer) => (
                            <Card key={customer.id} className="bg-card/50 border-border active:scale-[0.98] transition-all overflow-hidden shadow-sm">
                                <div className="p-4 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase">
                                                    {customer.code || 'CLI'}
                                                </span>
                                                <div className="relative">
                                                    <Badge className={customer.isActive ? 'bg-emerald-500/10 text-emerald-400 border-none text-[10px] py-0 h-5' : 'bg-destructive/10 text-destructive border-none text-[10px] py-0 h-5'}>
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
                                            </div>
                                            <h3 className="text-base font-bold text-foreground leading-tight">{customer.name}</h3>
                                            <p className="text-[11px] text-muted-foreground line-clamp-1">{customer.tradeName}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)} className="h-8 w-8">
                                                <Pencil size={16} className="text-muted-foreground" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs border-y border-border/50 py-3">
                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground/70">ID Fiscal / RUC</span>
                                            <p className="text-foreground font-mono">{customer.taxId}-{customer.dv}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground/70">Contacto</span>
                                            <a href={`tel:${customer.phone}`} className="text-primary font-bold block">{customer.phone || 'N/A'}</a>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-1">
                                        <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                                            {customer.email || 'Sin correo registrado'}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleDownloadStatement(customer)} 
                                                className="h-9 px-3 text-xs font-semibold border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                                            >
                                                <FileText className="h-4 w-4 mr-1.5" /> Estado
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleDelete(customer)} 
                                                className="h-9 w-9 text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                        <div>
                            Mostrando {customers.length} de {pagination.total_items} clientes
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchCustomers(pagination.current_page - 1, searchTerm, filterStatus)}
                                disabled={pagination.current_page === 1}
                                className="border-input hover:bg-accent text-foreground"
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchCustomers(pagination.current_page + 1, searchTerm, filterStatus)}
                                disabled={pagination.current_page === pagination.total_pages}
                                className="border-input hover:bg-accent text-foreground"
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                </>
            )}

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
        </div>
    );
}
