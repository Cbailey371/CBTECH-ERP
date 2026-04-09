import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import ProjectModal from '../../components/projects/ProjectModal';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/Dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';

const STATUS_COLORS = {
    planning: 'bg-blue-500/20 text-blue-400',
    in_progress: 'bg-green-500/20 text-green-400',
    on_hold: 'bg-yellow-500/20 text-yellow-400',
    completed: 'bg-purple-500/20 text-purple-400',
    cancelled: 'bg-red-500/20 text-red-400'
};

const STATUS_LABELS = {
    planning: 'Planificación',
    in_progress: 'En Progreso',
    on_hold: 'En Pausa',
    completed: 'Completado',
    cancelled: 'Cancelado'
};



export default function ProjectsPage() {
    const { token, selectedCompany } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [saving, setSaving] = useState(false);

    // Delete Confirmation State
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (selectedCompany) {
            loadProjects();
        }
    }, [selectedCompany, searchTerm, statusFilter]);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const response = await projectService.getProjects(token, selectedCompany.id, {
                search: searchTerm,
                status: statusFilter
            });
            if (response.success) {
                setProjects(response.data.projects);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingProject(null);
        setIsModalOpen(true);
    };

    const handleEdit = (project) => {
        setEditingProject(project);
        setIsModalOpen(true);
    };

    const handleSubmit = async (formData) => {
        try {
            setSaving(true);
            if (editingProject) {
                await projectService.updateProject(token, selectedCompany.id, editingProject.id, formData);
            } else {
                await projectService.createProject(token, selectedCompany.id, formData);
            }
            setIsModalOpen(false);
            loadProjects();
        } catch (error) {
            console.error('Error saving project:', error);
            alert(error.message || 'Error al guardar el proyecto');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (id) => {
        setProjectToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!projectToDelete) return;

        try {
            setDeleting(true);
            await projectService.deleteProject(token, selectedCompany.id, projectToDelete);
            setIsDeleteModalOpen(false);
            setProjectToDelete(null);
            alert('Proyecto eliminado exitosamente');
            loadProjects();
        } catch (error) {
            console.error('Error deleting project:', error);
            alert(`Error al eliminar: ${error.message || error}`);
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('es-PA');
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Proyectos</h1>
                    <p className="text-muted-foreground text-sm md:text-base">Gestione sus proyectos y tareas</p>
                </div>
                <Button
                    onClick={handleCreate}
                    className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 h-11 md:h-10"
                >
                    <Plus size={20} className="mr-2" />
                    Nuevo Proyecto
                </Button>
            </div>

            <Card className="bg-card/50 border-border backdrop-blur-sm shadow-md">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                            className="pl-10 bg-background border-input text-foreground w-full h-11 md:h-10"
                            placeholder="Buscar proyectos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="w-full md:w-48 px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none h-11 md:h-10 text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Todos los estados</option>
                        <option value="planning">Planificación</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="on_hold">En Pausa</option>
                        <option value="completed">Completado</option>
                        <option value="cancelled">Cancelado</option>
                    </select>
                </CardContent>
            </Card>

            {loading ? (
                <div className="text-center py-20 text-muted-foreground animate-pulse">Cargando proyectos...</div>
            ) : projects.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-xl border-2 border-border border-dashed mx-2">
                    <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No se encontraron proyectos</p>
                    <p className="text-sm opacity-70">Intenta ajustar tus filtros de búsqueda</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Desktop View */}
                    <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden backdrop-blur-sm shadow-lg">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-muted/50 border-border">
                                    <TableHead className="text-muted-foreground">Código</TableHead>
                                    <TableHead className="text-muted-foreground">Proyecto</TableHead>
                                    <TableHead className="text-muted-foreground">Estado</TableHead>
                                    <TableHead className="text-muted-foreground">Responsable</TableHead>
                                    <TableHead className="text-muted-foreground">Fechas</TableHead>
                                    <TableHead className="text-muted-foreground">Progreso</TableHead>
                                    <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.map((project) => (
                                    <TableRow
                                        key={project.id}
                                        className="hover:bg-muted/50 border-border cursor-pointer transition-colors group"
                                        onClick={() => navigate(`/projects/${project.id}`)}
                                    >
                                        <TableCell className="text-muted-foreground font-mono text-xs">
                                            {project.code || 'PRJ-N/A'}
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground">
                                            <div className="font-semibold group-hover:text-primary transition-colors">{project.name}</div>
                                            {project.description && <div className="text-xs text-muted-foreground truncate max-w-[250px]">{project.description}</div>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${STATUS_COLORS[project.status]} border-none`}>
                                                {STATUS_LABELS[project.status]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">
                                                    {(project.responsibleExternal || (project.responsible ? `${project.responsible.firstName}` : 'S'))[0]}
                                                </div>
                                                <span>
                                                    {project.responsibleExternal || (project.responsible
                                                        ? `${project.responsible.firstName} ${project.responsible.lastName}`
                                                        : 'Sin asignar')}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            <div className="flex flex-col">
                                                <span>Inicia: {formatDate(project.startDate)}</span>
                                                <span>Fina: {formatDate(project.endDate)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="w-full max-w-[120px] space-y-1.5">
                                                <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                                                    <span>Progreso</span>
                                                    <span>{project.progress || 0}%</span>
                                                </div>
                                                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                                                        style={{ width: `${project.progress || 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(project)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                >
                                                    <Edit size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteClick(project.id)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-4 px-2">
                        {projects.map((project) => (
                            <Card
                                key={project.id}
                                className="bg-card/50 border-border active:scale-[0.98] transition-all cursor-pointer overflow-hidden shadow-sm"
                                onClick={() => navigate(`/projects/${project.id}`)}
                            >
                                <div className="p-4 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase">
                                                    {project.code || 'PRJ'}
                                                </span>
                                                <Badge className={`${STATUS_COLORS[project.status]} border-none text-[10px] py-0 h-5`}>
                                                    {STATUS_LABELS[project.status]}
                                                </Badge>
                                            </div>
                                            <h3 className="text-base font-bold text-foreground leading-tight">{project.name}</h3>
                                        </div>
                                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(project)} className="h-8 w-8">
                                                <Edit size={16} className="text-muted-foreground" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase font-semibold text-muted-foreground">Responsable</span>
                                            <p className="text-foreground truncate">
                                                {project.responsibleExternal || (project.responsible
                                                    ? `${project.responsible.firstName}`
                                                    : 'Sin asignar')}
                                            </p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <span className="text-[10px] uppercase font-semibold text-muted-foreground">Entrega</span>
                                            <p className="text-foreground">{formatDate(project.endDate)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted-foreground">
                                            <span>Progreso del Proyecto</span>
                                            <span className="text-primary">{project.progress || 0}%</span>
                                        </div>
                                        <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="bg-primary h-full rounded-full transition-all duration-700 ease-in-out shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                                                style={{ width: `${project.progress || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <ProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                project={editingProject}
                loading={saving}
            />

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
                    <DialogHeader>
                        <DialogTitle>Eliminar Proyecto</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            ¿Está seguro que desea eliminar este proyecto? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="border-input hover:bg-accent text-foreground"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                            {deleting ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
