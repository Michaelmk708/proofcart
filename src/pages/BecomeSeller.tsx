import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Store, TrendingUp, Package, Check } from 'lucide-react';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';

const BecomeSeller = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    businessName: '',
    businessDescription: '',
    walletAddress: user?.wallet_address || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }

    if (user?.role === 'seller') {
      toast.info('You are already a seller');
      navigate('/seller/dashboard');
      return;
    }

    setIsLoading(true);

    try {
      // Update user role to seller
      await apiService.updateUserProfile({
        role: 'seller',
        first_name: formData.firstName,
        last_name: formData.lastName,
        wallet_address: formData.walletAddress,
      });

      toast.success('Welcome to ProofCart Sellers! 🎉');
      
      // Redirect to seller dashboard
      setTimeout(() => {
        window.location.href = '/seller/dashboard';
      }, 1000);
    } catch (error: any) {
      console.error('Error upgrading to seller:', error);
      toast.error(error.response?.data?.message || 'Failed to upgrade account');
    } finally {
      setIsLoading(false);
    }
  };

  // If already a seller, show message
  if (user?.role === 'seller') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container px-4 py-16 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <Store className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle>You're Already a Seller!</CardTitle>
              <CardDescription>
                Access your seller dashboard to manage products and orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/seller/dashboard')} className="w-full">
                Go to Seller Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-secondary/10 via-background to-primary/10 py-12 border-b">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Store className="h-4 w-4" />
              Seller Registration
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Become a <span className="text-secondary">Verified Seller</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Join ProofCart's trusted marketplace and reach customers who value authenticity
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 bg-muted/30">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Seller Benefits</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <Shield className="h-10 w-10 text-secondary mb-2" />
                  <CardTitle className="text-lg">Blockchain Verification</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Every product gets an NFT certificate, building trust with buyers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Package className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">Escrow Protection</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Secure payments held in escrow until delivery is confirmed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <TrendingUp className="h-10 w-10 text-accent mb-2" />
                  <CardTitle className="text-lg">Global Reach</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Access a worldwide marketplace of trust-conscious buyers
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section className="py-12">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Seller Application</CardTitle>
                <CardDescription>
                  Fill in your details to start selling on ProofCart
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name (Optional)</Label>
                    <Input
                      id="businessName"
                      placeholder="My Electronics Store"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      If you're selling as a business, enter your business name
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessDescription">About Your Store (Optional)</Label>
                    <Textarea
                      id="businessDescription"
                      placeholder="Tell buyers about what you sell..."
                      rows={4}
                      value={formData.businessDescription}
                      onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="walletAddress">Solana Wallet Address (Optional)</Label>
                    <Input
                      id="walletAddress"
                      placeholder="Your Solana wallet address"
                      value={formData.walletAddress}
                      onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      You can connect your wallet later from the dashboard
                    </p>
                  </div>

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Check className="h-4 w-4 text-secondary" />
                      What happens next?
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                      <li>• Your account will be upgraded to seller status</li>
                      <li>• You'll get access to the seller dashboard</li>
                      <li>• Start listing products with blockchain verification</li>
                      <li>• Accept orders through secure escrow payments</li>
                    </ul>
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Processing...' : 'Become a Seller'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BecomeSeller;
