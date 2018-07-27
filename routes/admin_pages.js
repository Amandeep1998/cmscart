const express = require('express');
const router = express.Router();

//Get model page
var {Page} = require('./../models/page');

/*
* Get Page index
*/
router.get('/', (req, res) => {
  Page.find({}).sort({sorting: 1}).exec(function(err, pages) {//fin({}) means return everything and sort 1 means in ascending order
    res.render('admin/pages', {
      pages: pages
    });
  });
});

/*
* Get add page
*/
router.get('/add-page', (req, res) => {
  var title = "";
  var slug = "";
  var content = "";

  res.render('admin/add_page', {
    title: title,
    slug: slug,
    content: content
  });
});

/*
* post add page
*/
router.post('/add-page', (req, res) => {
  req.checkBody('title', 'Title must have a value').notEmpty();
  req.checkBody('content', 'Content must have a value').notEmpty();

  var title = req.body.title;
  var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();//replace sppaces with -
  if(slug == "") slug = title.replace(/\s+/g, '-').toLowerCase();
  var content = req.body.content;

  var errors = req.validationErrors();
  if(errors) {
    res.render('admin/add_page', {
      errors: errors,
      title: title,
      slug: slug,
      content: content
    });
  } else
        {
            //Slug should be unique
            Page.findOne({slug:slug}, function(err,page)
            {
                if(page)
                {
                    req.flash('danger','Page slug exists, choose another');
                    res.render('admin/add_page', {
                        errors:errors,
                        title: title,
                        slug: slug,
                        content: content
                    })
                }
                else
               {
                    var page= new Page(
                        {
                            title: title,
                            slug:slug,
                            content:content,
                            sorting:100
                        })

                    page.save(function(err)
                    {
                        if(err)
                        {
                            return console.log(err);
                        }
                        Page.find({}).sort({sorting: 1}).exec(function(err, pages) {//fin({}) means return everything and sort 1 means in ascending order
                          if(err) {
                            console.log(err);
                          } else {
                              req.app.locals.pages = pages; //now pages can be access anywhere
                          }
                        });

                        req.flash('success','Page added!');
                        res.redirect('/admin/pages');
                    })
                }
            })
        }
})

/*
* post Page index
*/

function sortPages(ids, callback) {
  var count = 0;

   for (var i = 0; i < ids.length; i++) {
     var id = ids[i];
     count++;
    (function(count) {
      Page.findById(id, function(err, page) {
        page.sorting = count;
        page.save(function(err, page) {
          if(err) {
            return console.log(err);
          }
          ++count;
          if(count > ids.length) {
            callback();
          }
        });
      });
    })(count);
  }
}

router.post('/reorder-pages', (req, res) => {
  var ids = req.body['id[]'];
  sortPages(ids, function () {
    Page.find({}).sort({sorting: 1}).exec(function(err, pages) {//fin({}) means return everything and sort 1 means in ascending order
      if(err) {
        console.log(err);
      } else {
          req.app.locals.pages = pages; //now pages can be access anywhere
      }
    });
  });
});

/*
* Get edit page
*/
router.get('/edit-page/:id', (req, res) => {
  Page.findById(req.params.id).then((page) => {
    if(!page) {
      return res.status(404).send('Page not found');
    }
    res.render('admin/edit_page', {
      title: page.title,
      slug: page.slug,
      content: page.content,
      id: page._id
    });
  }).catch((e) => {
    res.status(400).send(e);
  });
});

//   Page.findOne({slug: req.params.slug}, function(err, page) {
//     if(err) {
//        res.end();
//     }
//       res.render('admin/edit_page', {
//         title: page.title,
//         slug: page.slug,
//         content: page.content,
//         id: page._id
//       });
//   });
// });
/*
* post edit page
*/
router.post('/edit-page/:id', (req, res) => {
  req.checkBody('title', 'Title must have a value').notEmpty();
  req.checkBody('content', 'Content must have a value').notEmpty();

  var title = req.body.title;
  var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();//replace sppaces with -
  if(slug == "") slug = title.replace(/\s+/g, '-').toLowerCase();
  var content = req.body.content;
  var id = req.params.id;

  var errors = req.validationErrors();
  if(errors) {
    res.render('admin/edit_page', {
      errors: errors,
      title: title,
      slug: slug,
      content: content,
      id: id
    });
  } else {
    Page.findOne({slug: slug, _id:{'$ne': id}}).then((page) => {//the $ne is used to check for other pages slug not itself
      if(page) {//if page exist throw error
          req.flash('danger', 'Page slug exist, choose another'); //it passes err mess to admin_header success or danger
          res.render('admin/add_page', {
            title: title,
            slug: slug,
            content: content
          });
      } else {///else saave the page
        Page.findById(id, function (err, page) {
          page.title = title,
          page.slug = slug,
          page.content = content

          page.save().then(() => {
            Page.find({}).sort({sorting: 1}).exec(function(err, pages) {//fin({}) means return everything and sort 1 means in ascending order
              if(err) {
                console.log(err);
              } else {
                  req.app.locals.pages = pages; //now pages can be access anywhere
              }
            });

            req.flash('success', 'Page added');
            res.redirect('/admin/pages/edit-page/'+id);
          }).catch((e) => {
            res.status(400).send(e);
          });
        });
    }
  });
 }
});

router.get('/delete-page/:id', (req, res) => {
  Page.findByIdAndRemove({_id: req.params.id}).then((page) => {
    req.flash('success', 'Page Deleted');
    res.redirect('/admin/pages');
  }).catch((e) => {
    res.status(400).send(e);
  })
});

//exports
module.exports = router;
