const express = require('express');
const router = express.Router();
const fs = require('fs-extra');


var {Product} = require('./../models/product');
var {Category} = require('./../models/category');
var auth = require('./../config/auth');
var isUser = auth.isUser;
//Get /
router.get('/', (req, res) => {
  // router.get('/', isUser, (req, res) => { to create private route

  Product.find({}).then((products) => {
    res.render('all_products', {
      title: 'All Products',
      products: products
    });
  }).catch((e) => {
    console.log(e);
    return res.status(400).send();
  });
});

//Get products by category
router.get('/:category', (req, res) => {
  var categorySlug = req.params.category;
  Category.findOne({slug: categorySlug}).then((category) => {
    Product.find({category: categorySlug}).then((products) => {
      if(!products) {
        return res.status(404).send();
      }
      res.render('cat_products', {
        title: category.title,
        products: products
      });
    }).catch((e) => console.log(e));
  }).catch((e) => console.log(e));
});

//Get product
router.get('/:category/:product', (req, res) => {//when user click on the product image in all products view
    var galleryImages = null;
    var loggedIn = (req.isAuthenticated())? true : false;
    Product.findOne({slug: req.params.product}).then((product) => {
      if(!product) {
        return res.status(404).send();
      }
      var galleryDir = 'public/product_images/'+ product._id +'/gallery';

      fs.readdir(galleryDir, function(err, files) {
        if(err) {
          console.log(err);
        } else {
          galleryImages = files;
          res.render('product', {
            title: product.title,
            product: product,
            galleryImages: galleryImages,
            loggedIn: loggedIn
          });
        }

    })
  }).catch((e) => {
    return res.status(400).send(e);
  });
});

//exports
module.exports = router;
