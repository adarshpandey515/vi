# Same-Value Investigation and Fix Report

## 1) Stored Match Data (with both files line numbers)
- Pre-fix full overlap: analysis_reports/same_numeric_values_full.json
- Pre-fix suspicious subset: analysis_reports/same_numeric_values_suspicious.csv
- Post-fix focused verification: analysis_reports/post_fix_focus_matches.txt

## 2) Lines that were same and should not be same
- Vi_Enterprise_Combined.html line 682 had static expense stats values like Rs.7,842 / Rs.9,000 / 87% / Rs.1,158.
- html/adarsh_pandey.html line 682 had the same values before fix.
- Vi_Enterprise_Combined.html line 689 had static Monthly Spend Analytics values (Rs.5,890, Rs.6,234, Rs.7,450, Rs.5,720, Rs.6,980, Rs.7,842).
- html/adarsh_pandey.html previously had the same block before fix.

## 3) Root cause
- In convert_dynamic_combined.js, only expense cost-center table was dynamically replaced.
- Expense summary cards and monthly spend analytics card were not replaced from JSON/canonical data.
- Alerts summary cards were also mostly template-static.

## 4) Fix implemented
- Added dynamic generation for expense stats using canonical totals + budget data.
- Replaced full Monthly Spend Analytics card with JSON historical monthly series.
- Added dynamic alerts summary card counts from alertsSummary.
- Kept existing dynamic cost center and employee bill tables.

## 5) Source lines for fix
- Variable build and block HTML generation near convert_dynamic_combined.js lines 435-480.
- Replacement application near convert_dynamic_combined.js lines 770-835.

## 6) Post-fix verification
- html/adarsh_pandey.html now shows dynamic values at expense section:
  - Total Spend: Rs.11,239.75
  - Monthly Budget: Rs.9,427.38
  - Utilization: 119%
  - Remaining: Rs.0
- Monthly Spend Analytics now shows series from historicalMonthlyData: Sep..Feb = 7,235 / 7,260 / 6,519 / 6,710 / 5,859 / 7,279.
- Alerts summary now uses JSON counts (3,5,2,12,11).
