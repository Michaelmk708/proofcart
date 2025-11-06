import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, QrCode, Search, CheckCircle2, XCircle } from "lucide-react";

const Verify = () => {
  const [serialNumber, setSerialNumber] = useState("");
  const [verificationResult, setVerificationResult] = useState<"verified" | "unverified" | null>(
    null
  );

  const handleVerify = () => {
    // Mock verification - in real app, this would call blockchain
    setVerificationResult(serialNumber.length > 5 ? "verified" : "unverified");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container px-4 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Verify Product Authenticity</h1>
            <p className="text-lg text-muted-foreground">
              Enter product serial number or scan QR code to verify on the blockchain
            </p>
          </div>

          {/* Verification Input */}
          <Card>
            <CardHeader>
              <CardTitle>Product Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Enter Product Serial Number
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., PCX-2024-789234"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleVerify}>
                      <Search className="h-4 w-4 mr-2" />
                      Verify
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full" size="lg">
                  <QrCode className="h-5 w-5 mr-2" />
                  Scan QR Code
                </Button>
              </div>

              {/* Verification Result */}
              {verificationResult && (
                <div
                  className={`rounded-lg p-6 ${
                    verificationResult === "verified"
                      ? "bg-secondary/10 border border-secondary/20"
                      : "bg-destructive/10 border border-destructive/20"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {verificationResult === "verified" ? (
                      <CheckCircle2 className="h-8 w-8 text-secondary flex-shrink-0" />
                    ) : (
                      <XCircle className="h-8 w-8 text-destructive flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      {verificationResult === "verified" ? (
                        <>
                          <h3 className="font-semibold text-lg text-secondary mb-2">
                            ✓ Authentic Product Verified
                          </h3>
                          <div className="space-y-2 text-sm">
                            <p>
                              <span className="font-medium">Manufacturer:</span> AudioTech Pro
                            </p>
                            <p>
                              <span className="font-medium">Mint Date:</span> January 15, 2024
                            </p>
                            <p>
                              <span className="font-medium">NFT ID:</span> ICP-NFT-7892A3F
                            </p>
                            <p className="text-muted-foreground">
                              This product is registered on the Internet Computer blockchain and
                              verified as authentic.
                            </p>
                          </div>
                          <Button variant="link" className="h-auto p-0 mt-3 text-secondary">
                            View Full Provenance Chain →
                          </Button>
                        </>
                      ) : (
                        <>
                          <h3 className="font-semibold text-lg text-destructive mb-2">
                            ⚠ Product Not Verified
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            This product serial number was not found in the ProofCart blockchain
                            registry. This may be a counterfeit or unregistered product.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* How it Works */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold mb-2">Find Serial/QR</h3>
                <p className="text-sm text-muted-foreground">
                  Locate the product serial number or QR code on your product
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold mb-2">Submit for Check</h3>
                <p className="text-sm text-muted-foreground">
                  Enter the code or scan using your device camera
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-semibold mb-2">Get Instant Result</h3>
                <p className="text-sm text-muted-foreground">
                  Receive blockchain-verified authenticity confirmation
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Verify;
