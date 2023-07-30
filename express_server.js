const express = require("express");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

const { generateRandomString, findUserByEmail, urlsForUser } = require('./helpers');

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

const PORT = 8080; // default port 8080

app.set("view engine", "ejs");


const users = {
  userRandomID: {
    id: "userRandomID",
    email: "test@test.com",
    password: "1",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "test1@test.com",
    password: "1",
  },
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID"
  }

};

//HOME PAGE
app.get("/", (req, res) => {
  res.redirect(`/login`);
});

//HOME PAGE
app.get("/urls", (req, res) => {
  const username = users[req.cookies["user_id"]];
  const templateVars = {username: username, urls: urlsForUser(req.cookies["user_id"], urlDatabase)};

  res.render("pages/urls_index", templateVars);
});

//NEW URL PAGE
app.get("/urls/new", (req, res) => {
  const username = users[req.cookies["user_id"]];
  const templateVars = { username: username };
  res.render("pages/urls_new", templateVars);
});

//LOGIN PAGE
app.get("/login", (req, res) => {
  const username = users[req.cookies["user_id"]];
  if(req.cookies["user_id"]) {
    return res.redirect(`/urls`);
  }

  const templateVars = {username: username};
  res.render("pages/urls_login", templateVars);
});

//SHORT URL
app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[req.params.id];

  if(!req.cookies["user_id"]) {
    res.status(401).send('You must be logged in to view this page');
  } else if (!longURL) {
    res.status(404).send('Short URL does not exist');
  } else if (longURL && req.cookies["user_id"] === users[req.cookies["user_id"]].id) {
  const templateVars = {shortURL: shortURL, username: users[req.cookies["user_id"]], longURL: urlDatabase[req.params.id]};
  res.render("pages/urls_show", templateVars);
  } else {
    res.status(403).send('You do not have permission to view this page');
  }
});


//REGISTER PAGE
app.get("/register", (req, res) => {
  const username = users[req.cookies["user_id"]];
  const templateVars = { username: username };

  if(req.cookies["user_id"]) {
  return res.redirect(`/urls`);
  }

  res.render("pages/urls_register", templateVars);
});

// REGISTER POST REQUEST
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const user = findUserByEmail(email, users);
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (user) {
    return res.status(400).send('Email already exists');
  }
  else if (!email || !password) {
    return res.status(400).send('Email or password cannot be empty');
  } else {
  users[id] = {"id": id, "email": email, "password": hashedPassword};

  res.cookie('user_id', id);
  res.redirect(`/urls`);
  }
});

//LOGIN GET REQUEST
app.get("/login", (req, res) => {
  const username = users[req.cookies["user_id"]];
  const templateVars = { username: username };
  if(req.cookies["user_id"]) {
    return res.redirect(`/urls`);
  }
  res.render("pages/urls_login", templateVars);
});

//LOGIN POST REQUEST
app.post("/login", (req, res) => {
  const {email, password} = req.body
  const user = findUserByEmail(email, users);
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email || !password) {
    return res.status(400).send('Email or password cannot be empty');
  } else if (user && bcrypt.compareSync(user.password, hashedPassword)) {
    res.cookie('user_id', user.id);
    res.redirect(`/urls`);
  } else if (!user) {
    return res.status(403).send('Email does not exist');
  } else {
    return res.status(403).send('Invalid login credentials');
  }
});

// POST REQUEST TO CREATE SHORT URL
app.post("/urls", (req, res) => {

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  const userID = req.cookies["user_id"];
  urlDatabase[shortURL] = {longURL: longURL, userID: userID};
  res.redirect(`/urls/`);

});

//POST REQUEST TO DELETE THE NEW URL
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.cookies["user_id"];
  const shortURL = req.params.id;
  if(userId === users[userId].id) {
    delete urlDatabase[shortURL];
    res.redirect(`/urls`);
  } else {
    res.status(403).send('You do not have permission to delete this URL');
  }
});

//POST REQUEST TO EDIT THE LONG URL
app.post("/urls/:id", (req, res) => {

  if(req.cookies["user_id"]) {
    const shortURL = req.params.id;
    urlDatabase[shortURL] = req.body.longURL;
    res.redirect(`/urls/`);
  } else {
    res.status(403).send('You do not have permission to edit this URL');
  }
});

//LOGOUT POST REQUEST
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});