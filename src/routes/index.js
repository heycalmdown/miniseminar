import express from 'express';
import Confluency from 'confluency';
import * as cheerio from 'cheerio'; 
import * as superagent from 'superagent';
import * as url from 'url';

const host = process.env.HOST;// || 'https://confluency.atlassian.net';
const context = process.env.CONTEXT;
const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const router = express.Router();
const confluency = new Confluency({host, context, username, password}); 

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });
});

function sanitizeImageSrc(imageSrc) {
  if (!imageSrc.startsWith(host)) return imageSrc;
  return imageSrc.slice(host.length);
}

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
      img.attr('srcset', convertImageSrcSet(req.baseUrl, imageSrcSet));
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
function code(section) {
  const $ = cheerio.load(section, {xmlMode: true});
  const script = $('.code.panel.pdl script[type=syntaxhighlighter]');
  if (script.length === 0) return section;
  let code = 'nocontent';
  try {
    code = script[0].children[0].children[0].data;
  } catch (e) {
    console.error(e);
  }
  script.parent().html(`<pre><code data-trim data-noescape class="lang-javascript" style="font-size: smaller">${code}</code></pre>`);
  return $.html();
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
  const THEMES = {
    beige: 'beige', black: 'black', blood: 'blood', league: 'league', moon: 'moon', night: 'night', serif: 'serif',
    simple: 'simple', sky: 'sky', solarized: 'solarized', white: 'white'
  };
  const theme = THEMES[req.query.theme] || 'black';
  const TRANSITIONS = {
    none: 'none', fade: 'fade', slide: 'slide', convex: 'convex', concave: 'concave', zoom: 'zoom'
  };
  const transition = TRANSITIONS[req.query.transition] || 'slide';
  
  confluency.getPage(req.params.id, ['body.view']).then(page => {
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
