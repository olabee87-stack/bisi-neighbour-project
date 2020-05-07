const express = require("express");
const app = express();
const PORT = 8040;
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const path = require("path");
const findOrCreate = require("mongoose-findorcreate");
const bodyParser = require("body-parser");
const router = require("express").Router();
require("dotenv/config");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//Database connection
mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true });
const db = mongoose.connection;

//Error check
db.on("error", (err) => {
  console.log(`Error occured while connecting to DB:${err}`);
});

//Connection check
db.on("open", () => {
  console.log(`Successfully connected to the DB`);
});

//Grocery schema
const grocerySchema = new Schema({
  firstname: String,
  lastname: String,
  username: String,
  password: String,
  address: String,
  phone: String,
});

grocerySchema.plugin(findOrCreate);
const User = mongoose.model("User", grocerySchema);

// Body parser middlewaare
app.use(bodyParser.urlencoded({ extended: "false" }));

// Set public folder
app.use(express.static(path.join(__dirname, "public")));

//Passport init
app.use(passport.initialize());
app.use(passport.session());

//User authentication
function authenticateUser(username, password, done) {
  User.findOne({ username: username }, (err, user) => {
    if (err) {
      return done(err);
    }

    if (!user) {
      return done(null, false, { message: "Incorrect username" });
    }

    if (user.password !== password) {
      return done(null, false, { message: "Incorrect password." });
    }
    return done(null, user);
  });
}

passport.use(new LocalStrategy(authenticateUser));

//Serializing user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

//Deserialize user
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    if (err) {
      done(err);
    }
    if (user) {
      done(null, user);
    }
  });
});

//Redirects a user that is already logged in
loginUser = (req, res, next) => {
  if (req.isAuthenticated()) {
    res.redirect("/");
  } else {
    //Go to the next param if function not fullfilled
    next();
  }
};

//Redirects a user that has not logged in
nonLoginUser = (req, res, next) => {
  if (req.isUnauthenticated()) {
    res.redirect("/login");
  } else {
    next();
  }
};

// Home route
app.get("/", function (req, res) {
  res.render("home");
});

// Log-in route
app.get("/login", function (req, res) {
  res.render("login");
});

//Sends/posts the information from the user's login page/input to the backend/db
app.post(
  "/login/send",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

// Register route
app.get("/register", function (req, res) {
  res.render("registration");
});

app.post("/register/send", (req, res) => {
  User.findOrCreate({ username: req.body.username }, (err, user, created) => {
    if (err) {
      console.log(`An error has occured ${err}`);
    }
    if (created) {
      user.firstname = req.body.firstname;
      user.lastname = req.body.lastname;
      user.password = req.body.password;
      user.address = req.body.address;
      user.phone = req.body.phone;

      user
        .save()
        .then((data) => {
          console.log(`Saved new user to DB: ${data}`);
          res.redirect("/login");
        })
        .catch((err) => {
          console.log(`Error occured while registering new user: ${err}`);
          res.redirect("/register");
        });
    } else {
      console.log(`The user, ${req.body.username} found in the Database.`);
      //Send this to client if username has already been taken
      res.send(
        "Username has been registered to another account. Please choose another."
      );
    }
  });
});

//Localhost port
app.listen(PORT, () => {
  console.log(`Server has started on port ${PORT}`);
});
