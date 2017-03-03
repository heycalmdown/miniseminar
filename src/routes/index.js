import express from 'express';
import Confluency from 'confluency';
import * as cheerio from 'cheerio'; 
import * as superagent from 'superagent';
import * as url from 'url';
import * as _ from 'lodash';

import { host, sanitizeImageSrc, splitPinnedPages, parseParams } from '../util';

const context = process.env.CONTEXT;
const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const pinnedPages = splitPinnedPages(process.env.PINNED_PAGES);

const router = express.Router();
const confluency = new Confluency({host, context, username, password}); 

const themes = [
  'beige', 'black', 'blood', 'league', 'moon', 'night', 'serif', 'simple', 'sky', 'solarized', 'white'
];
const transitions = [
  'none', 'fade', 'slide', 'convex', 'concave', 'zoom'
];

const THEMES = _.zipObject(themes, themes.map(o => o));
const TRANSITIONS = _.zipObject(transitions, transitions.map(o => o));

let recentlyViewed = [];

function pickSummary(page) {
  return {id: page.id, title: page.title};
}

/* GET home page. */
router.get('/', (req, res, next) => {
  const p = [
    Promise.all(pinnedPages.map(id => confluency.getPage(id).then(pickSummary))),
    confluency.search('label=miniseminar').then(data => _.map(data, pickSummary))
  ];
  return Promise.all(p).then(([pinned, labeled]) => {
    res.render('index', { pinned, recentlyViewed, labeled, themes, transitions });
  });
});

function convertImageSrcSet(baseUrl, imageSrcSet) {
  return imageSrcSet.split(',').map(src => baseUrl + '/image' + src).join(',');
}

function attached(req) {
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
function link(section) {
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

function code(section) {
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

function fragment(section) {
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

router.get('/page/:id', (req, res, next) => {
  const theme = THEMES[req.query.theme] || 'black';
  const transition = TRANSITIONS[req.query.transition] || 'slide';

  confluency.getPage(req.params.id, ['body.view']).then(page => {
    recentlyViewed.push({id: req.params.id, title: page.title});
    recentlyViewed = _.uniqBy(recentlyViewed, 'id');

    const contents = page.body.view.value.replace(/ \//g, '/');
    let sections = contents.split('<hr/><hr/>').map(section => {
      if (section.indexOf('<hr/>') === -1) return section;
      return {sections: section.split('<hr/>')};
    });
    function map(section) {
      return [
        attached(req),
        link,
        code,
        fragment,
      ].reduce((section, middleware) => middleware(section), section);
    }
    sections = sections.map(section => {
      if (!section.sections) return map(section);
      section.sections = section.sections.map(section => map(section));
      return section;
    });
    res.render('page', { title: page.title, req, sections, theme, transition });
  }).catch(next);
});

router.get(/\/image\/(.*)/, (req, res, next) => {
  const request = superagent.get(`${host}/${req.params[0]}?${req.query}`);
  return confluency.auth(request).pipe(res);
});

module.exports = router;
