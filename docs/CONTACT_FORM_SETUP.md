# Contact Form Implementation

This document explains the contact form implementation using Google Sheets API.

## Overview

The contact form allows users to submit different types of inquiries:
- **Bugs**: Report issues with optional email
- **Feedback**: Provide feedback with option to display publicly
- **Questions**: Ask questions (email required)
- **Other**: General messages with optional email

## Features

- Dynamic form fields based on selected type
- Client-side validation
- **Google Sheets API integration** for submission storage
- Can be connected to Google Forms for email notifications (optional)
- No additional database tables required
- View and export submissions easily from Google Sheets

## Setup Instructions

### 1. Google Cloud Console Setup

The project already has GCP credentials configured. The same credentials work for Google Sheets API.

### 2. Enable Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `banana-shop-470810`
3. Navigate to **APIs & Services** > **Library**
4. Search for "Google Sheets API"
5. Click **Enable**

### 3. Service Account Permissions

The existing service account (`banana-shop-creds@banana-shop-470810.iam.gserviceaccount.com`) automatically gets the necessary permissions. The code requests:
- `https://www.googleapis.com/auth/spreadsheets`

### 4. Environment Variables

Add to `.env.server`:

```bash
# Optional: Hardcode an existing spreadsheet ID to avoid creating a new one
GOOGLE_SHEETS_CONTACT_ID=your-spreadsheet-id-here
```

**Note**: If you don't set `GOOGLE_SHEETS_CONTACT_ID`, the system will create a new spreadsheet automatically on first submission and log the spreadsheet ID to the console. You should then add it to your environment variables.

### 5. First Run

On the first form submission (if `GOOGLE_SHEETS_CONTACT_ID` is not set):
1. A new Google Sheet will be created automatically named "NanoStudio Contact Form Submissions"
2. Check the server logs for output like:
   ```
   📊 Created new spreadsheet with ID: abc123xyz
   Add this to your .env.server: GOOGLE_SHEETS_CONTACT_ID=abc123xyz
   View spreadsheet: https://docs.google.com/spreadsheets/d/abc123xyz
   ```
3. Add the spreadsheet ID to your `.env.server` file
4. Restart the server

### 6. Access the Form

Users can access the contact form at:
- Development: `http://localhost:3000/contact`
- Production: `https://yourdomain.com/contact`

Also linked from the footer under "Company" > "Contact"

## How It Works

1. **User fills out the form** on `/contact`
2. **Client-side validation** ensures all required fields are filled correctly
3. **Form data is submitted** to the server via Wasp action
4. **Server appends a row** to Google Sheets with proper authentication
5. **User sees success message**
6. **You view submissions** in Google Sheets

## Viewing Submissions

1. Check server logs for the spreadsheet URL
2. Or go to [Google Sheets](https://sheets.google.com/)
3. Find "NanoStudio Contact Form Submissions"
4. View all submissions in a structured table format

### Spreadsheet Columns

| Timestamp | Type | Message | Email | Display Name | Show Publicly | IP Address |
|-----------|------|---------|-------|--------------|---------------|------------|

## Email Notifications (Optional)

To receive email notifications for new submissions, you can:

### Option 1: Google Forms Integration
1. Create a Google Form manually
2. Link it to the same spreadsheet
3. Enable email notifications in the Form settings

### Option 2: Google Apps Script
1. Open your spreadsheet
2. Extensions > Apps Script
3. Add this script:
```javascript
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() === 'Submissions' && e.range.getRow() > 1) {
    const row = e.range.getRow();
    const data = sheet.getRange(row, 1, 1, 7).getValues()[0];
    
    MailApp.sendEmail({
      to: 'your-email@example.com',
      subject: `New Contact Form: ${data[1]}`,
      body: `
        Type: ${data[1]}
        Message: ${data[2]}
        Email: ${data[3]}
        Display Name: ${data[4]}
        Show Publicly: ${data[5]}
        Timestamp: ${data[0]}
      `
    });
  }
}
```
4. Save and authorize the script
5. Set up a trigger: Triggers > Add Trigger > onChange

## File Structure

```
src/
├── client/
│   └── pages/
│       └── contact/
│           ├── contact-page.tsx          # Main form component
│           └── contact-form-schema.ts    # (Optional) Validation schemas
├── server/
│   └── contact/
│       ├── contact-operations.ts         # Wasp action handler
│       └── google-forms-service.ts       # Google Sheets API integration
└── shared/
    └── contact-types.ts                  # Shared TypeScript types
```

## Troubleshooting

### Form not submitting

- Check browser console for errors
- Verify Google Sheets API is enabled in GCP
- Check server logs for detailed error messages

### Authentication errors

- Verify `GOOGLE_CREDENTIALS_BASE64` (production) or `GOOGLE_APPLICATION_CREDENTIALS` (development) is set correctly
- Ensure the service account has spreadsheets permission

### Can't find the spreadsheet

- Check server logs for the spreadsheet URL
- The spreadsheet is created with the service account as owner
- Share it with your Google account if needed

### No email notifications

- Implement one of the optional email notification methods above
- Or manually check the spreadsheet periodically

## Benefits of This Approach

✅ **Free**: Google Sheets API is free within generous quotas  
✅ **Easy to view**: All submissions in one organized spreadsheet  
✅ **Export capability**: Download as CSV, Excel, etc.  
✅ **No extra database**: Submissions stored in Google Sheets  
✅ **Existing credentials**: Uses same GCP account already configured  
✅ **Searchable**: Use Sheets' built-in search and filter  
✅ **Shareable**: Can share spreadsheet with team members

## Alternative Approaches

If you encounter issues with Google Sheets API, consider:
1. **Database storage**: Store in your own database table
2. **Email service**: Use services like Resend, SendGrid, or Mailgun
3. **Form services**: Use Formspree, Tally, or similar

Let me know if you need help switching to any of these alternatives!
