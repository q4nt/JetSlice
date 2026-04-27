import codecs
import re

files = ['c:/Users/jcjur/lux_delivery/index.html', 'c:/Users/jcjur/lux_delivery/app.js', 'c:/Users/jcjur/lux_delivery/style.css']

def replacer(match):
    char = match.group(0)
    # Convert obvious characters back to ascii
    if char in '“”': return '\"'
    if char in '‘’': return '\''
    if char == '→': return '->'
    if char == '•': return '-'
    if char == 'é': return 'e'
    if char == '°': return ' deg '
    return ''

for file in files:
    try:
        with codecs.open(file, 'r', 'utf-8') as f:
            text = f.read()
    except Exception as e:
        print(f"Skipping {file}: {e}")
        continue

    # First fix the double-encoded mojibake from cp1252 corruption
    # We will just replace ALL non-ascii with empty strings since the user said NO NON ENGLISH CHARACTERS ALLOWED
    # Wait, if we just regex replace all non-ascii, the mojibake will be wiped out which is fine except we lose the text?
    # No, mojibake is like 'Ã¢â‚¬Â¢' which contains 'Ã' and '¢'.
    # If we just replace [^\x00-\x7F]+ with '', 'Ã¢â‚¬Â¢' becomes ''
    # 'Alinea Chicago Ã¢â‚¬Â Ã¢â‚¬â„¢ Miami Estate' -> 'Alinea Chicago  Miami Estate' which misses the arrow
    
    # Try decoding if possible
    def try_fix_mojibake(t):
        try:
            # If it was accidentally encoded as cp1252 instead of utf-8
            return t.encode('cp1252').decode('utf-8')
        except:
            return t
            
    # Actually just string replace the known ones first
    t = text
    t = t.replace('Ã¢â€ â€™', '->').replace('ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢', '->').replace('Ã¢â‚¬â€œ', '-').replace('Ã¢â‚¬â€\x9d', '-').replace('Ã¢â‚¬Â¢', '-')
    t = t.replace('ÃƒÆ’Ã‚Â©', 'e').replace('ÃƒÂ©', 'e')
    t = t.replace('Ã°Å¸Â¥Â©', '[Meat]').replace('Ã°Å¸Â\x8dÂ¾', '[Wine]').replace('Ã°Å¸Â\x8dâ€¢', '[Pizza]')
    t = t.replace('Ã‚Â°', ' deg ').replace('Ã¢Å“Â¨', '[Sparkle]').replace('Ã¢Å“Ë\x90Ã¯Â¸Â\x8f', '[Plane]')
    t = t.replace('Ã‚Â·', '-').replace('Ã¢Ëœâ€¦', '*')
    
    # Now replace ALL remaining non-ascii
    new_text = re.sub(r'[^\x00-\x7F]+', replacer, t)
    
    if new_text != text:
        with codecs.open(file, 'w', 'utf-8') as f:
            f.write(new_text)
        print(f"Cleaned {file}")
    else:
        print(f"{file} already clean")
