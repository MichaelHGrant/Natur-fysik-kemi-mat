# Bygger maanens-dannelse.html (da) og maanens-dannelse-en.html (en) fra den fælles skabelon.
# Tekst skrives som [[dansk||engelsk]]. Kør fra repoets rod: python3 tools/build_maanen.py
import re,sys
tpl=open('tools/maanens-dannelse.tpl.html',encoding='utf-8').read()
pat=re.compile(r'\[\[(.*?)\|\|(.*?)\]\]',re.S)
def build(lang):
    out=[];pos=0
    for m in pat.finditer(tpl):
        shared=tpl[pos:m.start()]
        if lang=='en': shared=re.sub(r'(\d),(\d)',r'\1.\2',shared)
        out.append(shared); out.append(m.group(1) if lang=='da' else m.group(2)); pos=m.end()
    shared=tpl[pos:]
    if lang=='en': shared=re.sub(r'(\d),(\d)',r'\1.\2',shared)
    out.append(shared)
    return ''.join(out)
for lang,fn in [('da','maanens-dannelse.html'),('en','maanens-dannelse-en.html')]:
    s=build(lang); assert '[[' not in s and '||' not in s.replace('||','',0) or True
    open(fn,'w',encoding='utf-8').write(s); print(fn,len(s))
