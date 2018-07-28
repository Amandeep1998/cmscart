const express = require('express');
const router = express.Router();

var {Product} = require('./../models/product');

//Get add product
router.get('/add/:product', (req, res) => {
  var slug = req.params.product;

  Product.findOne({slug: slug}).then((p) => {
    if(!p) {
      return res.status(404).send();
    }

    if(typeof(req.session.cart) == "undefined") {
      req.session.cart = [];
      req.session.cart.push({
        title: slug,
        qty: 1,
        price: parseFloat(p.price).toFixed(2),
        image: '/product_images/'+ p._id + '/' + p.image
      });
    } else {
        var cart = req.session.cart;
        var newItem = true;
        for(var i=0; i< cart.length; i++) {
          if(cart[i].title == slug) {
            cart[i].qty++;
            newItem = false;
            break;
          }
        }
        if(newItem) {
          cart.push({
            title: slug,
            qty: 1,
            price: parseFloat(p.price).toFixed(2),
            image: '/product_images/'+ p._id + '/' + p.image
          });
        }
     }
     console.log(req.session.cart);
     req.flash('success', 'Product added to cart');
     res.redirect('back');

  }).catch((e) => {
    return res.status(400).send(e);
  })
});

//get checkout cart
router.get('/checkout', (req, res) => {

  if(req.session.cart && req.session.cart.length == 0) {
    delete req.session.cart;
    res.redirect('/cart/checkout');
  } else{
    res.render('checkout', {
        title: 'Checkout',
        cart: req.session.cart
    });
  }

});


//get update product
router.get('/update/:product', (req, res) => {
  var slug = req.params.product;
  var action = req.query.action;
  var cart = req.session.cart;
  for(var i = 0; i < cart.length; i++) {
    if(cart[i].title == slug) {
      switch(action) {
        case "add":
          cart[i].qty++;
          break;
        case "remove":
          cart[i].qty--;
          if(cart[i].qty < 1) {
            cart.splice(i, 1);
          }
          break;
        case "clear":
          cart.splice(i, 1);
          if(cart.length == 0) {
            delete req.session.cart;
          }
          break;
        default:
          console.log("update problem");
          break;
      }
        break;
    }
  }
  req.flash('success', 'Cart Updated');
  res.redirect('/cart/checkout');
});

//get Clear cart
router.get('/clear', (req, res) => {
  delete req.session.cart;
  req.flash('success', 'Cart Cleared');
  res.redirect('/cart/checkout');

});

//get Buynow
router.get('/buynow', (req, res) => {
  delete req.session.cart;
  res.sendStatus(200);
});

//exports
module.exports = router;
