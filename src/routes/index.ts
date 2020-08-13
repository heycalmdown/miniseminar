import Confluency, { Content } from 'confluency';
import * as dayjs from 'dayjs';
import * as duration from 'dayjs/plugin/duration';
import * as relativeTime from 'dayjs/plugin/relativeTime';
import * as express from 'express';
import * as _ from 'lodash';
import * as querystring from 'querystring';

dayjs.extend(duration);
dayjs.extend(relativeTime);

import {
  attached, backgroundImage, code, emoticon, fragment, gliffy, link, mermaid, unsetBlackOrWhiteFont
} from '../plugin';
import { host, Section, splitPinnedPages } from '../util';

const context = process.env.CONTEXT;
const username = process.env.USER_NAME || process.env.USERNAME;
const password = process.env.PASSWORD;
const authType = process.env.AUTHTYPE || 'basic';
const baseUrl = process.env.BASEURL || '';
const pinnedPages = splitPinnedPages(process.env.PINNED_PAGES);

if (!(authType === 'cookie' || authType === 'basic' || authType === 'no')) {
  throw new Error('AuthType should be one of ["cookie", "basic", "no"');
}

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

interface Title {
  id: string;
  title: string;
}

type Middleware = ((s: Section) => Section);

let recentlyViewed: Title[] = [];

function pickSummary(page: Content): { id: string, title: string, modified: string } {
  return {
    id: page.id,
    title: page.title,
    modified: dayjs.duration(dayjs().diff(dayjs(page.version!.when))).humanize(true)
  };
}

/* GET home page. */
router.get('/', (_req, res) => {
  const p = [
    Promise.all(pinnedPages.map(id => confluency.getPage(id).then(pickSummary))),
    confluency.search('label=miniseminar', {expand: ['version']}).then(data => _.map(data, pickSummary))
  ];
  return Promise.all(p).then(([pinned, labeled]) => {
    res.render('home', { pinned, recentlyViewed, labeled, themes, transitions, baseUrl });
  });
});

router.get('/page/:id', (req, res, next) => {
  const printPdf = req.query['print-pdf'] === '';
  const theme = typeof req.query.theme === 'string' && THEMES[req.query.theme] || 'black';
  const transition = typeof req.query.transition === 'string' && TRANSITIONS[req.query.transition] || 'slide';

  confluency.getPage(req.params.id, ['body.view']).then(page => {
    recentlyViewed.push({id: req.params.id, title: page.title});
    recentlyViewed = _.uniqBy(recentlyViewed, 'id');

    const contents: string = page.body!.view!.value.replace(/ \//g, '/');
    let sections: Section[] = contents.split('<hr/><hr/>').map(body => {
      if (body.indexOf('<hr/>') === -1) return { body };
      return { body: '', sections: body.split('<hr/>').map(s => ({ body: s }))};
    });
    function map(section: Section) {
      const middlewares: Middleware[] = [
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
    res.render('slides', { title: page.title, req, sections, theme, transition, printPdf, baseUrl });
  }).catch(next);
});

router.get(/\/image\/(.*)/, (req, res) => {
  const uri = `/${encodeURI(req.params[0])}?${querystring.stringify(req.query)}`;
  return confluency.newRequest('get', uri, true).pipe(res);
});

router.get(/\/emoticon\/(.*)/, (req, res) => {
  const uri = `/${encodeURI(req.params[0])}?${querystring.stringify(req.query)}`;
  return confluency.newRequest('get', uri, true).pipe(res);
});

router.get('/gist/:userId/:gistId', (req, res) => {
  const url = `https://gist.githubusercontent.com/${req.params.userId}/${req.params.gistId}/raw`;
  res.render('slides', { url, baseUrl, md: true });
});

router.get('/gist/:userId/:gistId/:commitHash', (req, res) => {
  const url = `https://gist.githubusercontent.com/${req.params.userId}/${req.params.gistId}/raw/${req.params.commitHash}`;
  res.render('slides', { url, baseUrl, md: true });
});
