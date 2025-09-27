const Bus=require("../models/busmodel.js");
const flash=require("connect-flash");
const Book=require("../models/bookingmodel")
const QRCode = require("qrcode");
const User=require("../models/usermodel");
const Busw = require("../models/busmodel");
module.exports.logout=(req,res,next)=>{
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "you are now logged out!");
        res.redirect("/home");
    })
}

module.exports.toproute=async (req,res)=>{
    try{
    let infos=await Bus.find();
    res.render("listings/show.ejs",{infos})
    }
    catch(e){
        res.send("error")
    }

}

module.exports.search= async (req, res) => {
    let { from, to } = req.query;
    const formatLocation = str => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    from = formatLocation(from.trim());
    to = formatLocation(to.trim());
    try {
        const buses = await Bus.find({
            from: from,
            to: to
        });
        res.render('listings/searchresults', { infos: buses });
    } catch (err) {
        console.log(err);
        res.send('Error searching buses');
    }
}

module.exports.busdetail=async (req,res)=>{
try{
    let{id}=req.params;
   let info = await Bus.findById(id); 
    res.render("listings/each.ejs",{info});
}
catch(e){
    res.send("error on show")
}
}


module.exports.busbook=async (req, res) => {
  try {
    const { id } = req.params;
    const info = await Bus.findById(id).populate("bookedSeats.user");

    if (!info) {
      req.flash("error", "Bus not found!");
      return res.redirect("/show");
    }

    res.render("listings/book.ejs", { info, currentUser: req.user });
  } catch (err) {
    console.log(err);
    req.flash("error", "Something went wrong!");
    res.redirect("/show");
  }
}

module.exports.busbookpost=async (req, res) => {
  try {
    const { id } = req.params;
    const { selectedSeats, pickup, drop, date } = req.body;

    if (!selectedSeats) {
      req.flash("error", "No seats selected!");
      return res.redirect(`/show/${id}/book`);
    }

    // Parse selectedSeats string into array
    const seats = JSON.parse(selectedSeats);

    const info = await Bus.findById(id);

    if (!info) {
      req.flash("error", "Bus not found!");
      return res.redirect("/show");
    }

    // Check if seats are already booked
    const alreadyBooked = info.bookedSeats.filter(s => seats.includes(s.seatNumber));
    if (alreadyBooked.length > 0) {
      req.flash("error", "Some seats are already booked!");
      return res.redirect(`/show/${id}/book`);
    }

    // Save booked seats
    seats.forEach(seatNum => {
      info.bookedSeats.push({
        seatNumber: seatNum,
        user: req.user._id,
        pickup,
        drop,
        date
      });
    });

    await info.save();

    req.flash("success", "Tickets booked successfully!");
    res.redirect(`/show/${req.params.id}`);
  } catch (err) {
    console.log(err);
    req.flash("error", "Something went wrong!");
    res.redirect(`/show/${id}/book`);
  }
}

module.exports.addpassenger=(req, res) => {
  const { seats, price, pickup, drop, date } = req.query;
  res.render("listings/addPassenger", {
    showId: req.params.id,
    seats: seats.split(","),
    price,
    pickup,
    drop,
    date
  });
}

module.exports.payment=async (req, res) => {
  try {
    const { seats, price, pickup, drop, date, name, age, contact } = req.body;

    if (!seats) throw new Error("No seats selected");

    const seatArray = typeof seats === "string" ? seats.split(",") : seats;

    // Handle passenger data
    let passengerArray = [];
    if (Array.isArray(name)) {
      name.forEach((n, i) => {
        passengerArray.push({
          name: n,
          age: Number(age[i]),
          contact: contact[i]
        });
      });
    } else {
      passengerArray.push({
        name,
        age: Number(age),
        contact
      });
    }

    // Simulate payment delay
    setTimeout(async () => {
      // Find bus
      const bus = await Bus.findById(req.params.id);
      if (!bus) throw new Error("Bus not found");

      // Save seats to bus
      seatArray.forEach(seat => {
        bus.bookedSeats.push({
          seatNumber: seat,
          price,
          user: req.user._id,
          pickup,
          drop,
          date
        });
      });
      await bus.save();
      // Create booking
      const newBooking = await Book.create({
        User: req.user._id,
        Passenger: passengerArray,
        Seats: seatArray,
        Price: Number(price),
        Pickup: pickup,
        Drop: drop,
        Date: date
      });
      // Generate QR code
      const qrData = `Booking ID: ${newBooking._id}\nBus: ${bus.name}\nSeats: ${seatArray.join(", ")}\nDate: ${date}`;
      const qrCodeUrl = await QRCode.toDataURL(qrData);
      res.render("listings/booksuccess", { booking: newBooking, qrCodeUrl });

    }, 4000);
     // 5 seconds delay

  } catch (err) {
    console.error("Booking error:", err);
    req.flash("error", "Something went wrong: " + err.message);
    res.redirect(`/show/${req.params.id}`);
  }
}

module.exports.mybooking=async (req, res) => {
  try {
    const bookings = await Book.find({ "User": req.user._id }).sort({ Date: -1 });

    res.render("listings/mybooking", { bookings });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    req.flash("error", "Could not load your bookings.");
    res.redirect("/");
  }
}

module.exports.deletebooking=async (req, res) => {
  try {
    let { id } = req.params;  // get booking id from URL
    let result = await Book.deleteOne({ _id: id }); // don't shadow res
    console.log(result);
      res.redirect("/home");
  } catch (e) {
    res.status(500).send(e);
  }
}


module.exports.postsignup= async (req, res, next) => {
    try {
        let { username, email, password } = req.body;
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
         
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to Safar.com");
            res.redirect("/home");
        });
    } catch (e) {
        req.flash("error", e.message); 
        res.redirect("/signup");
    }
}

module.exports.postlogin=(req, res) => {
        req.flash("success", "Welcome to Safar.com");
        res.redirect("/home");
    }

module.exports.addbus=async (req, res) => {
  try {
    const { operator, from, to, departure, duration, price, seats, pickups, drops } = req.body;

    const bus = new Busw({
      operator,
      from,
      to,
      departure,
      duration,
      price,
      seats,
      pickups: pickups.split(",").map(p => p.trim()), // convert to array
      drops: drops.split(",").map(d => d.trim()),
      bookedSeats: []
    });

    await bus.save();
    res.redirect("/home"); // after saving, redirect to list page
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding bus");
  }
}
    