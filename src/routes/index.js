import express from 'express';
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });
});

router.get('/page/:id', (req, res, next) => {
  console.log(req.params);
  res.render('page');
});

module.exports = router;
