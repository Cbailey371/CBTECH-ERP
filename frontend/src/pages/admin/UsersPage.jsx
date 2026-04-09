import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Plus, Search, User, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import * as userService from '../../services/userService';
import UserModal from '../../components/admin/UserModal';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/Dialog';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // Delete state
    const [userToDelete, setUserToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const { token } = useAuth();

    const fetchUsers = async () => {
        try {
            const params = { search };
            if (filterRole && filterRole !== 'all') params.role = filterRole;
            if (filterStatus && filterStatus !== 'all') params.is_active = filterStatus === 'active';

            const response = await userService.getUsers(params);
            if (response.success) {
                setUsers(response.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [search, filterRole, filterStatus]);

    const handleCreate = () => {
        setCurrentUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (user) => {
        setCurrentUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = (user) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        setDeleting(true);
        try {
            await userService.deleteUser(userToDelete.id);
            alert('Usuario eliminado exitosamente');
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error al eliminar usuario');
        } finally {
            setDeleting(false);
        }
    };

    const handleStatusChange = async (user, newStatus) => {
        // Optimistic update
        const updatedUsers = users.map(u =>
            u.id === user.id ? { ...u, isActive: newStatus === 'true' } : u
        );
        setUsers(updatedUsers);

        try {
            await userService.updateUser(user.id, { ...user, isActive: newStatus === 'true' });
            fetchUsers();
        } catch (error) {
            console.error('Error updating user status:', error);
            alert('Error al actualizar estado del usuario');
            fetchUsers(); // Revert on error
        }
    };

    const handleSave = async (formData) => {
        setActionLoading(true);
        try {
            let userId;
            if (currentUser) {
                await userService.updateUser(currentUser.id, formData);
                userId = currentUser.id;
            } else {
                const response = await userService.createUser(formData);
                if (response.success) {
                    userId = response.data.id;
                }
            }

            // Procesar asignación de empresas
            // La asignación se maneja ahora íntegramente en el backend dentro de createUser/updateUser
            // gracias a que enviamos 'selectedCompanies' en el formData.
            // Esto asegura consistencia y permite desasignar empresas también.
            /*
            if (userId && formData.selectedCompanies && formData.selectedCompanies.length > 0) {
                // Asignar a cada empresa seleccionada
                // Nota: En una implementación real, deberíamos manejar desasignaciones también
                const assignmentPromises = formData.selectedCompanies.map(companyId =>
                    userService.assignUserToCompany(userId, companyId, formData.role)
                );
                await Promise.all(assignmentPromises);
            }
            */

            setIsModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error al guardar usuario');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-fadeIn pb-24 md:pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-1">Usuarios</h1>
                    <p className="text-muted-foreground text-sm">Administre el acceso y perfiles de los usuarios del sistema.</p>
                </div>
                <Button className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/20" onClick={handleCreate}>
                    <Plus className="h-4 w-4" /> Nuevo Usuario
                </Button>
            </div>

            <Card className="bg-card/50 border-border backdrop-blur-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre, email o nombre de usuario..."
                                className="pl-10 bg-background/50 border-border w-full"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 lg:flex gap-4">
                            <select
                                className="h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-1 lg:w-40"
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                            >
                                <option value="all">Todos los Roles</option>
                                <option value="admin">Administrador</option>
                                <option value="user">Usuario</option>
                            </select>
                            <select
                                className="h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-1 lg:w-40"
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
                        <p className="text-muted-foreground">Cargando usuarios...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-2xl border border-border border-dashed backdrop-blur-sm">
                        <User size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No se encontraron usuarios</p>
                    </div>
                ) : (
                    <>
                        {/* Vista de Tarjetas para Móvil */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {users.map((user) => (
                                <div 
                                    key={user.id}
                                    className="bg-card/50 border border-border rounded-2xl p-4 space-y-4 backdrop-blur-sm active:scale-[0.98] transition-all"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-lg shadow-inner ring-2 ring-primary/10">
                                                {user.firstName?.[0]}{user.lastName?.[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-foreground leading-tight">{user.firstName} {user.lastName}</h3>
                                                <p className="text-xs text-muted-foreground">@{user.username}</p>
                                            </div>
                                        </div>
                                        <div className="relative inline-block">
                                            <Badge className={user.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                                                {user.isActive ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                            <select
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                value={user.isActive ? 'true' : 'false'}
                                                onChange={(e) => handleStatusChange(user, e.target.value)}
                                            >
                                                <option value="true">Activo</option>
                                                <option value="false">Inactivo</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/50">
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Rol Global</p>
                                            <Badge variant="outline" className="text-[10px] uppercase bg-muted/50 border-border">
                                                {user.role}
                                            </Badge>
                                        </div>
                                        <div className="space-y-0.5 text-right">
                                            <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Email</p>
                                            <p className="text-xs font-medium text-foreground truncate">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 bg-muted/30 border-border hover:bg-muted/50 h-10 rounded-xl"
                                            onClick={() => handleEdit(user)}
                                        >
                                            <Pencil size={14} className="mr-2" />
                                            Editar Perfil
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-12 bg-destructive/5 border-destructive/20 text-destructive hover:bg-destructive/10 h-10 rounded-xl"
                                            onClick={() => handleDelete(user)}
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
                                        <TableHead className="text-muted-foreground font-bold italic">Cód.</TableHead>
                                        <TableHead className="text-muted-foreground font-bold">Usuario</TableHead>
                                        <TableHead className="text-muted-foreground font-bold">Email</TableHead>
                                        <TableHead className="text-muted-foreground font-bold">Rol</TableHead>
                                        <TableHead className="text-muted-foreground font-bold">Estado</TableHead>
                                        <TableHead className="text-right text-muted-foreground font-bold">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id} className="border-border hover:bg-accent/30 transition-colors group">
                                            <TableCell className="text-muted-foreground font-mono text-xs">{user.code || '-'}</TableCell>
                                            <TableCell className="font-medium text-foreground">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner group-hover:scale-110 transition-transform">
                                                        {user.firstName?.[0]}{user.lastName?.[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm">{user.firstName} {user.lastName}</div>
                                                        <div className="text-[10px] text-muted-foreground uppercase opacity-70">@{user.username}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-foreground text-sm">{user.email}</TableCell>
                                            <TableCell className="capitalize text-sm">
                                                <Badge variant="outline" className="bg-muted/30">{user.role}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative inline-block">
                                                    <Badge className={user.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                                                        {user.isActive ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                    <select
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        value={user.isActive ? 'true' : 'false'}
                                                        onChange={(e) => handleStatusChange(user, e.target.value)}
                                                    >
                                                        <option value="true">Activo</option>
                                                        <option value="false">Inactivo</option>
                                                    </select>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                        onClick={() => handleEdit(user)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDelete(user)}
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

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                user={currentUser}
                loading={actionLoading}
            />

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Eliminar Usuario</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            ¿Está seguro que desea eliminar al usuario "{userToDelete?.firstName} {userToDelete?.lastName}"? Esta acción no se puede deshacer.
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
