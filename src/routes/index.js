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

router.get('/page/:id', (req, res, next) => {
  confluency.getPage(req.params.id, ['body.view']).then(page => {
    const contents = page.body.view.value.replace(/ \//g, '/');
    let sections = contents.split('<hr/><hr/>').map(section => {
      if (section.indexOf('<hr/>') === -1) return section;
      return {sections: section.split('<hr/>')};
    });
    function attached(section) {
      const $ = cheerio.load(section);
      const img = $('img');
      if (img.length === 0) return section;
      if (img.data('linked-resource-type') !== 'attachment') return section;
      img.attr('src', '/image' + img.data('image-src'));
      return $.html();
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
    function map(section) {
      return [
        attached,
        link,
        code
      ].reduce((section, middleware) => middleware(section), section);
    }
    sections = sections.map(section => {
      if (!section.sections) return map(section);
      section.sections = section.sections.map(section => map(section));
      return section;
    });
    res.render('page', { title: page.title, sections: sections });
  }).catch(next);
});

router.get(/\/image\/(.*)/, (req, res, next) => {
  const request = superagent.get(`${host}/${req.params[0]}?${req.query}`);
  return confluency.auth(request).pipe(res);
});

module.exports = router;
