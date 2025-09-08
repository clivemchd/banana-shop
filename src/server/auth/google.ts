import { defineUserSignupFields } from "wasp/server/auth";

export const userSignupFields = defineUserSignupFields({
  email: (data: any) => {
    // Extract email from Google profile
    const email = data.profile.email;
    
    if (!email) {
      throw new Error('Google profile does not contain an email address');
    }

    return email;
  }
});

export function getConfig() {
  return {
    scopes: ["profile", "email"]
  };
}
