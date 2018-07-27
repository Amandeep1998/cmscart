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
  res.render('checkout', {
      title: 'Checkout',
      cart: req.session.cart
  });
});
//exports
module.exports = router;
