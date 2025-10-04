# Contact Form - Quick Start

## ✅ What's Been Implemented

A complete contact form system with:
- 4 contact types: Bugs, Feedback, Questions, Other
- Dynamic conditional fields based on selection
- **Google Sheets API integration** for data storage
- Full type safety and validation
- Responsive UI with ShadCN components
- Linked from footer

## 🚀 Quick Setup (2 steps!)

### 1. Enable Google Sheets API

```bash
# Go to Google Cloud Console
# https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=banana-shop-470810
# Click "ENABLE"
```

### 2. First Form Submission

- The system will automatically create a Google Sheet on first submission
- Check server logs for the Spreadsheet ID and URL
- Add it to `.env.server` (optional but recommended):
  ```bash
  GOOGLE_SHEETS_CONTACT_ID=your-spreadsheet-id-here
  ```

That's it! 🎉

## 📍 Access Points

- **URL**: `/contact`
- **Footer Link**: Company > Contact
- **Component**: `src/client/pages/contact/contact-page.tsx`
- **Submissions**: Google Sheets (link in server logs)

## 📋 Form Fields by Type

### Bugs
- Description (required, min 10 chars)
- Email (optional)

### Feedback
- Feedback text (required, min 10 chars)
- Show publicly checkbox
- Display name (if public)
- Email (required if public, optional otherwise)

### Questions
- Question (required, min 10 chars)
- Email (required)

### Other
- Message (required, min 10 chars)
- Email (optional)

## 📊 Viewing Submissions

All submissions are stored in a Google Spreadsheet with columns:
- Timestamp
- Type (Bugs/Feedback/Questions/Other)
- Message
- Email
- Display Name
- Show Publicly
- IP Address

**Access**: Check server logs for the direct spreadsheet URL, or go to sheets.google.com and find "NanoStudio Contact Form Submissions"

## 📧 Email Notifications (Optional)

### Option 1: Google Apps Script
Add this to your spreadsheet (Extensions > Apps Script):

```javascript
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() === 'Submissions' && e.range.getRow() > 1) {
    const row = e.range.getRow();
    const data = sheet.getRange(row, 1, 1, 7).getValues()[0];
    
    MailApp.sendEmail({
      to: 'your-email@example.com',
      subject: `New Contact: ${data[1]}`,
      body: `Type: ${data[1]}\nMessage: ${data[2]}\nEmail: ${data[3]}`
    });
  }
}
```

### Option 2: Connect Google Form
Create a Google Form, link it to the same spreadsheet, and enable email notifications.

## 🗂️ Files Created

```
src/
├── client/pages/contact/
│   ├── contact-page.tsx          ✅ Main form component
│   └── contact-form-schema.ts    ✅ Validation (optional)
├── server/contact/
│   ├── contact-operations.ts     ✅ Wasp action
│   └── google-forms-service.ts   ✅ Google Sheets integration
├── shared/
│   └── contact-types.ts          ✅ TypeScript types
└── docs/
    ├── CONTACT_FORM_SETUP.md     ✅ Full documentation
    └── CONTACT_FORM_README.md    ✅ This file

main.wasp                         ✅ Updated with route & action
.env.server                       ✅ Added GOOGLE_SHEETS_CONTACT_ID
footer.tsx                        ✅ Updated contact link
package.json                      ✅ Added googleapis
```

## 🎯 Benefits

- ✅ **Free** - No cost for submissions
- ✅ **Easy Viewing** - All data in organized spreadsheet
- ✅ **Export Capability** - Download as CSV, Excel, etc.
- ✅ **No Database Needed** - Stored in Google Sheets
- ✅ **Uses Existing Credentials** - Same GCP setup
- ✅ **Searchable & Filterable** - Built-in Sheets features
- ✅ **Shareable** - Share with team members

## 🧪 Testing

1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:3000/contact`
3. Fill out and submit the form
4. Check server logs for spreadsheet URL (first time)
5. View submission in Google Sheets

## ⚠️ Important Notes

- First submission creates the spreadsheet automatically
- Copy the spreadsheet ID from logs to `.env.server` (optional)
- Spreadsheet is created with service account as owner
- You can share it with your Google account to access easily
- Same GCP credentials are used (already configured)

## 📖 Full Documentation

See `docs/CONTACT_FORM_SETUP.md` for:
- Detailed setup instructions
- Email notification setup
- Troubleshooting guide
- How it works internally
- Alternative approaches

---

**Ready to use!** Just enable the Google Sheets API and submit your first form. 🚀
