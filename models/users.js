const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
    require: true,
  },
  gender: String,
  password: String,
  profilePicture: {
    type: String,
    default:"./images/default.jpg"
  },
});

const User = mongoose.model("User", userSchema)
module.exports = User