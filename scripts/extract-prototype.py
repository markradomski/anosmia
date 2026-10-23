#!/usr/bin/env python3
"""One-shot extraction of the Anosmia prototype from the exported bundle.

Reads references/ANOSMIA — Wine beyond aroma.html (left unchanged) and writes:
  references/prototype/template.html   the prototype's raw template (for diffing)
  references/prototype/logic.js        the prototype's raw logic class (for diffing)
  src/anosmia/AnosmiaView.tsx          the template converted to JSX
  src/styles/prototype.css             the prototype's global CSS, verbatim
  src/styles/fonts.css                 @font-face rules for the embedded fonts
  src/assets/fonts/*.woff2             the embedded (latin subset) font files

The JSX conversion mirrors the dc-runtime's rendering rules:
  - <sc-if value="{{x}}">   -> {v.x ? <>…</> : null}
  - <sc-for list="{{xs}}" as="r"> -> {v.xs.map((r, i) => <Fragment key={i}>…</Fragment>)}
  - {{path}} resolves against the loop variables in scope, else the render values `v`
  - whitespace-only text is dropped unless it contains a space (then it renders as " "); the
    converter also omits it where CSS can never render it: inside statically flex/grid
    containers, and as the first/last child of a non-inline element
  - sc-camel-* attributes become camelCase props; hint-* attributes are editor-only and dropped
  - static style attributes become style objects; computed ones go through css(), which sets cssText

Usage: python3 -I scripts/extract-prototype.py   (run from the project root)
"""
import base64
import gzip
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'references' / 'ANOSMIA — Wine beyond aroma.html'
PAGE_TITLE = '<title>Anosmia prototype</title>'


# ---------- bundle unpacking ----------

def bundle_block(html, kind):
    m = re.search(r'<script type="__bundler/%s">(.*?)</script>' % re.escape(kind), html, re.S)
    return json.loads(m.group(1)) if m else None


def unpack(entry):
    data = base64.b64decode(entry['data'])
    return gzip.decompress(data) if entry.get('compressed') else data


def load_prototype():
    root = SOURCE.read_text(encoding='utf-8')
    for entry in bundle_block(root, 'manifest').values():
        if entry['mime'] != 'text/html':
            continue
        page = unpack(entry).decode('utf-8')
        template = bundle_block(page, 'template')
        if template and PAGE_TITLE in template:
            assets = {uuid: (e['mime'], unpack(e)) for uuid, e in bundle_block(page, 'manifest').items()}
            return template, assets
    sys.exit('prototype page not found in bundle')


# ---------- template parsing ----------

VOID = {'input', 'br', 'img', 'hr', 'meta', 'link', 'source', 'area', 'col', 'embed', 'wbr', 'track', 'param'}


class Node:
    def __init__(self, tag, attrs=None):
        self.tag, self.attrs, self.children = tag, attrs or [], []


class TreeBuilder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('#root')
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.stack[-1].children.append(Node(tag, attrs))

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        assert self.stack[-1].tag == tag, 'unbalanced </%s> (open: %s)' % (tag, self.stack[-1].tag)
        self.stack.pop()

    def handle_data(self, data):
        self.stack[-1].children.append(data)

    def handle_comment(self, data):
        self.stack[-1].children.append(('comment', data.strip()))


# ---------- JSX emission ----------

BINDING = re.compile(r'\{\{([\s\S]+?)\}\}')
PATH = re.compile(r'^[A-Za-z_$][\w$]*(\.[\w$]+)*$')
ATTR_RENAMES = {'class': 'className', 'for': 'htmlFor', 'autocomplete': 'autoComplete', 'tabindex': 'tabIndex',
                'readonly': 'readOnly', 'maxlength': 'maxLength', 'inputmode': 'inputMode'}
NUMERIC_ATTRS = {'rows', 'cols', 'tabIndex', 'maxLength'}
# The logic yields these as 'true' / 'false' strings; the cast only narrows the type for React.
ARIA_BOOL = {'aria-pressed', 'aria-selected', 'aria-checked', 'aria-expanded'}


def camel(name):
    return re.sub(r'-([a-z])', lambda m: m.group(1).upper(), name)


def resolve(path, scope):
    path = path.strip()
    assert PATH.match(path), 'unsupported binding {{%s}}' % path
    return path if path.split('.')[0] in scope else 'v.' + path


def js_str(s):
    return json.dumps(s, ensure_ascii=False)


def template_literal(text, scope):
    parts = BINDING.split(text)
    out = ''
    for i, p in enumerate(parts):
        if i % 2:
            out += '${' + resolve(p, scope) + '}'
        else:
            out += p.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
    return '`' + out + '`'


def split_decls(css):
    decls, buf, depth, quote = [], '', 0, None
    for ch in css:
        if quote:
            quote = None if ch == quote else quote
        elif ch in '\'"':
            quote = ch
        elif ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
        elif ch == ';' and depth == 0:
            decls.append(buf)
            buf = ''
            continue
        buf += ch
    decls.append(buf)
    return [d.strip() for d in decls if d.strip()]


def style_key(prop):
    if prop.startswith('--'):
        return js_str(prop)
    if prop.startswith('-'):
        prop = prop[1:]
        return camel(prop[0].upper() + prop[1:])
    return camel(prop)


def static_style(css):
    pairs = []
    for decl in split_decls(css):
        prop, _, value = decl.partition(':')
        pairs.append('%s: %s' % (style_key(prop.strip().lower()), js_str(value.strip())))
    return '{{ ' + ', '.join(pairs) + ' }}'


def attr_jsx(name, value, scope):
    if name.startswith('hint-'):
        return None
    if name.startswith('sc-camel-'):
        name = camel(name[len('sc-camel-'):])
    elif name in ATTR_RENAMES:
        name = ATTR_RENAMES[name]
    elif '-' in name and not name.startswith(('aria-', 'data-')):
        name = camel(name)
    value = value or ''
    whole = BINDING.fullmatch(value.strip())
    if name == 'style':
        # Computed style strings are applied as whole cssText, like the prototype runtime did.
        if whole:
            return 'ref={css(%s)}' % resolve(whole.group(1), scope)
        if '{{' in value:
            return 'ref={css(%s)}' % template_literal(value, scope)
        return 'style=' + static_style(value)
    if whole:
        expr = resolve(whole.group(1), scope)
        return '%s={%s}' % (name, expr + ' as AriaBool' if name in ARIA_BOOL else expr)
    if name in NUMERIC_ATTRS and re.fullmatch(r'\d+', value):
        return '%s={%s}' % (name, value)
    if '{{' in value:
        return '%s={%s}' % (name, template_literal(value, scope))
    if re.search(r'["&{}<>\\]', value):
        return '%s={%s}' % (name, js_str(value))
    return '%s="%s"' % (name, value)


def text_items(text, scope):
    """JSX children for one text node, following the runtime's whitespace rule."""
    if '{{' not in text:
        if not text.strip():
            return [] if ' ' not in text else ['{" "}']
        return [literal(text)]
    items = []
    for i, p in enumerate(BINDING.split(text)):
        if i % 2:
            items.append('{%s}' % resolve(p, scope))
        elif p:
            items.append(literal(p))
    return items


def literal(text):
    collapsed = re.sub(r'\s+', ' ', text)
    if collapsed != collapsed.strip() or re.search(r'[{}<>&]', collapsed):
        return '{%s}' % js_str(collapsed)
    return collapsed


INLINE_TAGS = {'span', 'a', 'b', 'i', 'em', 'strong', 'label', 'kbd', 'code', 'small'}
FLEX_OR_GRID = re.compile(r'(^|;)\s*display\s*:\s*(inline-)?(flex|grid)\s*(;|$)')


def lays_out_children(node):
    """True when the element's static style makes it a flex or grid container."""
    style = dict(node.attrs).get('style') or ''
    return '{{' not in style and bool(FLEX_OR_GRID.search(style))


class Emitter:
    def __init__(self):
        self.loop = 0

    def children(self, nodes, scope, depth, drop_ws=False, trim_ends=False):
        """Return (inline, items). Inline when any text sits among the children, so JSX keeps spacing."""
        items, has_text = [], False
        last = len(nodes) - 1
        for pos, n in enumerate(nodes):
            if isinstance(n, str):
                if not n.strip() and (drop_ws or (trim_ends and pos in (0, last))):
                    continue
                t = text_items(n, scope)
                if t and t != ['{" "}']:
                    has_text = True
                items.extend(t)
            elif isinstance(n, tuple):
                if n[1].startswith('='):
                    items.append('{/* %s */}' % n[1].strip('= '))
            else:
                items.append(self.node(n, scope, depth, drop_ws))
        if has_text:
            items = [i for i in items if not i.startswith('{/*')]
        return has_text, items

    def wrap(self, open_, close, nodes, scope, depth, drop_ws=False, trim_ends=False):
        inline, items = self.children(nodes, scope, depth + 1, drop_ws, trim_ends)
        if not items:
            return open_[:-1] + ' />' if close.startswith('</') and close != '</>' else open_ + close
        if inline:
            return open_ + ''.join(i.strip() if i.startswith('<') else i for i in items) + close
        pad = '  ' * (depth + 1)
        return open_ + '\n' + '\n'.join(pad + i for i in items) + '\n' + '  ' * depth + close

    def node(self, n, scope, depth, parent_drops_ws=False):
        # sc-if / sc-for splice their children into the parent, so they inherit its whitespace rule.
        attrs = dict(n.attrs)
        if n.tag == 'sc-if':
            cond = resolve(BINDING.fullmatch(attrs['value'].strip()).group(1), scope)
            body = self.wrap('<>', '</>', n.children, scope, depth + 1, parent_drops_ws)
            return '{%s ? (\n%s%s\n%s) : null}' % (cond, '  ' * (depth + 1), body, '  ' * depth)
        if n.tag == 'sc-for':
            lst = resolve(BINDING.fullmatch(attrs['list'].strip()).group(1), scope)
            var = attrs['as']
            self.loop += 1
            idx = 'i%d' % self.loop
            body = self.wrap('<Fragment key={%s}>' % idx, '</Fragment>', n.children, scope | {var}, depth + 1,
                             parent_drops_ws)
            return '{%s.map((%s, %s) => (\n%s%s\n%s))}' % (lst, var, idx, '  ' * (depth + 1), body, '  ' * depth)
        props = [p for p in (attr_jsx(k, v, scope) for k, v in n.attrs) if p]
        open_ = '<%s%s>' % (n.tag, ''.join(' ' + p for p in props))
        if n.tag in VOID:
            return open_[:-1] + ' />'
        drop = n.tag == 'svg' or lays_out_children(n)
        return self.wrap(open_, '</%s>' % n.tag, n.children, scope, depth, drop, n.tag not in INLINE_TAGS)


# ---------- main ----------

def main():
    template, assets = load_prototype()
    out_ref = ROOT / 'references' / 'prototype'
    out_ref.mkdir(parents=True, exist_ok=True)
    (out_ref / 'template.html').write_text(template, encoding='utf-8')

    logic = re.search(r'<script type="text/x-dc"[^>]*>(.*?)</script>', template, re.S).group(1)
    (out_ref / 'logic.js').write_text(logic.strip() + '\n', encoding='utf-8')

    helmet = re.search(r'<helmet>(.*?)</helmet>', template, re.S).group(1)
    font_css, global_css = re.findall(r'<style>(.*?)</style>', helmet, re.S)
    (ROOT / 'src' / 'styles').mkdir(parents=True, exist_ok=True)
    (ROOT / 'src' / 'styles' / 'prototype.css').write_text(
        '/* Global CSS from the Anosmia prototype, verbatim. */\n' + global_css.strip() + '\n', encoding='utf-8')

    # Keep only the faces whose files are embedded in the export (the latin subsets).
    fonts_dir = ROOT / 'src' / 'assets' / 'fonts'
    fonts_dir.mkdir(parents=True, exist_ok=True)
    faces = []
    for block in re.findall(r'/\* [\w-]+ \*/\s*@font-face \{.*?\}', font_css, re.S):
        m = re.search(r'url\("([0-9a-f-]{36})"\)', block)
        if not m:
            continue
        family = re.search(r"font-family: '([^']+)'", block).group(1)
        style = re.search(r'font-style: (\w+)', block).group(1)
        weight = re.search(r'font-weight: ([\d ]+);', block).group(1).replace(' ', '-')
        fname = '%s-%s-%s-latin.woff2' % (family.lower().replace(' ', '-'), style, weight)
        (fonts_dir / fname).write_bytes(assets[m.group(1)][1])
        faces.append(block.replace('url("%s")' % m.group(1), 'url("../assets/fonts/%s")' % fname))
    (ROOT / 'src' / 'styles' / 'fonts.css').write_text(
        '/* Font faces embedded in the Anosmia export (latin subsets only). SIL Open Font License 1.1. */\n'
        + '\n'.join(faces) + '\n', encoding='utf-8')

    body = re.search(r'</helmet>(.*)</x-dc>', template, re.S).group(1)
    tb = TreeBuilder()
    tb.feed(body)
    elements = [n for n in tb.root.children if isinstance(n, Node)]
    assert len(elements) == 1, 'expected a single root element'
    jsx = Emitter().node(elements[0], frozenset(), 2)
    view = ('// Generated from the Anosmia prototype by scripts/extract-prototype.py.\n'
            '// Markup, bindings and inline styles are carried over unchanged.\n'
            "import { Fragment } from 'react'\n"
            "import { css } from '../dc/css'\n"
            "import type { Vals } from './AnosmiaLogic'\n\n"
            "type AriaBool = 'true' | 'false'\n\n"
            'export function AnosmiaView({ v }: { v: Vals }) {\n'
            '  return (\n    ' + jsx + '\n  )\n}\n')
    (ROOT / 'src' / 'anosmia').mkdir(parents=True, exist_ok=True)
    (ROOT / 'src' / 'anosmia' / 'AnosmiaView.tsx').write_text(view, encoding='utf-8')
    print('wrote view (%d lines), %d font faces' % (view.count('\n'), len(faces)))


if __name__ == '__main__':
    main()
