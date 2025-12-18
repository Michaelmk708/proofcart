import { Link } from "react-router-dom";
import { ShoppingCart, Search, Shield, User, LogOut, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

const Header = () => {
  const { user, isAuthenticated, logout, connectWallet } = useAuth();
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <Shield className="h-6 w-6 text-primary" />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ProofCart
          </span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for verified products..."
              className="w-full pl-10 pr-4"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild className="hidden md:flex">
            <Link to="/verify">
              <Shield className="h-4 w-4 mr-2" />
              Verify Product
            </Link>
          </Button>
            <Button variant="ghost" asChild className="hidden md:flex">
            <Link to="/scan">
              <QrCode className="h-4 w-4 mr-2" />
              Scan
            </Link>
          </Button>
          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user?.username}
                  {user?.role && (
                    <span className="block text-xs text-muted-foreground capitalize">
                      {user.role}
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">My Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/orders">Orders</Link>
                </DropdownMenuItem>
                {user?.role === 'seller' && (
                  <DropdownMenuItem asChild>
                    <Link to="/seller/dashboard">Seller Dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={connectWallet}>
                  Connect Wallet
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" asChild>
              <Link to="/login">
                <User className="h-5 w-5 mr-2" />
                Login
              </Link>
            </Button>
          )}
          
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link to="/cart">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>
          </Button>
        </nav>
      </div>

      {/* Category Bar */}
      <div className="border-t">
        <div className="container px-4 py-2">
          <div className="flex items-center gap-4 text-sm overflow-x-auto">
            <Link to="/marketplace" className="whitespace-nowrap hover:text-primary transition-colors">
              All Products
            </Link>
            <Link to="/marketplace?category=electronics" className="whitespace-nowrap hover:text-primary transition-colors">
              Electronics
            </Link>
            <Link to="/marketplace?category=fashion" className="whitespace-nowrap hover:text-primary transition-colors">
              Fashion
            </Link>
            <Link to="/marketplace?category=home" className="whitespace-nowrap hover:text-primary transition-colors">
              Home & Living
            </Link>
            <Link to="/marketplace?category=beauty" className="whitespace-nowrap hover:text-primary transition-colors">
              Beauty & Health
            </Link>
            <Link to="/seller" className="whitespace-nowrap hover:text-secondary transition-colors font-medium">
              Become a Seller
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
