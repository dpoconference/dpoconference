/** Lightweight HTML sanitize for CMS/event bodies (allowlist tags/attrs). */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  if (typeof document === "undefined") {
    return html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/javascript:/gi, "");
  }
  const allowed = new Set([
    "P",
    "BR",
    "STRONG",
    "EM",
    "B",
    "I",
    "U",
    "A",
    "UL",
    "OL",
    "LI",
    "H1",
    "H2",
    "H3",
    "H4",
    "BLOCKQUOTE",
    "IMG",
    "FIGURE",
    "FIGCAPTION",
    "DIV",
    "SPAN",
    "HR",
    "TABLE",
    "THEAD",
    "TBODY",
    "TR",
    "TH",
    "TD",
  ]);
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const walk = (node: Node) => {
    const kids = Array.from(node.childNodes);
    for (const child of kids) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        if (!allowed.has(el.tagName)) {
          el.replaceWith(...Array.from(el.childNodes));
          continue;
        }
        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase();
          if (name.startsWith("on") || name === "style") {
            el.removeAttribute(attr.name);
            continue;
          }
          if (el.tagName === "A" && name === "href") {
            const href = attr.value.trim();
            if (!/^(https?:|mailto:|\/|#)/i.test(href)) el.removeAttribute("href");
            else {
              el.setAttribute("rel", "noopener noreferrer");
              if (/^https?:/i.test(href)) el.setAttribute("target", "_blank");
            }
            continue;
          }
          if (el.tagName === "IMG" && (name === "src" || name === "alt" || name === "width" || name === "height")) {
            if (name === "src" && !/^(https?:|data:image\/|\/)/i.test(attr.value.trim())) el.removeAttribute("src");
            continue;
          }
          if (!["href", "src", "alt", "title", "class", "width", "height", "colspan", "rowspan"].includes(name)) {
            el.removeAttribute(attr.name);
          }
        }
        walk(el);
      } else if (child.nodeType === Node.COMMENT_NODE) {
        child.parentNode?.removeChild(child);
      }
    }
  };
  walk(tpl.content);
  return tpl.innerHTML;
}
