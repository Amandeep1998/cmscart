const express = require('express');
const router = express.Router();

var {Page} = require('./../models/page');

//Get /
router.get('/', (req, res) => {
  Page.findOne({slug: "home"}).then((page) => {

      res.render('index' , {
        title: page.title,
        content: page.content
      });//its because we set app.set('views') to look in the views folder

  }).catch((e) => {
    res.status(400).send();
  });
});

//Get /:slug
router.get('/:slug', (req, res) => {
  var slug = req.params.slug;
  Page.findOne({slug: slug}).then((page) => {
    if(!page) {
      return res.status(404).redirect('/');
    }
    res.render('index' , {
      title: page.title,
      content: page.content
    });//its because we set app.set('views') to look in the views folder
  }).catch((e) => {
    res.status(400).send();
  });


});

//exports
module.exports = router;
