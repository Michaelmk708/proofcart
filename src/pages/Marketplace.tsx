import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal } from "lucide-react";

// Mock product data
const products = [
  {
    id: "1",
    name: "Premium Wireless Headphones - Studio Quality Sound",
    price: 299.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
    rating: 4.8,
    reviews: 1234,
    verified: true,
    trending: true,
  },
  {
    id: "2",
    name: "Smart Watch Series 7 - Health & Fitness Tracker",
    price: 399.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
    rating: 4.6,
    reviews: 892,
    verified: true,
  },
  {
    id: "3",
    name: "Designer Leather Handbag - Genuine Italian Leather",
    price: 549.99,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=500&fit=crop",
    rating: 4.9,
    reviews: 567,
    verified: true,
    trending: true,
  },
  {
    id: "4",
    name: "4K Ultra HD Camera - Professional Photography",
    price: 1299.99,
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&h=500&fit=crop",
    rating: 4.7,
    reviews: 432,
    verified: true,
  },
  {
    id: "5",
    name: "Luxury Chronograph Watch - Swiss Movement",
    price: 899.99,
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&h=500&fit=crop",
    rating: 4.9,
    reviews: 678,
    verified: true,
  },
  {
    id: "6",
    name: "Premium Running Shoes - Advanced Cushioning",
    price: 179.99,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
    rating: 4.5,
    reviews: 923,
    verified: true,
  },
];

const Marketplace = () => {
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside className="lg:w-64 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Filters</h2>
                <Button variant="ghost" size="sm">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>

              {/* Verified Only */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="verified"
                    checked={verifiedOnly}
                    onCheckedChange={(checked) => setVerifiedOnly(checked as boolean)}
                  />
                  <Label htmlFor="verified" className="font-medium cursor-pointer">
                    Verified Products Only
                  </Label>
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-4">
                <Label className="font-medium">Price Range</Label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={2000}
                  step={10}
                  className="my-4"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <Label className="font-medium">Categories</Label>
                <div className="space-y-2">
                  {["Electronics", "Fashion", "Home & Living", "Beauty & Health", "Sports"].map(
                    (category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox id={category} />
                        <Label htmlFor={category} className="cursor-pointer font-normal">
                          {category}
                        </Label>
                      </div>
                    )
                  )}
                </div>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">
                  All Products{" "}
                  <span className="text-muted-foreground font-normal">
                    ({products.length} items)
                  </span>
                </h1>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Marketplace;
