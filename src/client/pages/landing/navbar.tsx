import { Button } from "../../components/ui/button";
import { Link } from "wasp/client/router";
// import { Sheet, SheetContent, SheetTrigger } from "../../components/ui/sheet";
import { Menu, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import Logo from "../../core/logo/logo";

const NavMenu = ({ className = "", orientation = "horizontal" }: { className?: string; orientation?: "horizontal" | "vertical" }) => {
  const handleSectionClick = (sectionId: string) => {
    // If we're not on the home page, navigate to home first
    if (window.location.pathname !== '/') {
      // Navigate to home with hash, then scroll after a brief delay
      window.location.href = `/#${sectionId}`;
      // The scrolling will be handled by the landing page useEffect
    } else {
      // If we're on the home page, update the hash and scroll to the section
      window.history.pushState(null, '', `#${sectionId}`);
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className={`${className} ${orientation === "vertical" ? "flex flex-col items-start gap-6" : "hidden md:flex items-center gap-6"}`}>
      <button 
        onClick={() => handleSectionClick('features')} 
        className="text-sm font-medium hover:text-primary transition-colors text-left"
      >
        Features
      </button>
      {/* <button 
        onClick={() => handleSectionClick('faq')} 
        className="text-sm font-medium hover:text-primary transition-colors text-left"
      >
        FAQ
      </button> */}
      <button 
        onClick={() => handleSectionClick('pricing')} 
        className="text-sm font-medium hover:text-primary transition-colors text-left"
      >
        Pricing
      </button>
    </nav>
  );
};

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
          <div className="space-y-4">
            <Link to="/signin">
              <Button className="w-full" onClick={() => setIsOpen(false)}>
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
            <Button className="w-full" variant="outline" onClick={() => setIsOpen(false)}>
              Create an account
            </Button>
            </Link>
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
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <Logo />
        </Link>

        {/* Desktop Menu */}
        <NavMenu className="hidden md:block" />

        <div className="flex items-center gap-3">
          {/* <ThemeToggle /> */}
          <Link to="/signin">
            <Button className="hidden sm:inline-flex">
              Sign In
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="outline" className="hidden sm:inline-flex">Create an account</Button>
          </Link>

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
