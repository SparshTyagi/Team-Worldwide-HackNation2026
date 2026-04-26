import re

with open("/Users/imad.azizi/Code/Team-Worldwide-HackNation2026/frontend/src/components/spot/Screens.tsx", "r") as f:
    content = f.read()

# Replace Acc toggle
content = re.sub(
    r'<span className={`w-9 h-5 rounded-full p-0.5 flex transition-all \${accs\[idx\] \? "bg-\[var\(--terracotta\)\] justify-end" : "bg-\[var\(--border\)\] justify-start"}`}>\s*<span className="w-4 h-4 rounded-full bg-white shadow" />\s*</span>',
    r'<span className={`relative w-[36px] h-[20px] rounded-full transition-colors duration-300 ease-out ${accs[idx] ? "bg-[var(--terracotta)]" : "bg-[var(--border)]"}`}><span className={`absolute top-[2px] left-[2px] w-[16px] h-[16px] rounded-full bg-white shadow-sm transition-transform duration-300 ease-out ${accs[idx] ? "translate-x-[16px]" : "translate-x-0"}`} /></span>',
    content
)

# Replace Settings toggle
content = re.sub(
    r'<div className={`w-11 h-6 rounded-full p-0\.5 flex transition-all \${toggles\[idx\] \? "bg-\[var\(--terracotta\)\] justify-end" : "bg-\[var\(--forest\)\]/20 justify-start"}`}>\s*<div className="w-5 h-5 rounded-full bg-white shadow-sm" />\s*</div>',
    r'<div className={`relative w-11 h-6 rounded-full transition-colors duration-300 ease-out ${toggles[idx] ? "bg-[var(--terracotta)]" : "bg-[var(--forest)]/20"}`}><div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out ${toggles[idx] ? "translate-x-5" : "translate-x-0"}`} /></div>',
    content
)

# Add active:scale-95 and transition to solid buttons
def replace_button(m):
    cls = m.group(1)
    if "active:scale-" not in cls and "transition" not in cls:
        cls += " active:scale-95 transition-all duration-300"
    elif "transition" in cls and "active:scale-" not in cls:
        cls += " active:scale-95 duration-300"
    return f'<button{m.group(0).replace(m.group(1), cls)}'

content = re.sub(r'<button[^>]*className="([^"]+)"', lambda m: m.group(0).replace(m.group(1), m.group(1) + (" active:scale-95 transition-all duration-300" if "active:scale-95" not in m.group(1) else "")), content)

# Clean up any potential double additions
content = content.replace(" active:scale-95 transition-all duration-300 active:scale-95 transition-all duration-300", " active:scale-95 transition-all duration-300")

with open("/Users/imad.azizi/Code/Team-Worldwide-HackNation2026/frontend/src/components/spot/Screens.tsx", "w") as f:
    f.write(content)

