import "../../../index.css";
import { Link } from "react-router-dom";
import { useState } from "react";
import { requestPasswordReset } from "wasp/client/auth";
import { Environment } from "../../utils/environment";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import Navbar from "../landing/navbar";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [error, setError] = useState<string | Error | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    // Email validation following Wasp security protocols
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      await requestPasswordReset({ email });
      setNeedsConfirmation(true);
      setEmail("");
      
      if (Environment.isDevelopment) {
        console.log("🔔 Password reset requested for:", email);
        console.log("📧 In development mode - check your terminal for the reset email");
      }
    } catch (error: any) {
      console.error('Error during requesting reset:', error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // If password reset was requested successfully, show confirmation message
  if (needsConfirmation) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <Card className="mx-auto max-w-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Check Your Email</CardTitle>
                <CardDescription>
                  Check your email for the confirmation link. If you don't see it, check spam/junk folder.
                  {Environment.isDevelopment && (
                    <div className="mt-2 p-2 bg-blue-50 text-blue-700 text-xs rounded">
                      Development mode: Check your terminal for the password reset link.
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Link 
                    to="/signin" 
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Back to login
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="mx-auto max-w-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Forgot Password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                    {typeof error === 'string' ? error : error.message || 'An error occurred'}
                  </div>
                )}

                {/* Email Field */}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
                
                {/* Back to Login Link */}
                <div className="mt-4 text-center text-sm">
                  Remember your password?{" "}
                  <Link to="/signin" className="underline">
                    Back to login
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
