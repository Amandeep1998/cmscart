const mongoose = require('mongoose');

//ProductSchema
var ProductSchema = mongoose.Schema({
  title: {
      type: String,
      required: true
  },
  slug: {
      type: String,
  },
  desc: {
      type: String,
      required: true
  },
  category: {
      type: String,
      required: true
  },
  image: {
    type: String
  },
  price: {
    type: Number,
    required: true
  }
});

var Product = mongoose.model('Product', ProductSchema);

module.exports = {Product};
