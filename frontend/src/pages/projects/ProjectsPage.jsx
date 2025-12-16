import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
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
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Proyectos</h1>
                    <p className="text-muted-foreground">Gestione sus proyectos y tareas</p>
                </div>
                <Button
                    onClick={handleCreate}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                >
                    <Plus size={20} className="mr-2" />
                    Nuevo Proyecto
                </Button>
            </div>

            <Card className="bg-card border-border">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                            <Input
                                className="pl-10 bg-background border-input text-foreground"
                                placeholder="Buscar proyectos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none"
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
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="text-center py-10 text-muted-foreground">Cargando proyectos...</div>
            ) : projects.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground bg-muted/30 rounded-lg border border-border border-dashed">
                    <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No se encontraron proyectos</p>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-lg overflow-hidden backdrop-blur-sm">
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
                                    className="hover:bg-muted/50 border-border cursor-pointer transition-colors"
                                    onClick={() => navigate(`/projects/${project.id}`)}
                                >
                                    <TableCell className="text-muted-foreground font-mono text-sm">
                                        {project.code || '-'}
                                    </TableCell>
                                    <TableCell className="font-medium text-foreground">
                                        <div className="font-semibold">{project.name}</div>
                                        {project.description && <div className="text-xs text-muted-foreground truncate max-w-[300px]">{project.description}</div>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={STATUS_COLORS[project.status]}>
                                            {STATUS_LABELS[project.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {project.responsibleExternal || (project.responsible
                                            ? `${project.responsible.firstName} ${project.responsible.lastName}`
                                            : 'Sin asignar')}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {formatDate(project.startDate)} - {formatDate(project.endDate)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="w-[100px]">
                                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                <span>{project.progress || 0}%</span>
                                            </div>
                                            <div className="w-full bg-secondary rounded-full h-1.5">
                                                <div
                                                    className="bg-primary h-1.5 rounded-full transition-all"
                                                    style={{ width: `${project.progress || 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(project)}
                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                                            >
                                                <Edit size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteClick(project.id)}
                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
