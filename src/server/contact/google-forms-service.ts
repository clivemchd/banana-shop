import { google } from 'googleapis';
import type { ContactFormData } from '../../shared/contact-types';
import { ContactType } from '../../shared/contact-types';

/**
 * Get Google Sheets API client with proper authentication
 * We use Sheets instead of Forms API because Forms API doesn't support
 * programmatic response submission
 */
function getSheetsClient() {
  const isProduction = process.env.NODE_ENV === 'production';

  let auth;

  if (isProduction) {
    const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
    
    if (!credentialsBase64) {
      throw new Error('GOOGLE_CREDENTIALS_BASE64 environment variable is required in production');
    }
    
    try {
      const credentialsString = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
      const credentials = JSON.parse(credentialsString);
      
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file'
        ]
      });
    } catch (error) {
      throw new Error('Failed to parse GOOGLE_CREDENTIALS_BASE64: ' + (error as Error).message);
    }
  } else {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is required in development');
    }

    // Use the environment variable directly - GoogleAuth will handle reading the file
    process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    auth = new google.auth.GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file'
      ]
    });
  }

  return google.sheets({ version: 'v4', auth });
}

/**
 * Get or create the contact submissions spreadsheet
 */
async function getOrCreateSpreadsheet(): Promise<string> {
  // Check if we have a spreadsheet ID in env
  const existingSheetId = process.env.GOOGLE_SHEETS_CONTACT_ID;
  
  if (existingSheetId) {
    console.log('Using existing spreadsheet:', existingSheetId);
    return existingSheetId;
  }

  // If no existing sheet, we need to create one
  // Note: The service account needs to have permissions to create sheets
  console.log('No GOOGLE_SHEETS_CONTACT_ID found, creating new spreadsheet...');
  
  const sheets = getSheetsClient();

  try {
    // Create a new spreadsheet
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `NanoStudio Contact Form - ${new Date().toISOString().split('T')[0]}`
        },
        sheets: [
          {
            properties: {
              title: 'Submissions',
              gridProperties: {
                frozenRowCount: 1 // Freeze header row
              }
            }
          }
        ]
      }
    });

    const spreadsheetId = response.data.spreadsheetId;
    
    if (!spreadsheetId) {
      throw new Error('Failed to create spreadsheet - no ID returned');
    }

    console.log('Created new spreadsheet:', spreadsheetId);
    console.log('Add this to your .env.server: GOOGLE_SHEETS_CONTACT_ID=' + spreadsheetId);

    // Add headers to the sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1:I1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          [
            'Timestamp',
            'Type',
            'Name',
            'Email',
            'Bug Details',
            'Feedback',
            'Question',
            'Other',
            'Environment'
          ]
        ]
      }
    });

    return spreadsheetId;
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    throw new Error('Failed to create spreadsheet. Please create one manually and add GOOGLE_SHEETS_CONTACT_ID to .env.server');
  }
}

/**
 * Ensure the spreadsheet has headers
 */
async function ensureHeaders(sheets: ReturnType<typeof getSheetsClient>, spreadsheetId: string) {
  try {
    // Check if headers exist
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A1:I1',
    });

    const values = response.data.values;
    
    // If no headers or incomplete headers, add them
    if (!values || values.length === 0 || values[0].length < 9) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Sheet1!A1:I1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'Timestamp',
            'Type',
            'Name',
            'Email',
            'Bug Details',
            'Feedback',
            'Question',
            'Other',
            'Environment'
          ]]
        }
      });
      console.log('✅ Headers added to spreadsheet');
    }
  } catch (error) {
    console.error('Error checking/adding headers:', error);
    // Continue anyway - the append will still work
  }
}

/**
 * Submit contact form data to Google Sheets
 */
export async function submitToGoogleForms(formData: ContactFormData): Promise<{ success: boolean; message: string; responseId?: string }> {
  try {
    const sheets = getSheetsClient();
    
    // Get spreadsheet ID from environment or create new spreadsheet
    let spreadsheetId = process.env.GOOGLE_SHEETS_CONTACT_ID;
    
    if (!spreadsheetId) {
      spreadsheetId = await getOrCreateSpreadsheet();
      // In production, you should save this spreadsheetId to your environment variables
      const isDevelopment = process.env.NODE_ENV !== 'production';
      if (isDevelopment) {
        console.log('📊 Created new spreadsheet with ID:', spreadsheetId);
        console.log('Add this to your .env.server: GOOGLE_SHEETS_CONTACT_ID=' + spreadsheetId);
        console.log('View spreadsheet: https://docs.google.com/spreadsheets/d/' + spreadsheetId);
      }
    }

    // Ensure headers are present
    await ensureHeaders(sheets, spreadsheetId);

    // Prepare row data - match the header columns exactly
    // Format timestamp as readable date (Google Sheets will auto-format this)
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    
    const environment = process.env.NODE_ENV === 'production' ? 'Production' : 'Development';
    
    const rowData = [
      timestamp,                                    // Timestamp
      formData.type,                               // Type
      '',                                          // Name (placeholder)
      '',                                          // Email (placeholder)
      '',                                          // Bug Details
      '',                                          // Feedback
      '',                                          // Question
      '',                                          // Other
      environment                                  // Environment
    ];

    // Fill in the appropriate columns based on form type
    switch (formData.type) {
      case ContactType.BUGS:
        rowData[3] = formData.email || '';         // Email
        rowData[4] = formData.bugDescription;      // Bug Details
        break;
      case ContactType.FEEDBACK:
        rowData[2] = formData.displayName || '';   // Name
        rowData[3] = formData.email || '';         // Email
        rowData[5] = formData.feedbackText + (formData.showPublicly ? ' [Show Publicly]' : ''); // Feedback
        break;
      case ContactType.QUESTIONS:
        rowData[3] = formData.email;               // Email
        rowData[6] = formData.questionText;        // Question
        break;
      case ContactType.OTHER:
        rowData[3] = formData.email || '';         // Email
        rowData[7] = formData.messageText;         // Other
        break;
    }

    // Append row to spreadsheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:I',
      valueInputOption: 'RAW',
      requestBody: {
        values: [rowData]
      }
    });

    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (isDevelopment) {
      console.log('✅ Contact form submission saved to Google Sheets');
      console.log('Type:', formData.type);
      console.log('Spreadsheet:', `https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
    }

    return {
      success: true,
      message: 'Form submitted successfully',
      responseId: timestamp
    };
  } catch (error) {
    console.error('Error submitting to Google Sheets:', error);
    return {
      success: false,
      message: 'Failed to submit form: ' + (error as Error).message
    };
  }
}
