import { Button } from "../../components/ui/button";
import { Link } from "wasp/client/router";
import { logout, useAuth } from "wasp/client/auth";
import { Menu, SquareUser, Settings, CreditCard, LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";
import Logo from "../../core/logo/logo";

const UserDropdown = ({ userEmail, profileImage }: { userEmail: string; profileImage?: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
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
              <button
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navigate to account page
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
              >
                <SquareUser className="h-4 w-4" />
                Account Settings
              </button>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navigate to billing page
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Billing
              </button>
              
              <div className="border-t border-border my-1"></div>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const MobileMenu = ({ userEmail, profileImage }: { userEmail: string; profileImage?: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="relative md:hidden">
      <Button 
        variant="outline" 
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center overflow-hidden border border-gray-200">
          {profileImage ? (
            <img 
              src={profileImage} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <SquareUser className="h-4 w-4 text-black" />
          )}
        </div>
      </Button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-12 right-0 w-64 bg-background border border-border rounded-lg shadow-lg p-4 z-50">
            <div className="mb-4">
              <Logo />
            </div>
            
            {/* User Info */}
            <div className="mb-4 p-3 bg-accent rounded-lg flex items-center gap-3">
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
            
            {/* Menu Items */}
            <div className="space-y-2 mb-4">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navigate to account page
                }}
              >
                <SquareUser className="h-4 w-4" />
                Account Settings
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navigate to billing page
                }}
              >
                <CreditCard className="h-4 w-4" />
                Billing
              </Button>
            </div>
            
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

const DashboardNavbar = () => {
  const { data: user } = useAuth();

  // If user is not loaded yet, show loading state
  if (!user) {
    return (
      <nav className="h-16 bg-background border-b border-accent">
        <div className="h-full flex items-center justify-between max-w-screen-xl mx-auto px-4 sm:px-6">
          <Link to="/dashboard" className="hover:opacity-80 transition-opacity">
            <Logo />
          </Link>
          <div className="animate-pulse">
            <div className="h-8 w-24 bg-accent rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  const userEmail = user.email || user.username || "User";
  const profileImage = (user as any).profileImage || null; // Profile image if available

  return (
    <nav className="h-16 bg-background border-b border-accent">
      <div className="h-full flex items-center justify-between max-w-screen-xl mx-auto px-4 sm:px-6">
        <Link to="/dashboard" className="hover:opacity-80 transition-opacity">
          <Logo />
        </Link>

        <div className="flex items-center gap-3">
          {/* Desktop User Dropdown */}
          <div className="hidden md:block">
            <UserDropdown userEmail={userEmail} profileImage={profileImage} />
          </div>

          {/* Mobile Menu */}
          <MobileMenu userEmail={userEmail} profileImage={profileImage} />
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;