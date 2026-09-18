"""Read-only PDF extraction. Retain source vector glyphs and placement; remove background."""
from pathlib import Path
import argparse
import hashlib
import json
import math
import re
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET
import pdfplumber

NS = 'http://www.w3.org/2000/svg'
XLINK = 'http://www.w3.org/1999/xlink'
ET.register_namespace('',NS)
ET.register_namespace('xlink',XLINK)
BG = 'rgb(97.253418%, 98.03772%, 98.822021%)'
GRID = 'rgb(90.979004%, 93.72406%, 95.684814%)'

def bounds(d):
    toks = re.findall(r'[MLCZ]|-?\d+(?:\.\d+)?',d)
    i=0; pt=(0,0); start=(0,0); points=[]
    while i<len(toks):
        c=toks[i]; i+=1
        if c in ('M','L'):
            pt=(float(toks[i]),float(toks[i+1])); i+=2
            if c=='M': start=pt
            points.append(pt)
        elif c=='C':
            p0=pt; p1=(float(toks[i]),float(toks[i+1])); p2=(float(toks[i+2]),float(toks[i+3])); p3=(float(toks[i+4]),float(toks[i+5])); i+=6
            ts={0,1}
            for k in range(2):
                a=-p0[k]+3*p1[k]-3*p2[k]+p3[k]; b=2*(p0[k]-2*p1[k]+p2[k]); cc=p1[k]-p0[k]
                if abs(a)<1e-10:
                    if abs(b)>1e-10: ts.add(-cc/b)
                else:
                    disc=b*b-4*a*cc
                    if disc>=0:
                        ts.add((-b+math.sqrt(disc))/(2*a)); ts.add((-b-math.sqrt(disc))/(2*a))
            for t in ts:
                if 0<=t<=1:
                    points.append(tuple((1-t)**3*p0[k]+3*(1-t)**2*t*p1[k]+3*(1-t)*t*t*p2[k]+t**3*p3[k] for k in range(2)))
            pt=p3
        elif c=='Z': pt=start
        else: raise ValueError(c)
    if not points:return [0,0,0,0]
    return [round(v,6) for v in (min(p[0] for p in points), min(p[1] for p in points), max(p[0] for p in points), max(p[1] for p in points))]



def extract(source, output_dir, pdftocairo, temporary):
    pages=[]
    with pdfplumber.open(source) as pdf:
        for n,page in enumerate(pdf.pages,1):
            original_svg = temporary / f'page-{n}.original.svg'
            subprocess.run([pdftocairo, '-svg', '-f', str(n), '-l', str(n), str(source), str(original_svg)], check=True)
            root=ET.parse(original_svg).getroot()
            removed={'pageFill':0,'gridPaths':0,'badgeFills':0}
            for node in list(root):
                if node.tag==f'{{{NS}}}rect' and node.get('fill')==BG:
                    root.remove(node); removed['pageFill']+=1
                elif node.tag==f'{{{NS}}}path' and node.get('stroke')==GRID:
                    root.remove(node); removed['gridPaths']+=1
            # Namespace glyph definitions to avoid collisions when both pages are inline.
            for node in root.iter():
                if node.get('id'):node.set('id',f'p{n}-{node.get("id")}')
                if node.get(f'{{{XLINK}}}href'):
                    node.set(f'{{{XLINK}}}href',f'#p{n}-{node.get(f"{{{XLINK}}}href")[1:]}')
            defs={}
            for g in root.findall(f'./{{{NS}}}defs/{{{NS}}}g/{{{NS}}}g'):
                d=' '.join(p.get('d','') for p in g.findall(f'./{{{NS}}}path'))
                defs[g.get('id')]={'d':d,'bounds':bounds(d)}
            glyphs=[]; graphics=[]; groups=[]; char_cursor=0
            for idx,node in enumerate(list(root)):
                if node.tag==f'{{{NS}}}g':
                    group_id=f'p{n}-line-{len(groups)}'; node.set('data-line',group_id)
                    text=''
                    for use in node:
                        assert use.tag==f'{{{NS}}}use'
                        char=page.chars[char_cursor];char_cursor+=1
                        x=float(use.get('x')); y=float(use.get('y'))
                        # Cairo rounds glyph positioning; source baselines are unchanged.
                        assert abs(x-char['matrix'][4])<.012, (n,x,char['matrix'])
                        assert abs(y-(float(page.height)-char['matrix'][5]))<.001
                        key=use.get(f'{{{XLINK}}}href')[1:]
                        bb=defs[key]['bounds']
                        glyphs.append({'id':f'p{n}-char-{len(glyphs)}','key':key,'x':x,'y':y,'fill':node.get('fill'),'text':char['text'],'font':char['fontname'],'size':char['size'],'line':group_id,'bounds':[round(bb[0]+x,6),round(bb[1]+y,6),round(bb[2]+x,6),round(bb[3]+y,6)]})
                        use.set('data-char',str(len(glyphs)-1));text+=char['text']
                    groups.append({'id':group_id,'text':text,'y':float(node[0].get('y')) if len(node) else 0,'glyphStart':len(glyphs)-len(node),'glyphCount':len(node)})
                elif node.tag==f'{{{NS}}}path':
                    gid=f'p{n}-graphic-{len(graphics)}';node.set('data-graphic',gid)
                    graphics.append({'id':gid,'attrs':dict(node.attrib),'bounds':bounds(node.get('d',''))})
            assert char_cursor==len(page.chars)
            ET.ElementTree(root).write(output_dir/f'page-{n}.svg',encoding='utf-8',xml_declaration=True)
            pages.append({'page':n,'width':int(page.width),'height':int(page.height),'definitions':defs,'glyphs':glyphs,'graphics':graphics,'lines':groups,'removed':removed,'text':page.extract_text(layout=False)})
    manifest={'source':source.name,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'extraction':'Poppler pdftocairo SVG with outlined embedded fonts; no runtime font substitution','pages':pages}
    (output_dir/'resume-vectors.json').write_text(json.dumps(manifest,separators=(',',':')))
    summary={'source':manifest['source'],'sourceSha256':manifest['sourceSha256'],'pages':[{'page':p['page'],'dimensions':[p['width'],p['height']],'glyphsIncludingSpaces':len(p['glyphs']),'visibleGlyphs':sum(bool(p['definitions'][g['key']]['d'].strip()) for g in p['glyphs']),'graphics':len(p['graphics']),'lineGroups':len(p['lines']),'fonts':sorted(set(g['font'] for g in p['glyphs'])),'removed':p['removed']} for p in pages]}
    (output_dir/'extraction-summary.json').write_text(json.dumps(summary,indent=2))
    print(json.dumps(summary,indent=2))
    return summary


def main():
    repo_root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(
        description="Extract the resume's embedded glyph outlines and placement into transparent SVGs and animation data."
    )
    parser.add_argument(
        'source', nargs='?', type=Path,
        default=repo_root / 'public' / 'resume-assets' / 'Rico_Garcia_Resume.pdf',
        help='Source PDF; defaults to public/resume-assets/Rico_Garcia_Resume.pdf in this repository.',
    )
    parser.add_argument(
        '--output-dir', type=Path,
        default=repo_root / 'public' / 'resume-assets',
        help='Output directory for page-N.svg, resume-vectors.json, and extraction-summary.json.',
    )
    parser.add_argument(
        '--pdftocairo', default=shutil.which('pdftocairo'),
        help='Path to Poppler pdftocairo; defaults to the executable on PATH.',
    )
    args = parser.parse_args()
    if not args.source.is_file():
        parser.error(f'Source PDF does not exist: {args.source}')
    if not args.pdftocairo:
        parser.error('pdftocairo was not found on PATH. Supply --pdftocairo /path/to/pdftocairo.')
    executable = shutil.which(args.pdftocairo)
    if executable is None:
        parser.error(f'pdftocairo is not executable: {args.pdftocairo}')
    args.output_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='resume-vectors-') as temporary:
        extract(args.source.resolve(), args.output_dir.resolve(), executable, Path(temporary))


if __name__ == '__main__':
    main()
