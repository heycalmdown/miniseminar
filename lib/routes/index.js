const express = require('express');
const Confluency = require('confluency').default;
const superagent = require('superagent');
const querystring = require('querystring');
const _ = require('lodash');

const { host, splitPinnedPages } = require('../util');
const { attached, mermaid, gliffy, link, code, fragment, emoticon } = require('../plugin');

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
        emoticon(req),
        gliffy(req),
        mermaid,
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
  const uri = `${host}/${encodeURI(req.params[0])}?${querystring.stringify(req.query)}`;
  const request = superagent.get(uri);
  return confluency.auth(request).pipe(res);
});

router.get(/\/emoticon\/(.*)/, (req, res, next) => {
  const uri = `${host}/${encodeURI(req.params[0])}?${querystring.stringify(req.query)}`;
  const request = superagent.get(uri);
  return confluency.auth(request).pipe(res);
});

module.exports = router;
