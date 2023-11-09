const { check, validationResult } = require("express-validator");


//validamos cuando el usuario se esta dando de alta 
const userSignUpValidationRules = () => {
  return [
    check("name", "El nombre es obligatorio").not().isEmpty(),
    check("email", "El email es invalido").not().isEmpty().isEmail(),
    check("password", "Por favor ingrese una contraseña con 4 o más caracteres")
      .not()
      .isEmpty()
      .isLength({ min: 4 }),
  ];
};


//validamos los datos del usuario para loggearse
const userSignInValidationRules = () => {
  return [
    check("email", "El email es invalido").not().isEmpty().isEmail(),
    check("password", "El password es invalido").not().isEmpty().isLength({ min: 4 }),
  ];
};


//validamos los datos para el form de consulta
const userContactUsValidationRules = () => {
  return [
    check("name", "Por favor ingresa un nombre").not().isEmpty(),
    check("email", "Por favor, introduce una dirección de correo electrónico válida")
      .not()
      .isEmpty()
      .isEmail(),
    check("message", "Por favor ingrese un mensaje con al menos 10 palabras")
      .not()
      .isEmpty()
      .isLength({ min: 10 }),
  ];
};


//validamos el alta
const validateSignup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var messages = [];
    errors.array().forEach((error) => {
      messages.push(error.msg);
    });
    req.flash("error", messages);
    return res.redirect("/user/signup");
  }
  next();
};

//validamos para loggearse
const validateSignin = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var messages = [];
    errors.array().forEach((error) => {
      messages.push(error.msg);
    });
    req.flash("error", messages);
    return res.redirect("/user/signin");
  }
  next();
};

//validamos para contacto
const validateContactUs = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var messages = [];
    errors.array().forEach((error) => {
      messages.push(error.msg);
    });
    console.log(messages);
    req.flash("error", messages);
    return res.redirect("/pages/contact-us");
  }
  next();
};

module.exports = {
  userSignUpValidationRules,
  userSignInValidationRules,
  userContactUsValidationRules,
  validateSignup,
  validateSignin,
  validateContactUs,
};
