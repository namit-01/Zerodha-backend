const { Schema } = require("mongoose");
const UserSchema = new Schema({
  username: String,
  password: String,
});
module.exports = { UserSchema };
