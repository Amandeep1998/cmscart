const express = require('express');
const router = express.Router();

//Get model page
var {Category} = require('./../models/category');
/*
* Get Page index
*/
router.get('/', (req, res) => {
  Category.find({}).then((categories) => {
    res.render('admin/categories', {
      categories: categories
    });
  });
});

/*
* Get add Category
*/
router.get('/add-category', (req, res) => {
  var title = "";
  res.render('admin/add_category', {
    title: title,
  });
});

/*
* post add category
*/
router.post('/add-category', (req, res) => {
  req.checkBody('title', 'Title must have a value').notEmpty();

  var title = req.body.title;
  var slug = title.replace(/\s+/g, '-').toLowerCase();//replace sppaces with -

  var errors = req.validationErrors();
  if(errors) {
    res.render('admin/add_category', {
      errors: errors,
      title: title,
    });
  } else {
      Category.findOne({slug: slug}).then((category) => {
        if(category) {
          req.flash('danger','Title exists, choose another');
          res.render('admin/add_category', {
              errors:errors,
              title: title,
          });
        } else {
          var category = new Category({
            title: title,
            slug: slug
          });
          category.save().then(() => {
            Category.find({}).then((categories) => {
              req.app.locals.categories = categories; //now categories can be access anywhere
            }).catch((e) => {
              return console.log(e);
            });

            req.flash('success','Category added!');
            res.redirect('/admin/categories');
          }).catch((e) => {
            res.status(400);
            return console.log(e);
          })
        }
      }).catch((e) => {
        res.status(400);
        console.log(e);
      });
    }
});
//             //Slug should be unique
//             Category.findOne({slug:slug}, function(err, category)
//             {
//                 if(category)
//                 {
//                     req.flash('danger','Page slug exists, choose another');
//                     res.render('admin/add_category', {
//                         errors:errors,
//                         title: title,
//                     })
//                 }
//                 else
//                {
//                     var category = new Category(
//                         {
//                             title: title,
//                             slug:slug,
//                         })
//
//                     category.save(function(err)
//                     {
//                         if(err)
//                         {
//                             return console.log(err);
//                         }
//                         req.flash('Success','Category added!');
//                         res.redirect('/admin/categories');
//                     })
//                 }
//             })
//         }
// })


/*
* Get edit category
*/
router.get('/edit-category/:id', (req, res) => {
  Category.findOne({_id : req.params.id}).then((category) => {
    if(!category) {
      return res.status(404).send('Page not found');
    }
    res.render('admin/edit_category', {
      title: category.title,
      id: category._id
    });
  }).catch((e) => {
    res.status(400).send(e);
  });
});

/*
* post edit category
*/
router.post('/edit-category/:id', (req, res) => {
  req.checkBody('title', 'Title must have a value').notEmpty();

  var title = req.body.title;
  var slug = title.replace(/\s+/g, '-').toLowerCase();//replace sppaces with -
  var id = req.params.id;

  var errors = req.validationErrors();
  if(errors) {
    res.render('admin/edit_category', {
      errors: errors,
      title: title,
      id: id
    });
  } else {
    Category.findOne({slug: slug, _id:{'$ne': id}}).then((category) => {//the $ne is used to check for other pages slug not itself
      if(category) {//if page exist throw error
          req.flash('danger', 'Category title exist, choose another'); //it passes err mess to admin_header success or danger
          res.render('admin/edit_category', {
            title: title,
            id: id
          });
      } else {///else saave the page
        console.log(id);
        Category.findById(id).then((category) => {
          if(!category) {
            return res.status(404).send('Page not found');
          }
          category.title = title,
          category.slug = slug,

          category.save().then(() => {
            Category.find({}).then((categories) => {
              req.app.locals.categories = categories; //now categories can be access anywhere
            }).catch((e) => {
              return console.log(e);
            });

            req.flash('success', 'Category edited');
            res.redirect('/admin/categories/edit-category/'+id);
          }).catch((e) => {
            res.status(400).send(e);
          });
        });
      }
    });
  }
});

router.get('/delete-category/:id', (req, res) => {
  Category.findByIdAndRemove({_id: req.params.id}).then(() => {
    Category.find({}).then((categories) => {
      req.app.locals.categories = categories; //now categories can be access anywhere
    }).catch((e) => {
      return console.log(e);
    });
    req.flash('success', 'Category Deleted');
    res.redirect('/admin/categories');
  }).catch((e) => {
    res.status(400).send(e);
  })
});

//exports
module.exports = router;
