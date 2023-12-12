const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const User = require("./models/users");
const fs = require("fs");
const path= require('path')
const { log } = require("console");

dotenv.config();

mongoose
  .connect(process.env.DB)
  .then(() => console.log("Connected to the database"))
  .catch((error) => console.error("Error connecting to the database:", error));

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
const assetsPath = path.join(__dirname, "assets");
app.use(express.static("images"));
app.use(express.static(assetsPath));
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./images"),
  filename: (req, file, cb) =>
    cb(null, `${file.fieldname}_${Date.now()}_${file.originalname}`),
});

const upload = multer({ storage: storage }).single("image");

app.get("/", async (req, res) => {
  try {
    const sage = req.query.message;
    const type = req.query.type;
    let message = { message: "", type: "" };

    if (sage) {
      console.log(sage);
      message = { message: sage, type: type };
    }

    const friendlist = await User.find({});
    res.render("index", { friendlist, message });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/createuser", upload, async (req, res) => {
  try {
    const { name, email, password, gender } = req.body;
    const profilePicture = req.file.filename;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Email already in use");
      if (profilePicture !== "") {
        fs.unlinkSync(`./images/${profilePicture}`);
      }
      return res.redirect("/createuser?error=emailInUse");
    }

    const newuser = new User({ name, email, password, profilePicture, gender });
    await newuser.save();
    console.log("Created a new user");
  } catch (err) {
    console.error(err);
  }
  res.redirect("/?message=createdNewUser&type=success");
});

app.get("/delete/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const user = await User.findOne({ _id: id });
    await User.deleteOne({ _id: id });

    try {
      fs.unlinkSync(`./images/${user.profilePicture}`);
      console.log("Delete file successfully.");
      res.redirect("/?message=deletedUser&type=success");
    } catch (error) {
      console.log("Error deleting file:", error.message);
    }
  } catch (error) {
    console.log("Error finding user:", error.message);
  }
});

app.get("/createuser", (req, res) => {
  let message = { message: "", type: "" };

  try {
    const error = req.query.error;
    if (error) {
      console.log(error);
      message = { message: error, type: "danger" };
    }
  } catch (error) {
    res.redirect("/createuser?error=error");
  }

  res.render("createuser", { message });
});

app.post("/update", upload, async (req, res) => {
  try {
    const userId = req.body.id;
    const { name, email, gender } = req.body;
    const profilePicture = req.file ? req.file.filename : null;

    // Find the user by ID
    const user = await User.findById(userId);

    // Update user fields
    user.name = name;
    user.email = email;
    user.gender = gender;

    // Update profile picture if a new one is uploaded
    if (profilePicture) {
      // Delete the old profile picture if it exists
      if (user.profilePicture) {
        fs.unlinkSync(`./images/${user.profilePicture}`);
      }
      user.profilePicture = profilePicture;
    }

    // Save the updated user
    await user.save();

    res.redirect("/"); // Redirect to the home page or another appropriate route
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/update/:id", async (req, res) => {
  const id = req.params.id;
  let message = "";
  try {
    let curuser = await User.findOne({ _id: id });
    console.log(curuser.email);
    res.render("update", { message, curuser });
  } catch (error) {
    console.log(error);
    res.status(401).json({error})
  }
});
app.listen(PORT, () => {
  console.log(`App listening on https://localhost:${PORT}`);
});
