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

    return (        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-fadeIn pb-24 md:pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-1">Proveedores PAC</h1>
                    <p className="text-muted-foreground text-sm">Configure los proveedores de facturación electrónica.</p>
                </div>
                <Button className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/20" onClick={handleCreate}>
                    <Plus className="h-4 w-4" /> Nuevo Proveedor
                </Button>
            </div>

            <Card className="bg-card/50 border-border backdrop-blur-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o código..."
                                className="pl-10 bg-background/50 border-border w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="w-full lg:w-48">
                            <select
                                className="w-full h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">Todos los Estados</option>
                                <option value="active">Activos</option>
                                <option value="inactive">Inactivos</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-muted-foreground">Cargando proveedores...</p>
                    </div>
                ) : filteredProviders.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-2xl border border-border border-dashed backdrop-blur-sm">
                        <Plus size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No se encontraron proveedores</p>
                    </div>
                ) : (
                    <>
                        {/* Vista de Tarjetas para Móvil */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {filteredProviders.map((p) => (
                                <div 
                                    key={p.id}
                                    className="bg-card/50 border border-border rounded-2xl p-4 space-y-4 backdrop-blur-sm active:scale-[0.98] transition-all"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner border border-primary/20">
                                                {p.code.substring(0, 3)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-foreground leading-tight">{p.name}</h3>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                                                    ID: {p.code}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className={p.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                                            {p.isActive ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </div>

                                    <div className="py-3 border-y border-border/50">
                                        <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Sitio Web</p>
                                        <p className="text-xs font-medium text-foreground truncate">
                                            {p.website ? (
                                                <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                    {p.website}
                                                </a>
                                            ) : '-'}
                                        </p>
                                    </div>

                                    <div className="flex gap-2 text-xs text-muted-foreground">
                                        <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-mono">{p.auth_type}</span>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 bg-muted/30 border-border hover:bg-muted/50 h-10 rounded-xl"
                                            onClick={() => handleEdit(p)}
                                        >
                                            <Pencil size={14} className="mr-2" />
                                            Editar Configuración
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-12 bg-destructive/5 border-destructive/20 text-destructive hover:bg-destructive/10 h-10 rounded-xl"
                                            onClick={() => handleDelete(p.id)}
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
                                        <TableHead className="text-muted-foreground font-bold cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('name')}>
                                            <div className="flex items-center gap-2">
                                                Nombre {sortConfig.key === 'name' && <ArrowUpDown className="h-3 w-3" />}
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-muted-foreground font-bold cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('code')}>
                                            <div className="flex items-center gap-2">
                                                Código {sortConfig.key === 'code' && <ArrowUpDown className="h-3 w-3" />}
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-muted-foreground font-bold">Website</TableHead>
                                        <TableHead className="text-muted-foreground font-bold">Auth</TableHead>
                                        <TableHead className="text-muted-foreground font-bold">Estado</TableHead>
                                        <TableHead className="text-right text-muted-foreground font-bold">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProviders.map((p) => (
                                        <TableRow key={p.id} className="border-border hover:bg-accent/30 transition-colors group">
                                            <TableCell className="font-bold text-foreground text-sm">{p.name}</TableCell>
                                            <TableCell className="text-muted-foreground font-mono text-xs">{p.code}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {p.website ? (
                                                    <a href={p.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">
                                                        {p.website}
                                                    </a>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] bg-muted/30">{p.auth_type}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={p.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                                                    {p.isActive ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                        onClick={() => handleEdit(p)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDelete(p.id)}
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
