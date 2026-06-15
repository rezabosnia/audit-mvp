# Audit MVP Requirements

## Objective
Build a simple audit support application that receives an Excel file containing Chart of Accounts and Journal Entries, then produces financial statements, audit risk findings, and detailed audit workpapers.

## Input Excel Structure

### Sheet 1: Chart_of_Accounts
Required columns:
- Account_No
- Account_Name
- Account_Type
- FS_Category
- Normal_Balance

### Sheet 2: Journal_Entries
Required columns:
- Date
- Time
- JE_ID
- Account_No
- Debit
- Credit
- Description
- Vendor_Customer
- Prepared_By
- Approved_By
- Entry_Type

## Core Features

### Feature 1: Financial Statement Generation
The app should generate:
- Trial Balance
- Balance Sheet
- Profit & Loss Statement
- Key metrics

Key metrics:
- Total Assets
- Total Liabilities
- Total Equity
- Revenue
- Net Income
- Current Ratio
- Debt-to-Equity Ratio
- Net Profit Margin

### Feature 2: Audit Risk and Anomaly Detection
The app should detect:
- Duplicate transactions
- Weekend postings
- Late-night postings
- Large round-number transactions
- Year-end manual adjustments
- Same preparer and approver
- Negative revenue reversals
- Unused accounts
- Unbalanced journal entries

Each finding should include:
- Risk title
- Risk level
- JE_ID
- Account
- Amount
- Explanation
- Audit impact
- Recommended follow-up

### Feature 3: Detailed Audit Workpaper Generation
The app should generate detailed audit workpapers, not generic summaries.

Each workpaper should include:
- Workpaper ID
- Audit area
- Objective
- Scope
- Procedures performed
- Detailed findings
- Highlighted journal entries
- Risk rating
- Financial statement impact
- Recommended audit query
- Conclusion

## Output Pages

### Dashboard
Show:
- Total journal entries
- Total accounts
- Total assets
- Revenue
- Net income
- Number of findings
- High-risk findings

### Financial Statements
Show:
- Trial Balance
- Balance Sheet
- P&L

### Audit Findings
Show table of flagged transactions.

Columns:
- Risk Level
- Finding Type
- JE_ID
- Date
- Account
- Amount
- Reason
- Recommendation

### Audit Workpaper
Generate structured audit workpaper based on the findings.

## Design Principle
This MVP should work using only the uploaded Excel file. It should not require invoices, contracts, PDFs, or external supporting documents.