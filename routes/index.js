const express = require("express");
const csrf = require("csurf");
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
const Product = require("../models/product");
const Category = require("../models/category");
const Cart = require("../models/cart");
const Order = require("../models/order");
const middleware = require("../middleware");
const product = require("../models/product");
const router = express.Router();
const csrfProtection = csrf();



router.use(csrfProtection);

// GET: home page
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({})
      .sort("-createdAt")
      .populate("category");
    res.render("shop/home", { pageName: "Home", products });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

// GET: agregar un producto al carrito de compras cuando se presiona el botón "Agregar al carrito"
router.get("/add-to-cart/:id", async (req, res) => {
  const productId = req.params.id;
  try {
    // obtener el carrito correcto, ya sea de la base de datos, de la sesión o de un carrito vacío.
    let user_cart;
    if (req.user) {
      user_cart = await Cart.findOne({ user: req.user._id });
    }
    let cart;
    if (
      (req.user && !user_cart && req.session.cart) ||
      (!req.user && req.session.cart)
    ) {
      cart = await new Cart(req.session.cart);
    } else if (!req.user || !user_cart) {
      cart = new Cart({});
    } else {
      cart = user_cart;
    }

    // agregar el producto al carrito
    const product = await Product.findById(productId);
    const itemIndex = cart.items.findIndex((p) => p.productId == productId);
    if (itemIndex > -1) {
      // Si el producto existe en el carrito, actualice la cantidad.
      cart.items[itemIndex].qty++;
      cart.items[itemIndex].price = cart.items[itemIndex].qty * product.price;
      cart.totalQty++;
      cart.totalCost += product.price;
    } else {
      // Si el producto no existe en el carrito, búsquelo en la base de datos para recuperar su precio y agregar un nuevo artículo.
      cart.items.push({
        productId: productId,
        qty: 1,
        price: product.price,
        title: product.title,
        productCode: product.productCode,
      });
      cart.totalQty++;
      cart.totalCost += product.price;
    }

    // si el usuario ha iniciado sesión, almacene la identificación del usuario y guarde el carrito en la base de datos
    if (req.user) {
      cart.user = req.user._id;
      await cart.save();
    }
    req.session.cart = cart;
    req.flash("Exito", "Artículo añadido al carrito de compras");
    res.redirect(req.headers.referer);
  } catch (err) {
    console.log(err.message);
    res.redirect("/");
  }
});

// GET: ver el contenido del carrito de compras
router.get("/shopping-cart", async (req, res) => {
  try {
    // encontrar el carrito, ya sea en sesión o en base de datos según el estado del usuario
    let cart_user;
    if (req.user) {
      cart_user = await Cart.findOne({ user: req.user._id });
    }
    // si el usuario ha iniciado sesión y tiene carrito, cargue el carrito del usuario desde la base de datos
    if (req.user && cart_user) {
      req.session.cart = cart_user;
      return res.render("shop/shopping-cart", {
        cart: cart_user,
        pageName: "Shopping Cart",
        products: await productsFromCart(cart_user),
      });
    }
    // si no hay ningún carrito en la sesión y el usuario no ha iniciado sesión, el carrito está vacío
    if (!req.session.cart) {
      return res.render("shop/shopping-cart", {
        cart: null,
        pageName: "Shopping Cart",
        products: null,
      });
    }
    //en caso contrario cargar el carrito de la sesión
    return res.render("shop/shopping-cart", {
      cart: req.session.cart,
      pageName: "Shopping Cart",
      products: await productsFromCart(req.session.cart),
    });
  } catch (err) {
    console.log(err.message);
    res.redirect("/");
  }
});

// GET: reducir uno de un artículo en el carrito de compras
router.get("/reduce/:id", async function (req, res, next) {
  // si un usuario ha iniciado sesión, reduzca del carrito del usuario y guarde
  // si no, reducir del carrito de la sesión
  const productId = req.params.id;
  let cart;
  try {
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id });
    } else if (req.session.cart) {
      cart = await new Cart(req.session.cart);
    }

    // busca el artículo con productId
    let itemIndex = cart.items.findIndex((p) => p.productId == productId);
    if (itemIndex > -1) {
      // encontrar el producto para encontrar su precio
      const product = await Product.findById(productId);
      // Si se encuentra producto, reduzca su cantidad.
      cart.items[itemIndex].qty--;
      cart.items[itemIndex].price -= product.price;
      cart.totalQty--;
      cart.totalCost -= product.price;
      // Si la cantidad del artículo llega a 0, retírelo del carrito.
      if (cart.items[itemIndex].qty <= 0) {
        await cart.items.remove({ _id: cart.items[itemIndex]._id });
      }
      req.session.cart = cart;
      //guarde el carrito solo si el usuario ha iniciado sesión
      if (req.user) {
        await cart.save();
      }
      //eliminar carrito si la cantidad es 0
      if (cart.totalQty <= 0) {
        req.session.cart = null;
        await Cart.findByIdAndRemove(cart._id);
      }
    }
    res.redirect(req.headers.referer);
  } catch (err) {
    console.log(err.message);
    res.redirect("/");
  }
});

// GET: eliminar todas las instancias de un solo producto del carrito
router.get("/removeAll/:id", async function (req, res, next) {
  const productId = req.params.id;
  let cart;
  try {
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id });
    } else if (req.session.cart) {
      cart = await new Cart(req.session.cart);
    }
    //busque el artículo con productId
    let itemIndex = cart.items.findIndex((p) => p.productId == productId);
    if (itemIndex > -1) {
      //encontrar el producto para encontrar su precio
      cart.totalQty -= cart.items[itemIndex].qty;
      cart.totalCost -= cart.items[itemIndex].price;
      await cart.items.remove({ _id: cart.items[itemIndex]._id });
    }
    req.session.cart = cart;
    //guarde el carrito solo si el usuario ha iniciado sesión
    if (req.user) {
      await cart.save();
    }
    //eliminar carrito si la cantidad es 0
    if (cart.totalQty <= 0) {
      req.session.cart = null;
      await Cart.findByIdAndRemove(cart._id);
    }
    res.redirect(req.headers.referer);
  } catch (err) {
    console.log(err.message);
    res.redirect("/");
  }
});

// GET: formulario de pago con token csrf
router.get("/checkout", middleware.isLoggedIn, async (req, res) => {
  const errorMsg = req.flash("error")[0];

  if (!req.session.cart) {
    return res.redirect("/shopping-cart");
  }
  //cargar el carrito con el id del carrito de la sesión desde la base de datos
  cart = await Cart.findById(req.session.cart._id);

  const errMsg = req.flash("error")[0];
  res.render("shop/checkout", {
    total: cart.totalCost,
    csrfToken: req.csrfToken(),
    errorMsg,
    pageName: "Checkout",
  });
});

// POST: manejar la lógica de pago y pago usando Stripe
router.post("/checkout", middleware.isLoggedIn, async (req, res) => {
  
  if (!req.session.cart) {
    return res.redirect("/shopping-cart");
  }
  const cart = await Cart.findById(req.session.cart._id);
  


  stripe.charges.create(
    {
      amount: cart.totalCost * 100,
      currency: "usd",
      source: req.body.stripeToken,
      description: "Test charge",
    },
    function (err, charge) {
      if (err) {
        req.flash("error", err.message);
        console.log(err);
        return res.redirect("/checkout");
      }
      const order = new Order({
        user: req.user,
        cart: {
          totalQty: cart.totalQty,
          totalCost: cart.totalCost,
          items: cart.items,
        },
        address: req.body.address,
        paymentId: charge.id,
      });
      order.save(async (err, newOrder) => {
        if (err) {
          console.log(err);
          return res.redirect("/checkout");
        }
        await cart.save();
        await Cart.findByIdAndDelete(cart._id);
        req.flash("success", "Successfully purchased");
        req.session.cart = null;
        res.redirect("/user/profile");
      });
    }
  );

});


//crear una matriz de productos para almacenar la información de cada producto en el carrito
async function productsFromCart(cart) {
  let products = []; // array of objects
  for (const item of cart.items) {
    let foundProduct = (
      await Product.findById(item.productId).populate("category")
    ).toObject();
    foundProduct["qty"] = item.qty;
    foundProduct["totalPrice"] = item.price;
    products.push(foundProduct);
  }
  return products;
}

module.exports = router;
