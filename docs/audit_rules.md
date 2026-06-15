# Audit Rules for MVP

## Purpose
These rules are used to identify potential audit risks from the uploaded journal entries. The application should use only the Excel input and should not require invoices, contracts, or external documents.

## Rule 1: Unbalanced Journal Entry
Flag any JE_ID where total debit does not equal total credit.

Risk level: High  
Reason: Journal entries must balance. An unbalanced entry indicates data quality issue or incomplete posting.

## Rule 2: Duplicate Transaction
Flag transactions with the same:
- Date
- Account_No
- Debit or Credit amount
- Vendor_Customer
- Description

Risk level: High  
Reason: May indicate duplicate payment, duplicate accrual, or duplicate revenue recognition.

## Rule 3: Same Preparer and Approver
Flag entries where Prepared_By equals Approved_By.

Risk level: High  
Reason: Indicates potential segregation of duties weakness.

## Rule 4: Year-End Manual Adjustment
Flag manual entries posted on 31 December.

Risk level: High  
Reason: Year-end manual postings have higher risk of management override or earnings adjustment.

## Rule 5: Late-Night Posting
Flag entries posted after 22:00.

Risk level: Medium  
Reason: Posting outside normal business hours may indicate unusual processing.

## Rule 6: Weekend Posting
Flag entries posted on Saturday or Sunday.

Risk level: Medium  
Reason: Weekend postings may indicate unusual or manual processing.

## Rule 7: Large Round-Number Transaction
Flag transactions where amount is greater than or equal to IDR 50,000,000 and rounded to the nearest IDR 10,000,000.

Risk level: Medium  
Reason: Large round-number entries may indicate estimates, adjustments, or unsupported manual postings.

## Rule 8: Negative Revenue / Revenue Reversal
Flag debit postings to revenue accounts.

Risk level: Medium  
Reason: Debit to revenue may indicate revenue reversal, correction, or unusual sales adjustment.

## Rule 9: Unused Account
Flag accounts in Chart of Accounts that have no journal activity.

Risk level: Low  
Reason: Could indicate outdated or unnecessary chart of account items.

## Rule 10: Unusual Expense Spike
Flag expense accounts where one month is more than 200% of the average monthly amount for that account.

Risk level: Medium  
Reason: May indicate unusual expense activity requiring explanation.

## Finding Output Format
Each finding should include:
- Finding_ID
- Rule_Name
- Risk_Level
- JE_ID
- Date
- Account_No
- Account_Name
- Amount
- Description
- Reason_Flagged
- Financial_Statement_Impact
- Recommended_Audit_Query