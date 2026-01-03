import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { ArrowLeft, Plus, Calendar, User, Clock, CheckCircle, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import TaskModal from '../../components/projects/TaskModal';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/Dialog';

export default function ProjectDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, selectedCompany } = useAuth();

    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tasksLoading, setTasksLoading] = useState(false);

    // Modal state
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);


    // Delete state
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        if (id && selectedCompany) {
            fetchProjectDetails();
            fetchTasks();
        }
    }, [id, selectedCompany]);

    const fetchProjectDetails = async () => {
        try {
            const response = await projectService.getProject(token, selectedCompany.id, id);
            if (response.success) {
                setProject(response.data.project);
            }
        } catch (error) {
            console.error('Error loading project:', error);
            // navigate('/projects'); // Optional: redirect on error
        }
    };

    const fetchTasks = async () => {
        setTasksLoading(true);
        console.log('Fetching tasks for project:', id);
        try {
            const params = { projectId: id };
            if (statusFilter) params.status = statusFilter;

            const response = await taskService.getTasks(token, selectedCompany.id, params);
            console.log('Tasks response:', response);
            if (response.success) {
                setTasks(response.data.tasks);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setTasksLoading(false);
            setLoading(false);
        }
    };

    const handleCreateTask = () => {
        setCurrentTask(null);
        setIsTaskModalOpen(true);
    };

    const handleEditTask = (task) => {
        setCurrentTask(task);
        setIsTaskModalOpen(true);
    };

    const handleTaskSave = async (formData) => {
        setActionLoading(true);
        try {
            if (currentTask) {
                await taskService.updateTask(token, selectedCompany.id, currentTask.id, formData);
            } else {
                await taskService.createTask(token, selectedCompany.id, formData);
            }
            setIsTaskModalOpen(false);
            fetchTasks();
            fetchProjectDetails(); // Refresh project stats if needed
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Error al guardar la tarea');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteTask = (task) => {
        setTaskToDelete(task);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteTask = async () => {
        if (!taskToDelete) return;

        setDeleting(true);
        try {
            await taskService.deleteTask(token, selectedCompany.id, taskToDelete.id);
            alert('Tarea eliminada exitosamente');
            setIsDeleteModalOpen(false);
            setTaskToDelete(null);
            fetchTasks();
            fetchProjectDetails();
        } catch (error) {
            console.error('Error deleting task:', error);
            alert(`Error al eliminar la tarea: ${error.message || 'Error desconocido'}`);
        } finally {
            setDeleting(false);
        }
    };

    if (loading && !project) {
        return <div className="p-8 text-center text-muted-foreground">Cargando detalles del proyecto...</div>;
    }

    if (!project) {
        return <div className="p-8 text-center text-destructive">Proyecto no encontrado</div>;
    }

    const getStatusBadge = (status) => {
        const styles = {
            planning: "bg-info/10 text-info border-info/20",
            in_progress: "bg-warning/10 text-warning border-warning/20",
            on_hold: "bg-muted text-muted-foreground",
            completed: "bg-success/10 text-success border-success/20",
            cancelled: "bg-destructive/10 text-destructive border-destructive/20"
        };
        const labels = {
            planning: 'Planificación',
            in_progress: 'En Progreso',
            on_hold: 'En Pausa',
            completed: 'Completado',
            cancelled: 'Cancelado'
        };
        return <Badge variant="outline" className={styles[status]}>{labels[status] || status}</Badge>;
    };

    const getTaskPriorityBadge = (priority) => {
        const styles = {
            low: "text-muted-foreground",
            medium: "text-info",
            high: "text-warning",
            critical: "text-destructive font-bold"
        };
        const labels = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };

        return <span className={`text-xs ${styles[priority]}`}>{labels[priority]}</span>;
    };

    const organizeTasks = (flatTasks) => {
        const roots = [];
        const map = {};

        // Prepare map
        flatTasks.forEach(task => {
            map[task.id] = { ...task, children: [] };
        });

        // Build tree
        flatTasks.forEach(task => {
            if (task.parentId && map[task.parentId]) {
                map[task.parentId].children.push(map[task.id]);
            } else {
                roots.push(map[task.id]);
            }
        });

        return roots;
    };

    const handleQuickStatusChange = async (taskId, newStatus) => {
        try {
            // Optimistic update locally
            setTasks(prevTasks => prevTasks.map(t =>
                t.id === taskId ? { ...t, status: newStatus } : t
            ));

            await taskService.updateTask(token, selectedCompany.id, taskId, { status: newStatus });

            // Background refresh to ensure consistency (optional)
            fetchTasks();
            fetchProjectDetails();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error al actualizar estado');
            fetchTasks(); // Revert on error
        }
    };

    const renderTaskRow = (task, level = 0) => {
        const statusColors = {
            pending: 'bg-card text-muted-foreground border-border',
            in_progress: 'bg-info/10 text-info border-info/20',
            review: 'bg-primary/10 text-primary border-primary/20',
            completed: 'bg-success/10 text-success border-success/20',
            cancelled: 'bg-destructive/10 text-destructive border-destructive/20'
        };

        return (
            <>
                <TableRow key={task.id} className="hover:bg-accent/50 border-border transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {task.code || '-'}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                        <div style={{ paddingLeft: `${level * 24}px` }} className="flex items-center">
                            {level > 0 && <div className="w-4 h-px bg-border mr-2" />}
                            <div>
                                {task.title}
                                {task.description && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{task.description}</div>}
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="relative inline-block group">
                            <Badge variant="outline" className={`cursor-pointer group-hover:bg-accent ${task.status === 'completed' ? 'bg-success/10 text-success border-success/20' :
                                task.status === 'in_progress' ? 'bg-info/10 text-info border-info/20' :
                                    task.status === 'review' ? 'bg-primary/10 text-primary border-primary/20' :
                                        task.status === 'cancelled' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                            'bg-muted text-muted-foreground border-border'
                                }`}>
                                {task.status === 'in_progress' ? 'En Progreso' :
                                    task.status === 'review' ? 'En Revisión' :
                                        task.status === 'completed' ? 'Completada' :
                                            task.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                            </Badge>
                            <select
                                value={task.status}
                                onChange={(e) => handleQuickStatusChange(task.id, e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[0px]"
                            >
                                <option value="pending">Pendiente</option>
                                <option value="in_progress">En Progreso</option>
                                <option value="review">En Revisión</option>
                                <option value="completed">Completada</option>
                                <option value="cancelled">Cancelada</option>
                            </select>
                        </div>
                    </TableCell>
                    <TableCell>
                        {getTaskPriorityBadge(task.priority)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                        {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                        {task.dueDate ? (
                            <span className={
                                new Date(task.dueDate) < new Date() && task.status !== 'completed'
                                    ? 'text-destructive font-medium'
                                    : 'text-muted-foreground'
                            }>
                                {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                        ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditTask(task)} className="h-8 w-8 text-muted-foreground hover:text-info hover:bg-info/10">
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </TableCell>
                </TableRow>
                {task.children && task.children.map(child => renderTaskRow(child, level + 1))}
            </>
        );
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="p-0 h-auto hover:bg-transparent hover:text-foreground">
                            <ArrowLeft size={16} className="mr-1" />
                            Proyectos
                        </Button>
                        <span>/</span>
                        <span>{project.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">
                            {project.code && <span className="text-muted-foreground mr-2 font-mono text-2xl">[{project.code}]</span>}
                            {project.name}
                        </h1>
                        {getStatusBadge(project.status)}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleCreateTask} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Tarea
                    </Button>
                </div>
            </div>

            {/* Project Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-card/50 border-border p-4">
                    <div className="text-muted-foreground text-sm mb-1">Cliente</div>
                    <div className="font-medium text-foreground flex items-center gap-2">
                        <User size={16} />
                        {project.customer ? project.customer.name : 'N/A'}
                    </div>
                </Card>
                <Card className="bg-card/50 border-border p-4">
                    <div className="text-muted-foreground text-sm mb-1">Responsable</div>
                    <div className="font-medium text-foreground flex items-center gap-2">
                        <User size={16} />
                        {project.responsibleExternal || (project.responsible ? `${project.responsible.firstName} ${project.responsible.lastName}` : 'Sin asignar')}
                    </div>
                </Card>
                <Card className="bg-card/50 border-border p-4">
                    <div className="text-muted-foreground text-sm mb-1">Fechas</div>
                    <div className="font-medium text-foreground flex items-center gap-2 text-sm">
                        <Calendar size={16} />
                        {project.startDate || 'N/A'} - {project.endDate || 'N/A'}
                    </div>
                </Card>
                <Card className="bg-card/50 border-border p-4">
                    <div className="text-muted-foreground text-sm mb-1">Progreso</div>
                    <div className="font-medium text-foreground text-lg">
                        {project.progress || 0}%
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full mt-2">
                        <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${project.progress || 0}%` }}
                        />
                    </div>
                </Card>
            </div>

            {/* Tasks Section */}
            <Card className="bg-card/50 border-border backdrop-blur-sm">
                <CardContent className="p-0">
                    <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <CheckCircle size={18} className="text-primary" />
                            Tareas del Proyecto
                        </h3>
                        <div className="flex gap-2">
                            <select
                                className="bg-background border border-border rounded-md text-sm text-foreground px-2 py-1 outline-none focus:border-primary"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    // Trigger fetch via effect or manually
                                    // For simplicity, we can rely on effect if we add statusFilter to dependency array of a fetch effect,
                                    // OR just filter client-side if list is small. 
                                    // Given fetchTasks implementation, let's call it manually or rely on a "Refetch" button. 
                                    // Easier: Re-fetch on change.
                                    setTimeout(fetchTasks, 0);
                                }}
                            >
                                <option value="">Todos los estados</option>
                                <option value="pending">Pendientes</option>
                                <option value="in_progress">En Progreso</option>
                                <option value="completed">Completadas</option>
                            </select>
                        </div>
                    </div>

                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-muted/50 border-border">
                                <TableHead className="text-muted-foreground">Código</TableHead>
                                <TableHead className="text-muted-foreground">Tarea</TableHead>
                                <TableHead className="text-muted-foreground">Estado</TableHead>
                                <TableHead className="text-muted-foreground">Prioridad</TableHead>
                                <TableHead className="text-muted-foreground">Asignado a</TableHead>
                                <TableHead className="text-muted-foreground">Vencimiento</TableHead>
                                <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasksLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Cargando tareas...
                                    </TableCell>
                                </TableRow>
                            ) : tasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No hay tareas registradas en este proyecto.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                organizeTasks(tasks).map(task => renderTaskRow(task))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSave={handleTaskSave}
                task={currentTask}
                projectId={id}
                loading={actionLoading}
                existingTasks={tasks}
            />

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Eliminar Tarea</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            ¿Está seguro que desea eliminar la tarea "{taskToDelete?.title}"? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} disabled={deleting} className="text-muted-foreground hover:text-foreground">
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteTask} disabled={deleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            {deleting ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
