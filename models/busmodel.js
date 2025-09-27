const mongoose = require("mongoose");
const busSchema = new mongoose.Schema({
  operator: String,
  from: String,
  to: String,
  departure: String,
  duration: Number,
  price: Number,
  seats: Number,
  bookedSeats: [
    {
      seatNumber: String,
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      pickup: String,
      drop: String,
    }
  ],
  pickups: [String],  // optional list of pickup points
  drops: [String]     // optional list of drop points
});


const Bus = mongoose.model("Bus", busSchema);
module.exports = Bus;
