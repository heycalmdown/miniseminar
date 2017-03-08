import * as cheerio from 'cheerio'; 

import { host, sanitizeImageSrc, parseParams } from './util';

export function attached(req) {
  return (section) => {
    const $ = cheerio.load(section);
    const imgs = $('img');
    if (imgs.length === 0) return section;
    imgs.map((i, el) => {
      const img = $(el);
      if (img.data('linked-resource-type') !== 'attachment') return section;
      const imageSrc = img.data('image-src');
      img.attr('src', req.baseUrl + '/image' + sanitizeImageSrc(imageSrc));
      const imageSrcSet = img.attr('srcset');
      if (imageSrcSet) {
        img.attr('srcset', convertImageSrcSet(req.baseUrl, imageSrcSet));
      }
    });
    return $.html();
  };
}

export function gliffy(req) {
  return (section) => {
    const $ = cheerio.load(section);
    const imgs = $('img');
    if (imgs.length === 0) return section;
    imgs.map((i, el) => {
      const img = $(el);
      if (img.attr('class').trim() !== 'gliffy-image') return section;
      const imageSrc = img.attr('src');
      img.attr('src', req.baseUrl + '/image' + sanitizeImageSrc(imageSrc));
      const imageSrcSet = img.attr('srcset');
      if (imageSrcSet) {
        img.attr('srcset', convertImageSrcSet(req.baseUrl, imageSrcSet));
      }
    });
    return $.html();
  };
}

export function link(section) {
  const $ = cheerio.load(section);
  const aList = $('a');
  if (aList.length === 0) return section;
  aList.each((i, el) => {
    if (el.attribs.href[0] === '/') {
      el.attribs.href = host + el.attribs.href;
    }
  });
  return $.html();
}

const LANGS = {
  actionscript3: 'lang-actionscript',
  'c#': 'lang-cs',
  coldfusion: 'lang-xx',
  jfx: 'lang-java',
  jscript: 'lang-js',
  text: 'lang-md',
  powershell: 'lang-powershell',
  sass: 'lang-scss'
};

function brushToLang(brush) {
  return LANGS[brush] || 'lang-' + brush;
}

function codeFor58(script) {
  let code = 'nocontent';
  try {
    code = script[0].children[0].children[0].data;
  } catch (e) {
    console.error(e);
  }
  const params = parseParams(pre.data('syntaxhighlighter-params'));
  const c = brushToLang(params.brush);
  const s = 'font-size: smaller';
  script.parent().html(`<pre><code data-trim data-noescape class="${c}" style="${s}">${code}</code></pre>`);
}

function codeFor59(pre) {
  const code = pre[0].children[0].data;
  const params = parseParams(pre.data('syntaxhighlighter-params'));
  const c = brushToLang(params.brush);
  const s = 'font-size: smaller';
  pre.parent().html(`<pre><code data-trim data-noescape class="${c}" style="${s}">${code}</code></pre>`)
}

export function code(section) {
  const $ = cheerio.load(section, {xmlMode: true});

  // for confluence-5.8
  const script = $('.code.panel.pdl script[type=syntaxhighlighter]');
  if (script.length !== 0) {
    codeFor58(script);
    return $.html();
  }

  // for confluence-5.9
  const pre = $('.codeContent.panelContent.pdl pre');
  if (pre.length !== 0) {
    codeFor59(pre);
    return $.html();
  }
  return section;
}

export function fragment(section) {
  const $ = cheerio.load(section);
  const liList = $('li');
  if (liList.length === 0) return section;
  liList.each((i, el) => {
    el = $(el);
    let text = el.text();
    if (text.includes('⏎')) {
      text = text.replace('⏎', '');
      el.text(text);
      el.addClass('fragment');
    }
  });
  return $.html();
}
