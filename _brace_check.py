from pathlib import Path

path = Path(r'c:\Users\lenovo\OneDrive\Desktop\texcelrators_website\style.css')
text = path.read_text(encoding='utf-8')
stack = []
for line_no, line in enumerate(text.splitlines(), start=1):
    for ch in line:
        if ch == '{':
            stack.append(line_no)
        elif ch == '}':
            if stack:
                stack.pop()
            else:
                print(f'Extra closing brace at line {line_no}')
                raise SystemExit(0)

print(f'Unclosed opening braces: {len(stack)}')
if stack:
    print('Last few unclosed opening brace lines:', stack[-10:])
