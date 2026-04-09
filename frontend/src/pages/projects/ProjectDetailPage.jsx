import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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

    const getTaskStatusStyle = (status) => {
        const styles = {
            in_progress: "bg-info/10 text-info border-info/20",
            review: "bg-primary/10 text-primary border-primary/20",
            completed: "bg-success/10 text-success border-success/20",
            cancelled: "bg-destructive/10 text-destructive border-destructive/20",
            pending: "bg-muted text-muted-foreground border-border"
        };
        return styles[status] || styles.pending;
    };

    const getTaskStatusLabel = (status) => {
        const labels = {
            in_progress: 'En Progreso',
            review: 'En Revisión',
            completed: 'Completada',
            cancelled: 'Cancelada',
            pending: 'Pendiente'
        };
        return labels[status] || 'Pendiente';
    };

    const renderTaskRow = (task, level = 0) => {
        // ... previous renderTaskRow logic ...
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
                        <div className="relative inline-block group min-w-[100px]">
                            <Badge variant="outline" className={`cursor-pointer group-hover:bg-accent whitespace-nowrap ${getTaskStatusStyle(task.status)}`}>
                                {getTaskStatusLabel(task.status)}
                            </Badge>
                            <select
                                value={task.status}
                                onChange={(e) => handleQuickStatusChange(task.id, e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none border-none bg-transparent"
                                style={{ color: 'transparent', textShadow: '0 0 0 transparent' }} // Firefox hack to hide text
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
        <div className="space-y-6 animate-fadeIn pb-24">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate('/projects')} 
                            className="p-0 h-auto hover:bg-transparent hover:text-foreground text-xs md:text-sm"
                        >
                            <ArrowLeft size={14} className="mr-1" />
                            Proyectos
                        </Button>
                        <span className="opacity-50">/</span>
                        <span className="truncate max-w-[150px] md:max-w-none">{project.name}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl md:text-3xl font-bold text-foreground tracking-tight leading-tight">
                            {project.code && <span className="text-muted-foreground mr-1.5 font-mono">[{project.code}]</span>}
                            {project.name}
                        </h1>
                        <div className="md:mt-1">
                            {getStatusBadge(project.status)}
                        </div>
                    </div>
                </div>
                <div className="flex w-full md:w-auto">
                    <Button 
                        onClick={handleCreateTask} 
                        className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground h-11 md:h-10 shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Nueva Tarea
                    </Button>
                </div>
            </div>

            {/* Project Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 px-1 md:px-0">
                <Card className="bg-card/40 border-border/50 p-3 md:p-4 backdrop-blur-sm shadow-sm">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Cliente</div>
                    <div className="font-semibold text-foreground flex items-center gap-2 text-xs md:text-sm truncate">
                        <User size={14} className="text-primary/70 shrink-0" />
                        <span className="truncate">{project.customer ? project.customer.name : 'N/A'}</span>
                    </div>
                </Card>
                <Card className="bg-card/40 border-border/50 p-3 md:p-4 backdrop-blur-sm shadow-sm">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Responsable</div>
                    <div className="font-semibold text-foreground flex items-center gap-2 text-xs md:text-sm truncate">
                        <User size={14} className="text-primary/70 shrink-0" />
                        <span className="truncate">{project.responsibleExternal || (project.responsible ? `${project.responsible.firstName}` : 'Sin asignar')}</span>
                    </div>
                </Card>
                <Card className="bg-card/40 border-border/50 p-3 md:p-4 backdrop-blur-sm shadow-sm col-span-2 md:col-span-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Fechas</div>
                    <div className="font-semibold text-foreground flex items-center gap-2 text-xs md:text-sm">
                        <Calendar size={14} className="text-primary/70 shrink-0" />
                        {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                    </div>
                </Card>
                <Card className="bg-card/40 border-border/50 p-3 md:p-4 backdrop-blur-sm shadow-sm col-span-2 md:col-span-1">
                    <div className="flex justify-between items-center mb-1">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Progreso</div>
                        <span className="text-xs font-bold text-primary">{project.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-secondary/50 h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-primary h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(var(--primary),0.3)]"
                            style={{ width: `${project.progress || 0}%` }}
                        />
                    </div>
                </Card>
            </div>

            {/* Tasks Section */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 px-1">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <CheckCircle size={20} className="text-primary" />
                        Tareas del Proyecto
                    </h3>
                    <div className="w-full md:w-48">
                        <select
                            className="w-full bg-background border border-input rounded-lg text-sm text-foreground px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 h-10 appearance-none"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
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

                {tasksLoading ? (
                    <div className="text-center py-12 text-muted-foreground animate-pulse">Cargando tareas...</div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-xl border-2 border-dashed border-border mx-1">
                        <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground opacity-20 mb-2" />
                        <p className="text-muted-foreground font-medium">No se encontraron tareas</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="border-border hover:bg-muted/50">
                                        <TableHead className="w-[100px]">Código</TableHead>
                                        <TableHead>Tarea</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Prioridad</TableHead>
                                        <TableHead>Asignado</TableHead>
                                        <TableHead>Vencimiento</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {organizeTasks(tasks).map(task => renderTaskRow(task))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile List Cards */}
                        <div className="md:hidden space-y-3 px-1">
                            {tasks.map((task) => (
                                <Card key={task.id} className="bg-card/50 border-border active:scale-[0.98] transition-transform overflow-hidden">
                                    <div className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase">
                                                        {task.code || 'TSK'}
                                                    </span>
                                                    <Badge className={`${getTaskStatusStyle(task.status)} border-none text-[10px] py-0 h-5`}>
                                                        {getTaskStatusLabel(task.status)}
                                                    </Badge>
                                                </div>
                                                <h4 className="text-sm font-bold text-foreground leading-tight">{task.title}</h4>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleEditTask(task)} 
                                                    className="h-8 w-8"
                                                >
                                                    <Pencil size={14} className="text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-[11px]">
                                            <div className="space-y-1">
                                                <span className="text-[10px] uppercase font-semibold text-muted-foreground/70">Asignado</span>
                                                <p className="text-foreground truncate font-medium">
                                                    {task.assignee ? `${task.assignee.firstName}` : 'Sin asignar'}
                                                </p>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <span className="text-[10px] uppercase font-semibold text-muted-foreground/70">Vencimiento</span>
                                                <p className={`font-medium ${new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-destructive' : 'text-foreground'}`}>
                                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-2 flex justify-between items-center border-t border-border/50 mt-2">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Prioridad:</span>
                                                {getTaskPriorityBadge(task.priority)}
                                            </div>
                                            <div className="relative">
                                                <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 font-bold uppercase tracking-wider">
                                                    Cambiar Estado
                                                </Button>
                                                <select
                                                    value={task.status}
                                                    onChange={(e) => handleQuickStatusChange(task.id, e.target.value)}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                >
                                                    <option value="pending">Pendiente</option>
                                                    <option value="in_progress">En Progreso</option>
                                                    <option value="review">En Revisión</option>
                                                    <option value="completed">Completada</option>
                                                    <option value="cancelled">Cancelada</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>

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
