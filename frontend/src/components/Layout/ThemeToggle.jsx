import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "../ui/Button";
import { useTheme } from "../../context/ThemeProvider";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex items-center gap-1 bg-card/50 p-1 rounded-lg border border-border shadow-sm">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme("light")}
                className={`h-8 w-8 transition-all ${theme === 'light' ? 'bg-primary text-primary-foreground shadow-sm scale-110' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                title="Claro"
            >
                <Sun className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme("dark")}
                className={`h-8 w-8 transition-all ${theme === 'dark' ? 'bg-primary text-primary-foreground shadow-sm scale-110' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                title="Oscuro"
            >
                <Moon className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme("system")}
                className={`h-8 w-8 transition-all ${theme === 'system' ? 'bg-primary text-primary-foreground shadow-sm scale-110' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                title="Sistema"
            >
                <Monitor className="h-4 w-4" />
            </Button>
        </div>
    );
}
