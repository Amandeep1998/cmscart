const express = require('express');
const router = express.Router();
const mkdirp = require('mkdirp');
const fs = require('fs-extra');
const resizeImg = require('resize-img');
//Get model product
var {Product} = require('./../models/product');
var {Category} = require('./../models/category');
/*
* Get Page index
*/
router.get('/', (req, res) => {
  var count;
  Product.count().then((c) => {
    count = c;
  });

  Product.find({}).then((products) => {
    res.render('admin/products', {
      products: products,
      count: count
    });
  }).catch((e) => console.log(e));
});

/*
* Get add product
*/
router.get('/add-product', (req, res) => {
  var title = "";
  var desc = "";
  var price = "";

  Category.find({}).then((categories) => {
    res.render('admin/add_product', {
      title: title,
      desc: desc,
      categories: categories,
      price: price
    });
  });
});

/*
* post add product
*/
router.post('/add-product', (req, res) => {
  var imageFile = typeof req.files.image !== "undefined" ? req.files.image.name:"";
  req.checkBody('title', 'Title must have a value').notEmpty();
  req.checkBody('description', 'Description must have a value').notEmpty();
  req.checkBody('price', 'Price must have a value').isDecimal();
  req.checkBody('image', 'You must upload a image').isImage(imageFile);

  var title = req.body.title;
  var slug = title.replace(/\s+/g, '-').toLowerCase();//replace sppaces with -
  var desc = req.body.description;
  var category = req.body.category;
  var price = req.body.price;


  var errors = req.validationErrors();
  if(errors) {
    Category.find({}).then((categories) => { //here category find is only to display all categories
      res.render('admin/add_product', {
        errors: errors,
        title: title,
        desc: desc,
        categories: categories,
        price: price
      });
    });
  } else {
      Product.findOne({slug: slug}).then((product) => {
        if(product) {
          req.flash('danger','Product Title exists, choose another');
          Category.find({}).then((categories) => { //here category find is only to display all categories
            res.render('admin/add_product', {
              title: title,
              desc: desc,
              categories: categories,
              price: price
            });
          });
        } else {
          var price2 = parseFloat(price).toFixed(2);
          var product = new Product({
            title: title,
            slug: slug,
            desc : desc,
            category: category,
            price: price,
            image: imageFile
          });
          product.save().then((product) => {
            mkdirp('public/product_images/'+product._id, function(err) {//it is use to make directories
              return console.log(err);
            });
            mkdirp('public/product_images/'+product._id +'/gallery', function(err) {
              return console.log(err);
            });
            mkdirp('public/product_images/'+product._id +'/gallery/thumbs', function(err) {
              return console.log(err);
            });

            if(imageFile !== "") {
              var productImage = req.files.image;
              var path = 'public/product_images/' + product._id + '/' + imageFile;
              productImage.mv(path, function(err) {
                return console.log(err);
              });
            }

            req.flash('success','Product added!');
            res.redirect('/admin/products');
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



/*
* Get edit product
*/
router.get('/edit-product/:id', (req, res) => {
    var errors;
    if(req.session.errors) {//after posting the errors will be saved in session
      errors = req.session.errors;
    }
    req.session.errors = null;

  Category.find({}).then((categories) => { //here category find is only to display all categories

      Product.findById(req.params.id).then((p) => {
          if(!p) {
            return res.status(404).end();
          }
          var galleryDir = 'public/product_images/'+ p._id + '/gallery';
          var galleryImages = null;

          fs.readdir(galleryDir, function (err, files) {
            if(err) {
              console.log(err);
            } else {
              galleryImages = files;

                res.render('admin/edit_product', {
                  title: p.title,
                  errors: errors,
                  desc: p.desc,
                  categories: categories,
                  category: p.category.replace('/\s+/g', '-'),
                  price: parseFloat(p.price).toFixed(2),
                  image: p.image,
                  galleryImages: galleryImages,
                  id: p._id
                });
              }
          });
      }).catch((e) => {
        return console.log(e);
        res.status(400).redirect('admin/products')
      });
  });
});
/*
* post edit product
*/
router.post('/edit-product/:id', (req, res) => {
  var imageFile = typeof req.files.image !== "undefined" ? req.files.image.name:"";
  req.checkBody('title', 'Title must have a value').notEmpty();
  req.checkBody('description', 'Description must have a value').notEmpty();
  req.checkBody('price', 'Price must have a value').isDecimal();
  req.checkBody('image', 'You must upload a image').isImage(imageFile);

  var title = req.body.title;
  var slug = title.replace(/\s+/g, '-').toLowerCase();//replace sppaces with -
  var desc = req.body.description;
  var category = req.body.category;
  var price = req.body.price;
  var id = req.params.id;
  var pimage = req.body.pimage;

  var errors = req.validationErrors();
  if(errors) {
    req.session.errors = errors;
    res.redirect('/admin/products/edit-product/'+ id);
  } else {
    Product.findOne({slug: slug, _id:{'$ne': id}}).then((p) => {//the $ne is used to check for other product slug not itself
      if(p) {//if paroduct exist throw error
          req.flash('danger', 'Product Title exist, choose another'); //it passes err mess to admin_header success or danger
          res.redirect('/admin/products/edit-product/'+ id);
      } else {///else saave the page
          Product.findById(id, function (err, product) {
              if(err) {
                return console.log(err);
              }

              product.title = title;
              product.slug = slug;
              product.desc = desc;
              product.price = parseFloat(price).toFixed(2);
              product.category = category;
              if(imageFile !== "") {
                product.image = imageFile;
              }


              product.save().then((product) => {
                if(imageFile!== "") {
                  if(pimage !== "") {
                      fs.remove('public/product_images/'+id + '/' + pimage, function (err) {//this pimage is used as hiden input so that we can remove the current image file saved in product_images
                        if(err) {
                          return console.log(err);
                        }
                      })
                   }
                    var productImage = req.files.image;
                    var path = 'public/product_images/' + id + '/' + imageFile;
                    productImage.mv(path, function(err) {
                      return console.log(err);
                    });
                  }


                req.flash('success', 'Product Edited');
                res.redirect('/admin/products/edit-product/'+id);
              }).catch((e) => {
                res.status(400).send(e);
              });
           });
         }
  }).catch((e) => {
      return console.log(e);
  });
 }
});

//Post product gallery
router.post('/product-gallery/:id', (req, res) => {
  var productImage = req.files.file;
  var id = req.params.id;
  console.log(req.files.file.name);
  var path = 'public/product_images/'+id+'/gallery/' + req.files.file.name;
  var thumbsPath = 'public/product_images/'+id+'/gallery/thumbs/' + req.files.file.name;

  productImage.mv(path, function(err, files) {
    if(err) {
      return console.log(err);
    }

    resizeImg(fs.readFileSync(path), {width:100, height:100}).then((buf) => {
      fs.writeFileSync(thumbsPath, buf);
    });
  });
  res.sendStatus(200).end();
});

//GET DELETE IMAGE
router.get('/delete-image/:image', (req, res) => {
  var originalImage = 'public/product_images/'+req.query.id+'/gallery/' + req.params.image;
  var thumbImage = 'public/product_images/'+req.query.id+'/gallery/thumbs/' + req.params.image;

  fs.remove(originalImage, function (err) {
    if(err) {
      return console.log(err);
    } else {
        fs.remove(thumbImage, function(err) {
          if(err) {
            return console.log(err);
          } else {
            req.flash('success', 'Image Deleted');
            res.redirect('/admin/products/edit-product/'+req.query.id);
          }
        });
      }
  });
});

// Delete product
router.get('/delete-product/:id', (req, res) => {
  var id = req.params.id;
  var path = 'public/product_images/'+id;
  fs.remove(path, function (err) {
    if(err) {
      return console.log(err);
    } else {
      Product.findByIdAndRemove(id).then((product) => {
        req.flash('success', 'Product Deleted');
        res.redirect('/admin/products');
      }).catch((e) => {
        res.status(400).send(e);
      })
    }
  });
});

//exports
module.exports = router;
