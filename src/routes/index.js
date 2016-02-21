import express from 'express';
import Confluency from 'confluency';
import * as cheerio from 'cheerio'; 
import * as superagent from 'superagent';
import * as url from 'url';

const host = 'https://confluency.atlassian.net';
const router = express.Router();
const confluency = new Confluency({host, context: 'wiki'}); 

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });
});

router.get('/page/:id', (req, res, next) => {
  confluency.getPage(req.params.id, ['body.storage', 'body.view']).then(page => {
    const contents = page.body.view.value;
    let sections = contents.split('<hr/><hr/>').map(section => {
      if (section.indexOf('<hr/>') === -1) return section;
      return {sections: section.split('<hr/>')};
    });
    function mapAttached(section) {
      const $ = cheerio.load(section);
      const img = $('img');
      if (img.length === 0) return section;
      if (img.data('linked-resource-type') !== 'attachment') return section;
      img.attr('src', '/image' + img.data('image-src'));
      return $.html();
    }
    sections = sections.map(section => {
      if (!section.sections) return section = mapAttached(section);
      section.sections = section.sections.map(section => mapAttached(section));
      return section;
    });
    res.render('page', { title: page.title, sections: sections });
  }).catch(next);
});

router.get(/\/image\/(.*)/, (req, res, next) => {
  return superagent.get(`${host}/${req.params[0]}?${req.query}`).pipe(res);
});

module.exports = router;
