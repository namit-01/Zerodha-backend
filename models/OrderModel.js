const { model } = require("mongoose");

const { OrdersSchema } = require("../schemas/OrderSchema");
const OrderModel = new model("order", OrdersSchema);
module.exports = { OrderModel };
