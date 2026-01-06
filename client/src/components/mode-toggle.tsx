import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  // Determine the effective theme (handles "system" preference)
  const getEffectiveTheme = () => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    }
    return theme
  }

  const toggleTheme = () => {
    const effectiveTheme = getEffectiveTheme()
    // Toggle to the opposite theme
    setTheme(effectiveTheme === "dark" ? "light" : "dark")
  }

  const isDark = getEffectiveTheme() === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "h-7 w-7 relative",
        "text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent/50"
      )}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Sun className={cn(
        "h-4 w-4 transition-all duration-200",
        isDark ? "rotate-90 scale-0" : "rotate-0 scale-100"
      )} />
      <Moon className={cn(
        "absolute h-4 w-4 transition-all duration-200",
        isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0"
      )} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
