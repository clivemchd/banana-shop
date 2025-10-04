import { submitToGoogleForms } from './google-forms-service';
import type { ContactFormData, ContactFormResponse } from '../../shared/contact-types';

export const submitContactForm = async (
  formData: ContactFormData
): Promise<ContactFormResponse> => {
  try {
    // Validate form data
    if (!formData.type) {
      return {
        success: false,
        message: 'Contact type is required'
      };
    }

    // Submit to Google Forms
    const result = await submitToGoogleForms(formData);
    
    return result;
  } catch (error) {
    console.error('Error in submitContactForm:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.'
    };
  }
};
