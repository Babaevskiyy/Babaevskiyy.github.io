const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
require('dotenv').config();
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to the database!'))
  .catch(error => console.error('Database connection error:', error));

app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "stackpath.bootstrapcdn.com"],
        fontSrc: ["'self'", "stackpath.bootstrapcdn.com"],
        imgSrc: ["'self'", "data:", "https://avtosklad-4qqua2ge9-babaevskiys-projects.vercel.app"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
    },
}));

// middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(session({
  secret: 'my secret key',
  saveUninitialized: true,
  resave: false,
}));

app.use((req, res, next) => {
  res.locals.message = req.session.message;
  delete req.session.message;
  next();
});

app.use(express.static("uploads"));

// template engine
app.set('view engine', 'ejs');

app.use("", require('./routes/routes'));

app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
