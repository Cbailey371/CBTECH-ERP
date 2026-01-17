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
            if (userId && formData.selectedCompanies && formData.selectedCompanies.length > 0) {
                // Asignar a cada empresa seleccionada
                // Nota: En una implementación real, deberíamos manejar desasignaciones también
                const assignmentPromises = formData.selectedCompanies.map(companyId =>
                    userService.assignUserToCompany(userId, companyId, formData.role)
                );
                await Promise.all(assignmentPromises);
            }

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
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground mb-2">Usuarios</h1>
                    <p className="text-muted-foreground">Gestiona los usuarios del sistema.</p>
                </div>
                <Button className="gap-2" onClick={handleCreate}>
                    <Plus className="h-4 w-4" /> Nuevo Usuario
                </Button>
            </div>

            <Card className="bg-card border-border">
                <CardHeader>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <CardTitle className="text-foreground">Listado de Usuarios</CardTitle>
                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            <select
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                            >
                                <option value="all">Todos los Roles</option>
                                <option value="admin">Administrador</option>
                                <option value="user">Usuario</option>
                            </select>
                            <select
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">Todos los Estados</option>
                                <option value="active">Activos</option>
                                <option value="inactive">Inactivos</option>
                            </select>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    placeholder="Buscar usuario..."
                                    className="pl-8 bg-background border-border"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-card/50">
                                <TableHead className="text-muted-foreground">Código</TableHead>
                                <TableHead className="text-muted-foreground">Usuario</TableHead>
                                <TableHead className="text-muted-foreground">Email</TableHead>
                                <TableHead className="text-muted-foreground">Rol Global</TableHead>
                                <TableHead className="text-muted-foreground">Estado</TableHead>
                                <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} className="border-border hover:bg-accent/50">
                                    <TableCell className="text-muted-foreground font-mono text-sm">{user.code || '-'}</TableCell>
                                    <TableCell className="font-medium text-foreground">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="font-bold">{user.firstName} {user.lastName}</div>
                                                <div className="text-xs text-muted-foreground">@{user.username}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-foreground">{user.email}</TableCell>
                                    <TableCell className="text-foreground capitalize">{user.role}</TableCell>
                                    <TableCell>
                                        <div className="relative inline-block">
                                            <Badge variant={user.isActive ? 'success' : 'destructive'}>
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
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                                onClick={() => handleEdit(user)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
                </CardContent>
            </Card>

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
