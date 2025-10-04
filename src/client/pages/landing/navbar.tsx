import { Button } from "../../components/ui/button";
import { Link } from "wasp/client/router";
import { logout, useAuth } from "wasp/client/auth";
import { useNavigate, useLocation } from "react-router-dom";
// import { Sheet, SheetContent, SheetTrigger } from "../../components/ui/sheet";
import { Menu, Moon, Sun, SquareUser, LogOut, ChevronDown, Settings, CreditCard, Zap, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "wasp/client/operations";
import { getCurrentUserSubscription } from "wasp/client/operations";
import Logo from "../../core/logo/logo";

const NavMenu = ({ className = "", orientation = "horizontal", isAuthenticated = false }: { className?: string; orientation?: "horizontal" | "vertical"; isAuthenticated?: boolean }) => {
  const location = useLocation();
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
      {isAuthenticated ? (
        // Authenticated user navigation - only show Dashboard link if not currently on dashboard
        location.pathname !== '/dashboard' && (
          <Link to="/dashboard">
            <button className="text-sm font-medium hover:text-primary transition-colors text-left">
              Dashboard
            </button>
          </Link>
        )
      ) : (
        // Non-authenticated user navigation
        <>
          <button 
            onClick={() => handleSectionClick('features')} 
            className="text-sm font-medium hover:text-primary transition-colors text-left"
          >
            Features
          </button>
          <button 
            onClick={() => handleSectionClick('pricing')} 
            className="text-sm font-medium hover:text-primary transition-colors text-left"
          >
            Pricing
          </button>
        </>
      )}
    </nav>
  );
};

const UserDropdown = ({ userEmail, profileImage, navigate }: { userEmail: string; profileImage?: string | null; navigate: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      logout();
    }, 100);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2"
      >
        <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center overflow-hidden border border-gray-200">
          {profileImage ? (
            <img 
              src={profileImage} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <SquareUser className="h-5 w-5 text-black" />
          )}
        </div>
        <ChevronDown className="h-4 w-4" />
      </Button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-12 w-56 bg-background border border-border rounded-lg shadow-lg z-50 py-2">
            {/* User Info Header */}
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-medium text-foreground">Signed in as</p>
              <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
            </div>
            
            {/* Menu Items */}
            <div className="py-1">
              {/* <button
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navigate to account page
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
              >
                <SquareUser className="h-4 w-4" />
                Account Settings
              </button> */}
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/subscription');
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Subscription
              </button>
              
              <div className="border-t border-border my-1"></div>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                disabled={isLoggingOut}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 text-destructive hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const CreditsDisplay = ({ showOnPaths = [] }: { showOnPaths?: string[] }) => {
  const location = useLocation();
  const { data: subscription } = useQuery(getCurrentUserSubscription);
  
  // Only show credits on specific pages
  const shouldShowCredits = showOnPaths.length === 0 || showOnPaths.some(path => location.pathname === path);
  
  if (!shouldShowCredits || !subscription) {
    return null;
  }

  return (
    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-accent/50 rounded-full border">
      <Zap className="h-4 w-4" />
      <span className="text-sm font-medium">
        {subscription.credits || 0}
      </span>
      <span className="text-xs text-muted-foreground">credits</span>
    </div>
  );
};

const MobileCreditsDisplay = ({ showOnPaths = [] }: { showOnPaths?: string[] }) => {
  const location = useLocation();
  const { data: subscription } = useQuery(getCurrentUserSubscription);
  
  // Only show credits on specific pages
  const shouldShowCredits = showOnPaths.length === 0 || showOnPaths.some(path => location.pathname === path);
  
  if (!shouldShowCredits || !subscription) {
    return null;
  }

  return (
    <div className="p-3 bg-accent/50 rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          <span className="text-sm font-medium">Credits Available</span>
        </div>
        <span className="text-lg font-semibold">
          {subscription.credits || 0}
        </span>
      </div>
    </div>
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

const NavigationSheet = ({ isAuthenticated = false, userEmail, profileImage, navigate }: { isAuthenticated?: boolean; userEmail?: string; profileImage?: string | null; navigate: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      logout();
      setIsOpen(false);
    }, 100);
  };

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
          <NavMenu orientation="vertical" className="mb-4" isAuthenticated={isAuthenticated} />
          
          {isAuthenticated && userEmail ? (
            <div className="space-y-4">
              {/* User Info */}
              <div className="p-3 bg-accent rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center overflow-hidden border border-gray-200">
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <SquareUser className="h-6 w-6 text-black" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground mb-1">Signed in as</p>
                  <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
                </div>
              </div>

              {/* Credits Display for Mobile */}
              <MobileCreditsDisplay showOnPaths={['/dashboard', '/subscription']} />
              
              {/* Menu Items */}
              <div className="space-y-2">
                {/* <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setIsOpen(false);
                    // TODO: Navigate to account page
                  }}
                >
                  <SquareUser className="h-4 w-4" />
                  Account Settings
                </Button> */}
                
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/subscription');
                  }}
                >
                  <CreditCard className="h-4 w-4" />
                  Subscription
                </Button>
              </div>
              
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </Button>
            </div>
          ) : (
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
          )}
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
  const { data: user } = useAuth();
  const navigate = useNavigate();
  const isAuthenticated = !!user;
  const userEmail = user?.email || user?.username || "User";
  const profileImage = user?.profileImage || null;

  return (
    <nav className="h-16 bg-background border-b border-accent">
      <div className="h-full flex items-center justify-between max-w-screen-xl mx-auto px-4 sm:px-6">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <Logo />
        </Link>

        {/* Desktop Menu */}
        <NavMenu className="hidden md:block" isAuthenticated={isAuthenticated} />

        <div className="flex items-center gap-3">
          {/* <ThemeToggle /> */}
          
          {isAuthenticated ? (
            // Show credits and user dropdown when authenticated
            <>
              <CreditsDisplay showOnPaths={['/dashboard', '/subscription']} />
              <div className="hidden sm:block">
                <UserDropdown userEmail={userEmail} profileImage={profileImage} navigate={navigate} />
              </div>
            </>
          ) : (
            // Show sign in/create account buttons when not authenticated
            <>
              <Link to="/signin">
                <Button className="hidden sm:inline-flex">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="outline" className="hidden sm:inline-flex">Create an account</Button>
              </Link>
            </>
          )}

          {/* Mobile Menu */}
          <div className="md:hidden">
            <NavigationSheet 
              isAuthenticated={isAuthenticated}
              userEmail={userEmail}
              profileImage={profileImage}
              navigate={navigate}
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
