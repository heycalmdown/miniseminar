import * as express from 'express';
import Confluency, { Content } from 'confluency';
import * as querystring from 'querystring';
import * as _ from 'lodash';

import { Section, host, splitPinnedPages } from '../util';
import { attached, backgroundImage, mermaid, gliffy, link, code, fragment, emoticon, unsetBlackOrWhiteFont } from '../plugin';

const context = process.env.CONTEXT;
const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const authType = process.env.AUTHTYPE || 'basic';
const pinnedPages = splitPinnedPages(process.env.PINNED_PAGES);

export const router = express.Router();
const confluency = new Confluency({host, context, username, password, authType});

const themes = [
  'beige', 'black', 'blood', 'league', 'moon', 'night', 'serif', 'simple', 'sky', 'solarized', 'white'
];
const transitions = [
  'none', 'fade', 'slide', 'convex', 'concave', 'zoom'
];

const THEMES = _.zipObject(themes, themes.map(o => o));
const TRANSITIONS = _.zipObject(transitions, transitions.map(o => o));

let recentlyViewed: {id: string, title: string}[] = [];

function pickSummary(page: Content): { id: string, title: string } {
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

    const contents: string = page.body!.view!.value.replace(/ \//g, '/');
    let sections: Section[] = contents.split('<hr/><hr/>').map(body => {
      if (body.indexOf('<hr/>') === -1) return { body };
      return { body: '', sections: body.split('<hr/>').map(s => ({ body: s }))};
    });
    function map(section: Section) {
      const middlewares: ((s: Section) => Section)[] = [
        attached(req),
        backgroundImage(req),
        emoticon(req),
        gliffy(req),
        mermaid,
        link,
        code,
        fragment,
        unsetBlackOrWhiteFont
      ];
      return middlewares.reduce((section, middleware) => middleware(section), section);
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
  const uri = `/${encodeURI(req.params[0])}?${querystring.stringify(req.query)}`;
  return confluency.newRequest('get', uri, true).pipe(res);
});

router.get(/\/emoticon\/(.*)/, (req, res, next) => {
  const uri = `/${encodeURI(req.params[0])}?${querystring.stringify(req.query)}`;
  return confluency.newRequest('get', uri, true).pipe(res);
});
