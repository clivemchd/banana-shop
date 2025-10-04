export enum ContactType {
  BUGS = 'Bugs',
  FEEDBACK = 'Feedback',
  QUESTIONS = 'Questions',
  OTHER = 'Other'
}

export interface BugFormData {
  type: ContactType.BUGS;
  bugDescription: string;
  email?: string;
}

export interface FeedbackFormData {
  type: ContactType.FEEDBACK;
  feedbackText: string;
  showPublicly: boolean;
  displayName?: string;
  email?: string;
}

export interface QuestionFormData {
  type: ContactType.QUESTIONS;
  questionText: string;
  email: string;
}

export interface OtherFormData {
  type: ContactType.OTHER;
  messageText: string;
  email?: string;
}

export type ContactFormData = BugFormData | FeedbackFormData | QuestionFormData | OtherFormData;

export interface ContactFormResponse {
  [key: string]: boolean | string | undefined;
  success: boolean;
  message: string;
  responseId?: string;
}
