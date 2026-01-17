import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Plus, Search, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import * as pacProviderService from '../../services/pacProviderService';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../../components/ui/Dialog';

export default function PacProvidersPage() {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProvider, setCurrentProvider] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const { token } = useAuth();

    // Search and Sort state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        website: '',
        test_url: '',
        prod_url: '',
        auth_type: 'API_KEY',
        isActive: true
    });

    useEffect(() => {
        fetchProviders();
    }, []);

    const fetchProviders = async () => {
        try {
            const res = await pacProviderService.getPacProviders(token);
            if (res.success) {
                setProviders(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setCurrentProvider(null);
        // Calculate next ID based on existing providers to generate PAC-XX
        const nextId = providers.length + 1;
        const autoCode = `PAC-${String(nextId).padStart(2, '0')}`;

        setFormData({
            name: '',
            code: autoCode,
            website: '',
            test_url: '',
            prod_url: '',
            auth_type: 'API_KEY',
            isActive: true
        });
        setIsModalOpen(true);
    };

    const handleEdit = (provider) => {
        setCurrentProvider(provider);
        setFormData({
            name: provider.name || '',
            code: provider.code || '',
            website: provider.website || '',
            test_url: provider.test_url || '',
            prod_url: provider.prod_url || '',
            auth_type: provider.auth_type || 'API_KEY',
            isActive: provider.isActive
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar este proveedor?')) return;
        try {
            await pacProviderService.deletePacProvider(token, id);
            fetchProviders();
        } catch (error) {
            console.error(error);
            alert('Error al eliminar');
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredProviders = providers
        .filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.code.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = filterStatus === 'all'
                ? true
                : filterStatus === 'active' ? p.isActive : !p.isActive;

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            if (currentProvider) {
                await pacProviderService.updatePacProvider(token, currentProvider.id, formData);
            } else {
                await pacProviderService.createPacProvider(token, formData);
            }
            setIsModalOpen(false);
            fetchProviders();
        } catch (error) {
            console.error(error);
            alert('Error al guardar');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground mb-2">Proveedores PAC</h1>
                    <p className="text-muted-foreground">Gestiona los proveedores de facturación electrónica.</p>
                </div>
                <Button className="gap-2" onClick={handleCreate}>
                    <Plus className="h-4 w-4" /> Nuevo Proveedor
                </Button>
            </div>

            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Listado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <select
                            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full sm:w-auto"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">Todos los Estados</option>
                            <option value="active">Activos</option>
                            <option value="inactive">Inactivos</option>
                        </select>
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o código..."
                                className="pl-8 bg-background border-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-card/50">
                                <TableHead className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-2">
                                        Nombre
                                        {sortConfig.key === 'name' && <ArrowUpDown className="h-3 w-3" />}
                                    </div>
                                </TableHead>
                                <TableHead className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('code')}>
                                    <div className="flex items-center gap-2">
                                        Código
                                        {sortConfig.key === 'code' && <ArrowUpDown className="h-3 w-3" />}
                                    </div>
                                </TableHead>
                                <TableHead className="text-muted-foreground">Website</TableHead>
                                <TableHead className="text-muted-foreground">Estado</TableHead>
                                <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProviders.map((p) => (
                                <TableRow key={p.id} className="border-border hover:bg-accent/50">
                                    <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                                    <TableCell className="text-muted-foreground font-mono">{p.code}</TableCell>
                                    <TableCell className="text-muted-foreground">{p.website || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={p.isActive ? 'success' : 'destructive'}>
                                            {p.isActive ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDelete(p.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredProviders.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                        No se encontraron proveedores
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground">
                    <DialogHeader>
                        <DialogTitle>{currentProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="bg-background border-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Código Interno</label>
                            <Input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} required className="bg-background border-input" placeholder="Ej. PAC-01" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Sitio Web</label>
                            <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} className="bg-background border-input" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">URL Pruebas</label>
                                <Input value={formData.test_url} onChange={e => setFormData({ ...formData, test_url: e.target.value })} className="bg-background border-input" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">URL Producción</label>
                                <Input value={formData.prod_url} onChange={e => setFormData({ ...formData, prod_url: e.target.value })} className="bg-background border-input" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Tipo Autenticación</label>
                            <select
                                value={formData.auth_type}
                                onChange={e => setFormData({ ...formData, auth_type: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                                <option value="API_KEY">API Key</option>
                                <option value="USER_PASS">Usuario y Contraseña</option>
                                <option value="OAUTH">OAuth 2.0</option>
                            </select>
                        </div>
                        {currentProvider && (
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-muted-foreground">Activo</label>
                                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={actionLoading}>{actionLoading ? 'Guardando...' : 'Guardar'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
