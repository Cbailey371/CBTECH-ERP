import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Plus, Search, Building2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import axios from 'axios';
import * as companyService from '../../services/companyService';
import CompanyModal from '../../components/admin/CompanyModal';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/Dialog';

export default function CompaniesPage() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCompany, setCurrentCompany] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Delete state
    const [companyToDelete, setCompanyToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const { token } = useAuth();

    const fetchCompanies = async () => {
        try {
            const params = { search };
            if (filterStatus && filterStatus !== 'all') params.is_active = filterStatus === 'active';

            const response = await companyService.getAllCompanies(params);
            if (response.success) {
                setCompanies(response.data.companies);
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCompanies();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, filterStatus]);

    const handleCreate = () => {
        setCurrentCompany(null);
        setIsModalOpen(true);
    };

    const handleEdit = (company) => {
        setCurrentCompany(company);
        setIsModalOpen(true);
    };

    const handleDelete = (company) => {
        setCompanyToDelete(company);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!companyToDelete) return;

        setDeleting(true);
        try {
            await companyService.deleteCompany(companyToDelete.id);
            alert('Empresa eliminada exitosamente');
            setIsDeleteModalOpen(false);
            setCompanyToDelete(null);
            fetchCompanies();
        } catch (error) {
            console.error('Error deleting company:', error);
            alert('Error al eliminar empresa');
        } finally {
            setDeleting(false);
        }
    };

    const handleStatusChange = async (company, newStatus) => {
        // Optimistic update
        const updatedCompanies = companies.map(c =>
            c.id === company.id ? { ...c, isActive: newStatus === 'true' } : c
        );
        setCompanies(updatedCompanies);

        try {
            // Note: Backend expects snake_case 'is_active' for this specific endpoint
            await companyService.updateCompany(company.id, { is_active: newStatus === 'true' });
            fetchCompanies();
        } catch (error) {
            console.error('Error updating company status:', error);
            alert('Error al actualizar estado de la empresa');
            fetchCompanies(); // Revert on error
        }
    };

    const handleSave = async (formData) => {
        setActionLoading(true);
        try {
            if (currentCompany) {
                await companyService.updateCompany(currentCompany.id, formData);
            } else {
                await companyService.createCompany(formData);
            }
            setIsModalOpen(false);
            fetchCompanies();
        } catch (error) {
            console.error('Error saving company:', error);
            alert(error.response?.data?.message || 'Error al guardar empresa');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-fadeIn pb-24 md:pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-1">Empresas</h1>
                    <p className="text-muted-foreground text-sm">Gestione las empresas registradas en su ecosistema ERP.</p>
                </div>
                <Button className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/20" onClick={handleCreate}>
                    <Plus className="h-4 w-4" /> Nueva Empresa
                </Button>
            </div>

            <Card className="bg-card/50 border-border backdrop-blur-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full lg:flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre, RUC o código..."
                                className="pl-10 bg-background/50 border-border w-full"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="w-full lg:w-48">
                            <select
                                className="w-full h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">Todos los Estados</option>
                                <option value="active">Activas</option>
                                <option value="inactive">Inactivas</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-muted-foreground">Cargando empresas...</p>
                    </div>
                ) : companies.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-2xl border border-border border-dashed backdrop-blur-sm">
                        <Building2 size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No se encontraron empresas</p>
                    </div>
                ) : (
                    <>
                        {/* Vista de Tarjetas para Móvil */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {companies.map((company) => (
                                <div 
                                    key={company.id}
                                    className="bg-card/50 border border-border rounded-2xl p-4 space-y-4 backdrop-blur-sm active:scale-[0.98] transition-all"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                                                <Building2 className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-foreground leading-tight">{company.name}</h3>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                                                    Code: {company.code || '-'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="relative inline-block">
                                            <Badge className={company.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                                                {company.isActive ? 'Activa' : 'Inactiva'}
                                            </Badge>
                                            <select
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                value={company.isActive ? 'true' : 'false'}
                                                onChange={(e) => handleStatusChange(company, e.target.value)}
                                            >
                                                <option value="true">Activa</option>
                                                <option value="false">Inactiva</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/50">
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] uppercase text-muted-foreground font-semibold">RUC / Tax ID</p>
                                            <p className="text-xs font-medium text-foreground">{company.taxId}</p>
                                        </div>
                                        <div className="space-y-0.5 text-right">
                                            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Ubicación</p>
                                            <p className="text-xs font-medium text-foreground truncate">{company.city}, {company.country}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 bg-muted/30 border-border hover:bg-muted/50 h-10 rounded-xl"
                                            onClick={() => handleEdit(company)}
                                        >
                                            <Pencil size={14} className="mr-2" />
                                            Editar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-12 bg-destructive/5 border-destructive/20 text-destructive hover:bg-destructive/10 h-10 rounded-xl"
                                            onClick={() => handleDelete(company)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Vista de Tabla para Escritorio */}
                        <div className="hidden md:block bg-card/30 border border-border rounded-2xl overflow-hidden backdrop-blur-sm">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="border-border hover:bg-transparent">
                                        <TableHead className="text-muted-foreground font-bold">Código</TableHead>
                                        <TableHead className="text-muted-foreground font-bold">Empresa</TableHead>
                                        <TableHead className="text-muted-foreground font-bold">RUC / Tax ID</TableHead>
                                        <TableHead className="text-muted-foreground font-bold">Ubicación</TableHead>
                                        <TableHead className="text-muted-foreground font-bold">Estado</TableHead>
                                        <TableHead className="text-right text-muted-foreground font-bold">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {companies.map((company) => (
                                        <TableRow key={company.id} className="border-border hover:bg-accent/30 transition-colors group">
                                            <TableCell className="text-muted-foreground font-mono text-xs">{company.code || '-'}</TableCell>
                                            <TableCell className="font-medium text-foreground">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner group-hover:scale-110 transition-transform">
                                                        <Building2 className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold">{company.name}</div>
                                                        <div className="text-[10px] text-muted-foreground uppercase opacity-70">{company.legalName}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-foreground text-sm">{company.taxId}</TableCell>
                                            <TableCell className="text-foreground text-sm">{company.city}, {company.country}</TableCell>
                                            <TableCell>
                                                <div className="relative inline-block">
                                                    <Badge className={company.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                                                        {company.isActive ? 'Activa' : 'Inactiva'}
                                                    </Badge>
                                                    <select
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        value={company.isActive ? 'true' : 'false'}
                                                        onChange={(e) => handleStatusChange(company, e.target.value)}
                                                    >
                                                        <option value="true">Activa</option>
                                                        <option value="false">Inactiva</option>
                                                    </select>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                        onClick={() => handleEdit(company)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDelete(company)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </div>

            <CompanyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                company={currentCompany}
                loading={actionLoading}
            />

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Eliminar Empresa</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            ¿Está seguro que desea eliminar la empresa "{companyToDelete?.name}"? Esta acción no se puede deshacer.
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
