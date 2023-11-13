
// Se crea un cliente Stripe.
const stripe = Stripe("pk_test_51OB3v1G3tCEFHGjmhYETu4GaZq1EhRvngHXtGV4cFrSlwmi179LEOJYqz4v2VdA298QNjjnlD209xAojEW8ytfjC001aVA9IIY");

// Crea una instancia del Element.
const elements = stripe.elements();

const style = {
  base: {
    color: "#32325d",
    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
    fontSmoothing: "antialiased",
    fontSize: "16px",
  },
  invalid: {
    color: "#fa755a",
    iconColor: "#fa755a",
  },
};

// Crear una instancia de la tarjeta. 
const card = elements.create("card", { style: style });

// Agregue una instancia del elemento de tarjeta al `card-element` <div>.
card.mount("#card-element");

// Manejar errores de validación en tiempo real de la tarjeta.
card.addEventListener("change", function (event) {
  const displayError = document.getElementById("card-errors");
  if (event.error) {
    displayError.textContent = event.error.message;
  } else {
    displayError.textContent = "";
  }
});

// Manejar el envío de formularios.
const $form = $("#checkout-form");

$form.submit(function (event) {
  event.preventDefault();
  $form.find("button").prop("disabled", true);

  const extraDetails = {
    name: $("#card-name").val(),
  };

  stripe.createToken(card, extraDetails).then(function (result) {
    if (result.error) {
      $form.find("button").prop("disabled", false); // Volver a habilitar el envío
    } else {
      // Envía el token a tu servidor.
      stripeTokenHandler(result.token);
    }
  });
});

// Envíe el formulario con el ID del token.
function stripeTokenHandler(token) {
  // Inserte el ID del token en el formulario para que se envíe al servidor.
  $form.append($('<input type="hidden" name="stripeToken" />').val(token.id));
  // Envía el formulario
  $form.get(0).submit();
}

