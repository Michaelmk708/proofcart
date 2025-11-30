import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, XCircle, AlertTriangle, Shield, Clock,
  ExternalLink, Package, User, TrendingUp, Lock,
  FileText, MapPin, Calendar, Hash, Eye
} from 'lucide-react';
import { apiService } from '@/lib/api';

interface ProvenanceData {
  product_identity: {
    product_name: string;
    product_id: string;
    nft_id: string;
    authenticity_status: string;
    authenticity_color: string;
    product_type: string;
    manufacturer: string;
    manufacture_date: string | null;
    current_owner: string;
    serial_number: string;
    verification_source: string;
    images: string[];
    description: string;
    price: string;
  };
  seller_verification: {
    seller_name: string;
    pid_id: string;
    verification_status: string;
    verification_date: string;
    kyc_hash: string;
    reputation_score: number;
    bond_status: string;
    bond_amount: string;
    total_sales: number;
    contact_phone: string | null;
    blacklist_status: string;
    blacklist_reason: string | null;
  } | null;
  ownership_chain: Array<{
    step: number;
    owner_name: string;
    pid_or_wallet: string;
    transaction_date: string;
    transaction_hash: string;
    status: string;
    transfer_type: string;
  }>;
  disputes_reports: Array<{
    type: string;
    status: string;
    date: string | null;
    resolution: string;
    description: string | null;
  }>;
  blockchain_trace: {
    blockchain: string;
    nft_contract_address: string;
    nft_token_id: string;
    smart_contract_type: string;
    payment_reference: string | null;
    escrow_hash: string | null;
    payment_status: string | null;
    transaction_timestamp: string;
    explorer_url: string;
  };
  is_authentic: boolean;
  is_counterfeit: boolean;
  has_active_disputes: boolean;
  trust_score: number;
  last_verified: string;
}

const ProvenanceDashboard: React.FC = () => {
  const { serialNumber } = useParams<{ serialNumber: string }>();
  const navigate = useNavigate();
  
  const [provenance, setProvenance] = useState<ProvenanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (serialNumber) {
      fetchProvenance();
    }
  }, [serialNumber]);

  const fetchProvenance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiService.getProductProvenance(serialNumber!);
      setProvenance(data);
    } catch (err: any) {
      console.error('Provenance fetch error:', err);
      setError(err.response?.data?.error || 'Failed to load product provenance');
    } finally {
      setLoading(false);
    }
  };

  const getAuthenticityIcon = (color: string) => {
    switch (color) {
      case 'green':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case 'red':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'orange':
        return <Clock className="h-6 w-6 text-orange-500" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-gray-500" />;
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getReputationColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading product provenance...</p>
        </div>
      </div>
    );
  }

  if (error || !provenance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-6">
        <div className="max-w-4xl mx-auto pt-12">
          <Alert variant="destructive">
            <XCircle className="h-5 w-5" />
            <AlertTitle>Verification Failed</AlertTitle>
            <AlertDescription>
              {error || 'Product not found in ProofCart registry'}
            </AlertDescription>
          </Alert>
          
          <Card className="mt-6 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">⚠️ Warning: Possible Counterfeit</CardTitle>
              <CardDescription>
                This product QR/NFT ID does not match any ProofCart record.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                This could indicate:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Counterfeit product with fake QR code</li>
                <li>Stolen item with invalid credentials</li>
                <li>Product not registered in ProofCart system</li>
              </ul>
              
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => navigate('/')}>
                  Return Home
                </Button>
                <Button variant="destructive" onClick={() => window.open('mailto:support@proofcart.com', '_blank')}>
                  Report Counterfeit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { product_identity, seller_verification, ownership_chain, disputes_reports, blockchain_trace } = provenance;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-green-50 pb-12">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-yellow-600 to-green-600 text-white py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-8 w-8" />
            <h1 className="text-3xl font-bold">ProofCart Provenance Dashboard</h1>
          </div>
          <p className="text-yellow-100">Transparent Product Verification & Ownership History</p>
          
          {/* Trust Score Badge */}
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full">
            <TrendingUp className="h-5 w-5" />
            <span className="font-semibold">Trust Score: {provenance.trust_score}/100</span>
          </div>
        </div>
      </div>

      {/* Counterfeit Warning */}
      {provenance.is_counterfeit && (
        <div className="max-w-6xl mx-auto px-6 mt-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-lg font-bold">⚠️ NOT AUTHENTIC - POSSIBLE COUNTERFEIT</AlertTitle>
            <AlertDescription className="text-base">
              This product's QR code or NFT ID does not match any ProofCart record. Do not purchase this item.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Active Disputes Warning */}
      {provenance.has_active_disputes && (
        <div className="max-w-6xl mx-auto px-6 mt-4">
          <Alert variant="default" className="border-orange-300 bg-orange-50">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <AlertTitle className="text-orange-800">Active Dispute</AlertTitle>
            <AlertDescription className="text-orange-700">
              This product has pending disputes or investigations. Review details below.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 mt-6 space-y-6">
        
        {/* Section 1: Product Identity Overview */}
        <Card className="border-yellow-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-yellow-600" />
                <CardTitle>Product Identity</CardTitle>
              </div>
              {getAuthenticityIcon(product_identity.authenticity_color)}
            </div>
            <CardDescription className="text-lg font-semibold" style={{ color: product_identity.authenticity_color }}>
              {product_identity.authenticity_status}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Product Image */}
              {product_identity.images && product_identity.images.length > 0 && (
                <div className="md:col-span-2">
                  <img 
                    src={product_identity.images[0]} 
                    alt={product_identity.product_name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}
              
              {/* Product Details Grid */}
              <div className="space-y-3">
                <DetailRow label="Product Name" value={product_identity.product_name} />
                <DetailRow label="Product ID" value={product_identity.product_id} />
                <DetailRow label="NFT ID" value={product_identity.nft_id} />
                <DetailRow label="Product Type" value={product_identity.product_type} />
                <DetailRow label="Manufacturer" value={product_identity.manufacturer} />
              </div>
              
              <div className="space-y-3">
                <DetailRow label="Serial Number" value={product_identity.serial_number} icon={<Hash className="h-4 w-4" />} />
                <DetailRow label="Current Owner" value={product_identity.current_owner} icon={<User className="h-4 w-4" />} />
                <DetailRow 
                  label="Manufacture Date" 
                  value={product_identity.manufacture_date ? new Date(product_identity.manufacture_date).toLocaleDateString() : 'N/A'} 
                  icon={<Calendar className="h-4 w-4" />}
                />
                <DetailRow label="Verification Source" value={product_identity.verification_source} icon={<Shield className="h-4 w-4" />} />
                <DetailRow label="Price" value={`KES ${parseFloat(product_identity.price).toLocaleString()}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Verified Seller Information (PID) */}
        {seller_verification && (
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-yellow-50">
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-green-600" />
                <CardTitle>Verified Seller Information</CardTitle>
              </div>
              <CardDescription>{seller_verification.verification_status}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-4">
                <DetailRow label="Seller Name" value={seller_verification.seller_name} bold />
                <DetailRow label="ProofCart ID (PID)" value={seller_verification.pid_id} />
                <DetailRow 
                  label="Verification Date" 
                  value={new Date(seller_verification.verification_date).toLocaleDateString()}
                />
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Reputation:</span>
                  <Badge className={getReputationColor(seller_verification.reputation_score)}>
                    {seller_verification.reputation_score}/100
                  </Badge>
                </div>
                
                <DetailRow label="Total Sales" value={`${seller_verification.total_sales} completed`} />
                <DetailRow label="Bond Status" value={seller_verification.bond_status} />
                
                <div className="md:col-span-3">
                  <DetailRow 
                    label="KYC Hash" 
                    value={seller_verification.kyc_hash}
                    copyable 
                  />
                </div>
                
                <div className="md:col-span-3">
                  <DetailRow 
                    label="Blacklist Status" 
                    value={seller_verification.blacklist_status}
                    color={seller_verification.blacklist_status.includes('None') ? 'green' : 'red'}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section 3: Ownership Chain (Provenance) */}
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-blue-600" />
              <CardTitle>Ownership Chain</CardTitle>
            </div>
            <CardDescription>Complete transfer history from manufacturer to current owner</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {ownership_chain.map((entry, index) => (
                <div key={entry.step} className="relative">
                  {index < ownership_chain.length - 1 && (
                    <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-blue-200" />
                  )}
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold relative z-10">
                        {entry.step}
                      </div>
                    </div>
                    
                    <div className="flex-1 bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-gray-600">Owner</p>
                          <p className="font-semibold">{entry.owner_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">PID / Wallet</p>
                          <p className="font-mono text-sm">{entry.pid_or_wallet}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Date</p>
                          <p>{new Date(entry.transaction_date).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <Badge variant={entry.status.includes('✅') ? 'default' : 'secondary'}>
                            {entry.status}
                          </Badge>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600">Transaction Hash</p>
                          <p className="font-mono text-xs break-all">{entry.transaction_hash}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Disputes & Reports */}
        <Card className="border-orange-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-orange-600" />
              <CardTitle>Disputes, Theft & Authenticity Reports</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Resolution</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes_reports.map((report, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-3 px-4">{report.type}</td>
                      <td className="py-3 px-4">{report.status}</td>
                      <td className="py-3 px-4">
                        {report.date ? new Date(report.date).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4">{report.resolution}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {!provenance.has_active_disputes && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  No active reports. This product is currently clean and verified on ProofCart.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 5: Blockchain & Financial Trace */}
        <Card className="border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-purple-600" />
              <CardTitle>Blockchain & Financial Trace</CardTitle>
            </div>
            <CardDescription>Technical trust evidence and transaction details</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <DetailRow label="Blockchain" value={blockchain_trace.blockchain} />
              <DetailRow label="Smart Contract" value={blockchain_trace.smart_contract_type} />
              <DetailRow 
                label="NFT Contract Address" 
                value={blockchain_trace.nft_contract_address.slice(0, 20) + '...'}
                copyable
              />
              <DetailRow label="NFT Token ID" value={blockchain_trace.nft_token_id} />
              {blockchain_trace.payment_reference && (
                <DetailRow label="Payment Reference" value={blockchain_trace.payment_reference} />
              )}
              {blockchain_trace.payment_status && (
                <DetailRow label="Payment Status" value={blockchain_trace.payment_status} />
              )}
              {blockchain_trace.escrow_hash && (
                <DetailRow 
                  label="Escrow Hash" 
                  value={blockchain_trace.escrow_hash.slice(0, 20) + '...'}
                  copyable
                />
              )}
              <DetailRow 
                label="Transaction Time" 
                value={new Date(blockchain_trace.transaction_timestamp).toLocaleString()}
              />
            </div>
            
            <Separator className="my-6" />
            
            <div className="flex justify-center">
              <Button 
                onClick={() => window.open(blockchain_trace.explorer_url, '_blank')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full Transaction on Blockchain Explorer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Last Verified Timestamp */}
        <div className="text-center text-sm text-gray-500">
          <Eye className="h-4 w-4 inline mr-2" />
          Last verified: {new Date(provenance.last_verified).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

// Helper component for detail rows
const DetailRow: React.FC<{
  label: string;
  value: string;
  icon?: React.ReactNode;
  bold?: boolean;
  copyable?: boolean;
  color?: string;
}> = ({ label, value, icon, bold, copyable, color }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start gap-2">
      {icon && <div className="mt-0.5">{icon}</div>}
      <div className="flex-1">
        <p className="text-sm text-gray-600">{label}</p>
        <p className={`${bold ? 'font-bold' : 'font-medium'} ${color ? `text-${color}-700` : ''}`}>
          {value}
        </p>
      </div>
      {copyable && (
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={handleCopy}
          className="h-6 px-2 text-xs"
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      )}
    </div>
  );
};

export default ProvenanceDashboard;
