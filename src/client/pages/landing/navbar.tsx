import { Button } from "../../components/ui/button";
// import { Sheet, SheetContent, SheetTrigger } from "../../components/ui/sheet";
import { Menu, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

const Logo = () => (
  <svg
    id="logo-7"
    width="124"
    height="32"
    viewBox="0 0 124 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M36.87 10.07H39.87V22.2H36.87V10.07ZM41.06 17.62C41.06 14.62 42.9 12.83 45.74 12.83C48.58 12.83 50.42 14.62 50.42 17.62C50.42 20.62 48.62 22.42 45.74 22.42C42.86 22.42 41.06 20.67 41.06 17.62ZM47.41 17.62C47.41 15.97 46.76 15 45.74 15C44.72 15 44.08 16 44.08 17.62C44.08 19.24 44.71 20.22 45.74 20.22C46.77 20.22 47.41 19.3 47.41 17.63V17.62Z"
      className="fill-foreground"
    />
    <path
      d="M28.48 10.62C27.9711 9.45636 27.2976 8.37193 26.48 7.4C25.2715 5.92034 23.7633 4.71339 22.0547 3.8586C20.3461 3.00382 18.4758 2.52057 16.567 2.44066C14.6582 2.36075 12.7541 2.68599 10.98 3.39499C9.20597 4.10398 7.60217 5.18065 6.2742 6.55413C4.94622 7.9276 3.92417 9.56675 3.27532 11.3637C2.62647 13.1606 2.36552 15.0746 2.50966 16.9796C2.65381 18.8847 3.19976 20.7261 4.11246 22.4049C5.02516 24.0837 6.28217 25.5597 7.79398 26.7397C9.30579 27.9197 11.0351 28.7755 12.8726 29.2493C14.7101 29.7232 16.6152 29.8048 18.4846 29.4887C20.354 29.1726 22.1416 28.4672 23.7284 27.4195C25.3152 26.3717 26.6643 25.0063 27.6878 23.4122C28.7114 21.8181 29.3856 20.0316 29.6648 18.1751C29.944 16.3186 29.8218 14.4307 29.3069 12.6185"
      className="fill-foreground"
    />
  </svg>
);

const NavMenu = ({ className = "", orientation = "horizontal" }: { className?: string; orientation?: "horizontal" | "vertical" }) => (
  <nav className={`${className} ${orientation === "vertical" ? "flex flex-col items-start gap-6" : "hidden md:flex items-center gap-6"}`}>
    <a href="/" className="text-sm font-medium hover:text-primary transition-colors">
      Home
    </a>
    <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
      Features
    </a>
    <a href="#faq" className="text-sm font-medium hover:text-primary transition-colors">
      FAQ
    </a>
    <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
      Testimonials
    </a>
    <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
      Pricing
    </a>
  </nav>
);

const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (!mounted) {
    return <Button variant="outline" size="icon" />;
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
};

const NavigationSheet = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu />
      </Button>
      {isOpen && (
        <div className="absolute top-12 right-0 w-64 bg-background border border-border rounded-lg shadow-lg p-4 z-50">
          <div className="mb-4">
            <Logo />
          </div>
          <NavMenu orientation="vertical" className="mb-4" />
          <div className="space-y-2">
            <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
              Sign In
            </Button>
            <Button className="w-full" onClick={() => setIsOpen(false)}>
              Get Started
            </Button>
          </div>
        </div>
      )}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

const Navbar = () => {
  return (
    <nav className="h-16 bg-background border-b border-accent">
      <div className="h-full flex items-center justify-between max-w-screen-xl mx-auto px-4 sm:px-6">
        <Logo />

        {/* Desktop Menu */}
        <NavMenu className="hidden md:block" />

        <div className="flex items-center gap-3">
          {/* <ThemeToggle /> */}
          <Button variant="outline" className="hidden sm:inline-flex">
            Sign In
          </Button>
          <Button className="hidden xs:inline-flex">Get Started</Button>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <NavigationSheet />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
