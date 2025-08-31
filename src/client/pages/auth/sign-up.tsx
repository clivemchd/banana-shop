import { Link } from "react-router-dom";
import { SignupForm } from "wasp/client/auth";

export const SignUpPage = () => {
  return (
    <div style={{ maxWidth: "400px", margin: "0 auto" }}>
      <SignupForm />
      <br />
      <span>
        I already have an account (<Link to="/signin">go to Sign In</Link>).
      </span>
    </div>
  );
};

