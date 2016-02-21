import express from 'express';
import Confluency from 'confluency';

const router = express.Router();
const confluency = new Confluency({host: 'https://confluency.atlassian.net', context: 'wiki'}); 

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });
});

router.get('/page/:id', (req, res, next) => {
  confluency.getPage(req.params.id, ['body.storage']).then(page => {
    const contents = page.body.storage.value;
    let sections = contents.split('<hr /><hr />').map(section => {
      if (section.indexOf('<hr />') === -1) return section;
      return {sections: section.split('<hr />')};
    });
    console.log(contents, sections);
    res.render('page', { title: page.title, sections: sections });
  }).catch(next);
});

module.exports = router;
