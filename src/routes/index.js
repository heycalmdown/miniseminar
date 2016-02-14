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
    res.render('page', { title: page.title, contents: page.body.storage.value });
  }).catch(next);
});

module.exports = router;
