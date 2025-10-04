import { useState } from 'react';
import { ContactType } from '../../../shared/contact-types';
import type { ContactFormData } from '../../../shared/contact-types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert } from '../../components/ui/alert';
import { submitContactForm } from 'wasp/client/operations';
import { Loader2 } from 'lucide-react';
import '../../../index.css';
import Navbar from '../landing/navbar';
import Footer from '../landing/footer';

const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedType, setSelectedType] = useState<ContactType>(ContactType.BUGS);
  const [formData, setFormData] = useState({
    bugDescription: '',
    feedbackText: '',
    questionText: '',
    messageText: '',
    email: '',
    displayName: '',
    showPublicly: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (selectedType) {
      case ContactType.BUGS:
        if (!formData.bugDescription || formData.bugDescription.length < 10) {
          newErrors.bugDescription = 'Please provide at least 10 characters';
        }
        if (formData.email && !isValidEmail(formData.email)) {
          newErrors.email = 'Invalid email address';
        }
        break;
      case ContactType.FEEDBACK:
        if (!formData.feedbackText || formData.feedbackText.length < 10) {
          newErrors.feedbackText = 'Please provide at least 10 characters';
        }
        if (formData.showPublicly && (!formData.email || !isValidEmail(formData.email))) {
          newErrors.email = 'Valid email is required when you want your feedback shown publicly';
        } else if (formData.email && !isValidEmail(formData.email)) {
          newErrors.email = 'Invalid email address';
        }
        break;
      case ContactType.QUESTIONS:
        if (!formData.questionText || formData.questionText.length < 10) {
          newErrors.questionText = 'Please provide at least 10 characters';
        }
        if (!formData.email || !isValidEmail(formData.email)) {
          newErrors.email = 'Valid email address is required';
        }
        break;
      case ContactType.OTHER:
        if (!formData.messageText || formData.messageText.length < 10) {
          newErrors.messageText = 'Please provide at least 10 characters';
        }
        if (formData.email && !isValidEmail(formData.email)) {
          newErrors.email = 'Invalid email address';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      let contactData: ContactFormData;

      switch (selectedType) {
        case ContactType.BUGS:
          contactData = {
            type: ContactType.BUGS,
            bugDescription: formData.bugDescription,
            email: formData.email || undefined
          };
          break;
        case ContactType.FEEDBACK:
          contactData = {
            type: ContactType.FEEDBACK,
            feedbackText: formData.feedbackText,
            showPublicly: formData.showPublicly,
            displayName: formData.displayName || undefined,
            email: formData.email || undefined
          };
          break;
        case ContactType.QUESTIONS:
          contactData = {
            type: ContactType.QUESTIONS,
            questionText: formData.questionText,
            email: formData.email
          };
          break;
        case ContactType.OTHER:
          contactData = {
            type: ContactType.OTHER,
            messageText: formData.messageText,
            email: formData.email || undefined
          };
          break;
        default:
          throw new Error('Invalid contact type');
      }

      const response = await submitContactForm(contactData);
      
      if (response.success) {
        setSubmitStatus({
          type: 'success',
          message: 'Thank you for your submission! We\'ll get back to you soon.'
        });
        // Reset form
        setFormData({
          bugDescription: '',
          feedbackText: '',
          questionText: '',
          messageText: '',
          email: '',
          displayName: '',
          showPublicly: false
        });
      } else {
        setSubmitStatus({
          type: 'error',
          message: response.message || 'Something went wrong. Please try again.'
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Failed to submit the form. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold">Contact Us</CardTitle>
              <CardDescription>
                We'd love to hear from you. Please fill out the form below.
              </CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Type Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value as ContactType);
                    setErrors({});
                  }}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {Object.values(ContactType).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional Fields Based on Type */}
              {selectedType === ContactType.BUGS && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bugDescription">Describe the bug</Label>
                    <p className="text-sm text-muted-foreground">
                      Provide details and steps to reproduce if possible
                    </p>
                    <textarea
                      id="bugDescription"
                      value={formData.bugDescription}
                      onChange={(e) => setFormData({ ...formData, bugDescription: e.target.value })}
                      rows={5}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                      placeholder="Describe the bug you encountered..."
                    />
                    {errors.bugDescription && (
                      <p className="text-sm text-destructive">{errors.bugDescription}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                </>
              )}

              {selectedType === ContactType.FEEDBACK && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="feedbackText">Please provide your feedback</Label>
                    <textarea
                      id="feedbackText"
                      value={formData.feedbackText}
                      onChange={(e) => setFormData({ ...formData, feedbackText: e.target.value })}
                      rows={5}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                      placeholder="Share your thoughts..."
                    />
                    {errors.feedbackText && (
                      <p className="text-sm text-destructive">{errors.feedbackText}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showPublicly"
                      checked={formData.showPublicly}
                      onChange={(e) => setFormData({ ...formData, showPublicly: e.target.checked })}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="showPublicly" className="cursor-pointer">
                      Would you like us to show this feedback publicly?
                    </Label>
                  </div>

                  {formData.showPublicly && (
                    <div className="space-y-2">
                      <Label htmlFor="displayName">What name would you like it displayed by?</Label>
                      <Input
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        placeholder="Your name or alias"
                      />
                      {errors.displayName && (
                        <p className="text-sm text-destructive">{errors.displayName}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email {formData.showPublicly && <span className="text-destructive">*</span>}
                      {!formData.showPublicly && <span className="text-muted-foreground">(optional)</span>}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                </>
              )}

              {selectedType === ContactType.QUESTIONS && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="questionText">Please add the question</Label>
                    <textarea
                      id="questionText"
                      value={formData.questionText}
                      onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                      rows={5}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                      placeholder="What would you like to know?"
                    />
                    {errors.questionText && (
                      <p className="text-sm text-destructive">{errors.questionText}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                </>
              )}

              {selectedType === ContactType.OTHER && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="messageText">What do you want to talk about?</Label>
                    <textarea
                      id="messageText"
                      value={formData.messageText}
                      onChange={(e) => setFormData({ ...formData, messageText: e.target.value })}
                      rows={5}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                      placeholder="Tell us what's on your mind..."
                    />
                    {errors.messageText && (
                      <p className="text-sm text-destructive">{errors.messageText}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                </>
              )}

              {/* Submit Status */}
              {submitStatus && (
                <Alert 
                  variant={submitStatus.type === 'error' ? 'destructive' : 'default'}
                  className={submitStatus.type === 'success' ? 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100 dark:border-green-800' : ''}
                >
                  <div className="flex items-center gap-2">
                    {submitStatus.type === 'success' && (
                      <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    )}
                    <span className="font-medium">{submitStatus.message}</span>
                  </div>
                </Alert>
              )}

              {/* Submit Button */}
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
    
    <Footer />
  </div>
  );
};

export default ContactPage;
