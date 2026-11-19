// Synced game server docs write placeholders like mojang_<version>.jar outside code spans.
// In Markdown those parse as raw HTML, so the browser swallows them as unknown elements.
// This turns raw HTML made only of tags that aren't HTML elements back into text.

const HTML_TAGS = new Set(
  (
    'a abbr address area article aside audio b bdi bdo blockquote br button caption cite code col ' +
    'colgroup dd del details dfn div dl dt em fieldset figcaption figure footer h1 h2 h3 h4 h5 h6 ' +
    'header hr i iframe img input ins kbd label legend li main mark nav ol p picture pre q s samp ' +
    'section small source span strong sub summary sup table tbody td tfoot th thead time tr u ul ' +
    'var video wbr'
  ).split(' '),
);

const TAG = /<\/?([A-Za-z][\w-]*)[^>]*>/g;

type Node = {type: string; value?: string; children?: Node[]};

function isPlaceholderHtml(value: string): boolean {
  if (value.trimStart().startsWith('<!--')) return false;
  const names = [...value.matchAll(TAG)].map((m) => m[1].toLowerCase());
  return names.length > 0 && names.every((name) => !HTML_TAGS.has(name));
}

function visit(node: Node): void {
  if (node.type === 'html' && node.value && isPlaceholderHtml(node.value)) {
    node.type = 'text';
  }
  node.children?.forEach(visit);
}

export default function remarkPlaceholderTags() {
  return (tree: Node) => visit(tree);
}
