import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import logo from '../assets/logo.png';
import { ThemeToggle } from '../components/Layout/ThemeToggle';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(username, password);

        if (result.success) {
            navigate('/companies'); // Redirigir a selección de empresa
        } else {
            setError(result.message);
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary/20 blur-[120px]" />
                <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[100px]" />
            </div>

            <div className="absolute top-4 right-4 z-20">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md p-8 relative z-10">
                <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl animate-fade-in text-foreground">
                    <div className="text-center mb-8">
                        <img src={logo} alt="CBTECH Logo" className="mx-auto h-24 mb-4 object-contain" />
                        <p className="text-muted-foreground">Ingresa a tu cuenta para continuar</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Usuario</label>
                            <Input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="nombre.apellido"
                                className="bg-background/50 border-input text-foreground placeholder:text-muted-foreground focus:border-primary"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Contraseña</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-background/50 border-input text-foreground placeholder:text-muted-foreground focus:border-primary"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-slide-up">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </Button>
                    </form>
                </div>

                <p className="text-center text-muted-foreground text-sm mt-8">
                    &copy; {new Date().getFullYear()} ERP System. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}
