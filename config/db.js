const mongoose = require("mongoose");

//Conexion a la base de mongodb
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    await mongoose
      .connect(uri, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
      })
      .catch((error) => console.log(error));
    const connection = mongoose.connection;
    console.log("MONGODB CONECTADO CORRECTAMENTE");
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports = connectDB;
