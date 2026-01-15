import base64
import pandas as pd
import os

# 1. Read the corrupted file content
with open('LongevityTracker_Data_1768477954858.txt', 'r') as f:
    base64_content = f.read()

# 2. Decode base64 to binary
try:
    binary_data = base64.b64decode(base64_content)
    
    # 3. Save as .xlsx file
    xlsx_filename = 'recovered_data.xlsx'
    with open(xlsx_filename, 'wb') as f:
        f.write(binary_data)
        
    print(f"Successfully decoded and saved to {xlsx_filename}")
    
    # 4. Read the Excel file
    df_recovered = pd.read_excel(xlsx_filename)
    print("Recovered data head:")
    print(df_recovered.head())
    print("\nRecovered data info:")
    print(df_recovered.info())
    print(f"\nTotal rows: {len(df_recovered)}")
    
    # 5. Save to CSV for the user
    df_recovered.to_csv('recovered_data.csv', index=False)
    print("\nSuccessfully saved full recovered data to recovered_data.csv")

except Exception as e:
    print(f"Error during recovery: {e}")