const { model } = require("mongoose");
const { HoldingsSchema } = require("../schemas/HoldingSchema");
const HoldingsModel = new model("holdings", HoldingsSchema);
module.exports = { HoldingsModel };
