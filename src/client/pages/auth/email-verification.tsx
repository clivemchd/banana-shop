import "../../../index.css";
import { VerifyEmailForm } from "wasp/client/auth";
import Navbar from "../landing/navbar";

export const EmailVerificationPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <VerifyEmailForm />
      </div>
    </div>
  );
};
