const mongoose=require("mongoose");
const bookschema = new mongoose.Schema({
  Passenger: [{
    name: String,
    age: Number,
    contact: Number
  }],
  Seats: [String],
  Price: Number,
  Pickup: String,
  Drop: String,
  Date: String,
  User: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

module.exports = mongoose.model("Book", bookschema);