// ok
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const User = require("./models/users");
const fs = require("fs");
dotenv.config();
mongoose
  .connect(process.env.DB)
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
  });

// configure the app
const app = express();
const PORT = process.env.PORT;

// use part
app.set("view engine", "ejs");
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("assets"));
app.use(express.static("images"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./images");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage: storage }).single("image");

// define route
app.get("/", async (req, res) => {
  let message = {
    message: "",
    type: "",
  };
  try {
    const sage = req.query.message;
    const type = req.query.type;
    if (sage) {
      console.log(sage);
      message = {
        message: sage,
        type: type,
      };
    }
  } catch (error) {
    console.log(error);
  }
  try {
    let friendlist = await User.find({});
    res.render("index", { friendlist: friendlist, message });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/createuser", upload, async (req, res) => {
  try {
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    let profilePicture = req.file.filename;
    let gender = req.body.gender;
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log("Email already in use");
        if (profilePicture !== "") {
          fs.unlinkSync(`./images/` + `${profilePicture}`);
        }
        return res.redirect("/createuser?error=emailInUse");
      }
    } catch (error) {
      console.log(error);
    }
    const newuser = new User({
      name,
      email,
      password,
      profilePicture,
      gender,
    });
    newuser.save();
    console.log("created a new user");
  } catch (err) {
    console.log(err);
  }
  res.redirect(`/?message=created new user&type=success`);
});

app.get("/delete/:id", async (req, res) => {
  const id = req.params.id;
  try {
    let user = await User.findOne({ _id: id });
    await User.deleteOne({ _id: id });
    try {
      fs.unlinkSync("./images/" + `${user.profilePicture}`);
      console.log("Delete File successfully.");
        res.redirect(`/?message=deleted user&type=success`);
    } catch (error) {
      console.log("error deleting file" + error.message);
    }
  } catch (error) {
    console.log("error finding user");
  }
});
app.get("/createuser", (req, res) => {
  let message = {
    message: "",
    type: "",
  };
  try {
    const error = req.query.error;
    if (error) {
      console.log(error);
      message = {
        message: error,
        type: "danger",
      };
    }
  } catch (error) {
    return res.redirect("/createuser?error=error");
  }
  res.render("createuser", { message });
});
app.get("/friend", (req, res) => {
  const friendlist = U;
  res.render("friend", { friendlist: [] });
});
app.listen(PORT, () => {
  console.log(`app listening on https://localhost:${PORT}`);
});
