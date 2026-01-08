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

    // Delete state
    const [companyToDelete, setCompanyToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const { token } = useAuth();

    const fetchCompanies = async () => {
        try {
            const response = await companyService.getAllCompanies({ search });
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
    }, [search]);

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
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground mb-2">Empresas</h1>
                    <p className="text-muted-foreground">Gestiona las empresas registradas en el sistema.</p>
                </div>
                <Button className="gap-2" onClick={handleCreate}>
                    <Plus className="h-4 w-4" /> Nueva Empresa
                </Button>
            </div>

            <Card className="bg-card border-border">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-foreground">Listado de Empresas</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Buscar empresa..."
                                className="pl-8 bg-background border-border"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-card/50">
                                <TableHead className="text-muted-foreground">Código</TableHead>
                                <TableHead className="text-muted-foreground">Empresa</TableHead>
                                <TableHead className="text-muted-foreground">RUC / Tax ID</TableHead>
                                <TableHead className="text-muted-foreground">Ubicación</TableHead>
                                <TableHead className="text-muted-foreground">Estado</TableHead>
                                <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {companies.map((company) => (
                                <TableRow key={company.id} className="border-border hover:bg-accent/50">
                                    <TableCell className="text-muted-foreground font-mono text-sm">{company.code || '-'}</TableCell>
                                    <TableCell className="font-medium text-foreground">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                <Building2 className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="font-bold">{company.name}</div>
                                                <div className="text-xs text-muted-foreground">{company.legalName}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-foreground">{company.taxId}</TableCell>
                                    <TableCell className="text-foreground">{company.city}, {company.country}</TableCell>
                                    <TableCell>
                                        <div className="relative inline-block">
                                            <Badge variant={company.isActive ? 'success' : 'destructive'}>
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
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                                onClick={() => handleEdit(company)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
                </CardContent>
            </Card>

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
