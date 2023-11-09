require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const Category = require("./models/category");
var MongoStore = require("connect-mongo")(session);
const connectDB = require("./config/db");
const cors = require("cors");



const app = express();
require("./config/passport");

// mongodb configuracion
connectDB();



// configuracion del motor de vistas
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


// configracion del los archivos static
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public/images")));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
    }),
    //la sesion termina despues de 3 horas
    cookie: { maxAge: 60 * 1000 * 60 * 3 },
  })
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

//variables globales entre rutas
app.use(async (req, res, next) => {
  try {
    res.locals.login = req.isAuthenticated();
    res.locals.session = req.session;
    res.locals.currentUser = req.user;
    const categories = await Category.find({}).sort({ title: 1 }).exec();
    res.locals.categories = categories;
    next();
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

//configuraciones de rutas
const indexRouter = require("./routes/index");
const productsRouter = require("./routes/products");
const usersRouter = require("./routes/user");
const pagesRouter = require("./routes/pages");
const product = require("./models/product");

app.use("/products", productsRouter);
app.use("/user", usersRouter);
app.use("/pages", pagesRouter);
app.use("/", indexRouter);




//capturar 404 y reenviar al controlador de errores
app.use(function (req, res, next) {
  next(createError(404));
});

// manejador de errores
app.use(function (err, req, res, next) {
  // establecer locales, solo proporciona error en el desarrollo
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render pagina de error 404
  res.status(err.status || 500);
  res.render("error");
});

//escuchando puerto
var port = process.env.PORT || 3000;
app.set("port", port);
app.listen(port, () => {
  console.log("Server running at port " + port);
});

module.exports = app;
