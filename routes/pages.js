const express = require("express");
const csrf = require("csurf");
const nodemailer = require("nodemailer");
const router = express.Router();
const {
  userContactUsValidationRules,
  validateContactUs,
} = require("../config/validator");
const csrfProtection = csrf();
router.use(csrfProtection);
/*
//GET: mostrar la página sobre nosotros
router.get("/about-us", (req, res) => {
  res.render("pages/about-us", {
    pageName: "About Us",
  });
});
*/

//GET: display contact us page and form with csrf tokens
router.get("/contact-us", (req, res) => {
  const successMsg = req.flash("success")[0];
  const errorMsg = req.flash("error");
  res.render("pages/contact-us", {
    pageName: "Contact Us",
    csrfToken: req.csrfToken(),
    successMsg,
    errorMsg,
  });
});

//POST: manejar la lógica del formulario de contacto usando nodemailer
router.post(
  "/contact-us",
  [userContactUsValidationRules(), validateContactUs],
  (req, res) => {
    // instancia de SMTP server
    const smtpTrans = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        // datos de la compania
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // email options
    const mailOpts = {
      from: req.body.email,
      to: process.env.GMAIL_EMAIL,
      subject: `Enquiry from ${req.body.name}`,
      html: `
      <div>
      <h2 style="color: #478ba2; text-align:center;">Nombre del cliente: ${req.body.name}</h2>
      <h3 style="color: #478ba2;">Email del cliente: (${req.body.email})<h3>
      </div>
      <h3 style="color: #478ba2;">Mensaje del cliente: </h3>
      <div style="font-size: 30;">
      ${req.body.message}
      </div>
      `,
    };

    // enviar el mail
    smtpTrans.sendMail(mailOpts, (error, response) => {
      if (error) {
        req.flash(
          "error",
          "Se produjo un error... Verifique su conexión a Internet y vuelva a intentarlo más tarde."
        );
        return res.redirect("/pages/contact-us");
      } else {
        req.flash(
          "success",
          "¡Correo electrónico enviado exitosamente! Gracias por tu consulta."
        );
        return res.redirect("/pages/contact-us");
      }
    });
  }
);

module.exports = router;
