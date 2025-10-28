const { Schema, default: mongoose } = require("mongoose");

const OrdersSchema = new Schema({
  name: String,
  qty: Number,
  price: Number,
  mode: String,
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "user",
    required: true,
  },
});

module.exports = { OrdersSchema };
