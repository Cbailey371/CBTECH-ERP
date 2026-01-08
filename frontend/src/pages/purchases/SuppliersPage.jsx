import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supplierService } from '../../services/supplierService';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Phone, Mail, MapPin, Building2, User, Trash2, Power, AlertTriangle, Edit } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Card, CardContent } from '../../components/ui/Card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/Dialog";

export default function SuppliersPage() {
    const { token, selectedCompany } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [supplierToDelete, setSupplierToDelete] = useState(null);

    const [filters, setFilters] = useState({
        search: '',
        is_active: ''
    });

    useEffect(() => {
        if (selectedCompany) {
            loadSuppliers();
        }
    }, [selectedCompany, filters]);

    const loadSuppliers = async () => {
        try {
            setLoading(true);
            const response = await supplierService.getSuppliers(token, selectedCompany.id, filters);
            if (response.success) {
                setSuppliers(response.suppliers);
            }
        } catch (error) {
            console.error('Error loading suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (e, supplier) => {
        e.stopPropagation();
        try {
            const newStatus = !supplier.isActive;
            const response = await supplierService.updateSupplier(token, selectedCompany.id, supplier.id, {
                ...supplier,
                isActive: newStatus
            });

            if (response.success) {
                setSuppliers(suppliers.map(s =>
                    s.id === supplier.id ? { ...s, isActive: newStatus } : s
                ));
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const confirmDelete = (e, supplier) => {
        e.stopPropagation();
        setSupplierToDelete(supplier);
    };

    const handleDelete = async () => {
        if (!supplierToDelete) return;

        try {
            const response = await supplierService.deleteSupplier(token, selectedCompany.id, supplierToDelete.id);
            if (response.success) {
                setSuppliers(suppliers.filter(s => s.id !== supplierToDelete.id));
                setSupplierToDelete(null);
            }
        } catch (error) {
            console.error('Error deleting supplier:', error);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Proveedores</h1>
                    <p className="text-muted-foreground">Gestiona los proveedores y compras de tu empresa</p>
                </div>
                <Button onClick={() => navigate('/suppliers/new')} className="bg-primary-600 hover:bg-primary-700 text-foreground">
                    <Plus size={20} className="mr-2" />
                    Nuevo Proveedor
                </Button>
            </div>

            {/* Filters */}
            <Card className="bg-card/50 border-border backdrop-blur-sm">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                            placeholder="Buscar por nombre, RUC, contacto, email..."
                            className="pl-10 bg-background border-input"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>
                    <select
                        className="bg-background border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary-500"
                        value={filters.is_active}
                        onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
                    >
                        <option value="">Todos los Estados</option>
                        <option value="true">Activos</option>
                        <option value="false">Inactivos</option>
                    </select>
                </CardContent>
            </Card>

            {/* List */}
            <div className="bg-card border border-border rounded-lg overflow-hidden backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-muted/50 border-border">
                            <TableHead className="text-muted-foreground">Código</TableHead>
                            <TableHead className="text-muted-foreground">Proveedor</TableHead>
                            <TableHead className="text-muted-foreground">RUC / DV</TableHead>
                            <TableHead className="text-muted-foreground">Contacto</TableHead>
                            <TableHead className="text-muted-foreground">Contacto Info</TableHead>
                            <TableHead className="text-muted-foreground">Estado</TableHead>
                            <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {suppliers.map(supplier => (
                            <TableRow
                                key={supplier.id}
                                className="hover:bg-muted/50 border-border transition-colors cursor-pointer group"
                                onClick={() => navigate(`/suppliers/${supplier.id}`)}
                            >
                                <TableCell className="text-muted-foreground font-mono text-sm">
                                    {supplier.code || '-'}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-secondary rounded-lg group-hover:bg-muted transition-colors">
                                            <Building2 className="text-primary" size={20} />
                                        </div>
                                        <span className="font-semibold text-foreground">{supplier.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground font-mono text-sm">
                                    {supplier.ruc}-{supplier.dv}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {supplier.contactName || '-'}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                        {supplier.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail size={14} /> {supplier.email}
                                            </div>
                                        )}
                                        {supplier.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone size={14} /> {supplier.phone}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${supplier.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                                        {supplier.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => handleToggleStatus(e, supplier)}
                                            className={supplier.isActive ? "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}
                                            title={supplier.isActive ? "Desactivar" : "Activar"}
                                        >
                                            <Power size={18} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/suppliers/${supplier.id}/edit`);
                                            }}
                                            className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => confirmDelete(e, supplier)}
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {suppliers.length === 0 && !loading && (
                    <div className="text-center py-12 text-muted-foreground">
                        No se encontraron proveedores con los filtros seleccionados
                    </div>
                )}
            </div>

            <Dialog open={!!supplierToDelete} onOpenChange={(open) => !open && setSupplierToDelete(null)}>
                <DialogContent className="bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground flex items-center gap-2">
                            <AlertTriangle className="text-red-500" size={24} />
                            Eliminar Proveedor
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            ¿Está seguro que desea eliminar al proveedor <span className="text-foreground font-medium">{supplierToDelete?.name}</span>?
                            Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setSupplierToDelete(null)}
                            className="text-slate-300 hover:text-foreground hover:bg-slate-800"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-foreground"
                        >
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
