import { Link } from "react-router-dom";
import { ShoppingCart, Search, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Header = () => {
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
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              0
            </span>
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
