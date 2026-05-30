from pypdf import PdfReader

pdf_path = r'c:\Users\lenovo\OneDrive\Desktop\texcelrators_website\assets\CLUB SOP.pdf'
reader = PdfReader(pdf_path)
print(f'PAGES {len(reader.pages)}')
for idx, page in enumerate(reader.pages, start=1):
    text = page.extract_text() or ''
    print(f'\n--- PAGE {idx} ---\n')
    print(text)
