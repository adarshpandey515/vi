import re

files = {
    'Adarsh Pandey': 'html/adarsh_pandey.html',
    'Kritik Mishra': 'html/kritik_mishra.html'
}

print("\n" + "="*100)
print("DIFFERENCES BETWEEN ADARSH AND KRITIK HTML FILES")
print("="*100 + "\n")

data = {}
for name, filepath in files.items():
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        data[name] = content

# Extract account numbers
print("ACCOUNT IDENTIFIERS:")
print("-" * 100)
for name in files.keys():
    acc_match = re.search(r'"accountNumber":"([^"]+)"', data[name])
    if acc_match:
        print(f"{name:20} Account: {acc_match.group(1)}")

# Extract invoice numbers
print("\nINVOICE INFORMATION:")
print("-" * 100)
for name in files.keys():
    inv_match = re.search(r'"invoiceNumber":"([^"]+)"', data[name])
    total_match = re.search(r'"totalDue":"([^"]+)"', data[name])
    if inv_match and total_match:
        print(f"{name:20} Invoice: {inv_match.group(1):25} Total: {total_match.group(1)}")

# Extract bill breakdown
print("\nBILL BREAKDOWN (Charges):")
print("-" * 100)
for name in files.keys():
    b = re.search(r'"basePlans":"([^"]+)".*?"dataOverage":"([^"]+)".*?"roaming":"([^"]+)".*?"vasServices":"([^"]+)"', data[name], re.DOTALL)
    if b:
        print(f"{name:20} Plans: {b.group(1):12} | DataOvg: {b.group(2):12} | Roaming: {b.group(3):12} | VAS: {b.group(4)}")

# Extract connections
print("\nCONNECTIONS (Primary):")
print("-" * 100)
for name in files.keys():
    phone_match = re.search(r'"phoneNumber":"(\d+)".*?"employeeName":"([^"]+)"', data[name], re.DOTALL)
    if phone_match:
        print(f"{name:20} Phone: {phone_match.group(1):15} | Employee: {phone_match.group(2)}")

# Extract historical data
print("\nHISTORICAL MONTHLY DATA (6 months last column Feb):")
print("-" * 100)
print(f"{'File':<20} {'Months':<50} {'Totals':<50}")
print("-" * 100)
for name in files.keys():
    months_match = re.search(r'"months":\[(.*?)\]', data[name])
    totals_match = re.search(r'"totals":\[(.*?)\]', data[name])
    if months_match and totals_match:
        print(f"{name:20} {months_match.group(1)[:48]:<50}")
        print(f"{' ':<20} {totals_match.group(1)[:48]:<50}")

print("\n" + "="*100)
print("PREVIEW/INTRO SECTION (Static - same for both):")
print("-" * 100)
for name in files.keys():
    amount_match = re.search(r'<strong class="amount">([^<]+)</strong>', data[name])
    acct_match = re.search(r'Account Number: <strong>([^<]+)</strong>', data[name])
    if amount_match and acct_match:
        print(f"{name:20} Preview Account: {acct_match.group(1):15} | Preview Amount: {amount_match.group(1)}")

print("\n" + "="*100)
print("NOTE: Preview section is STATIC (same in both). JSON data is UNIQUE per account.")
print("="*100 + "\n")
