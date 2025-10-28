require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cors = require("cors");

const { UserModel } = require("./models/UserModel");
const { HoldingsModel } = require("./models/HoldingModel");
const { PositionModel } = require("./models/PositionModel");
const { OrderModel } = require("./models/OrderModel");

const app = express();
const PORT = process.env.PORT || 3002;
const MONGO_URL = process.env.MONGO_URL;

// ----------------------
// ✅ Middleware
// ----------------------
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json());

// ----------------------
// ✅ MongoDB Connection
// ----------------------
mongoose
  .connect(MONGO_URL)
  .then(() => console.log("✅ Database connected successfully"))
  .catch((err) => console.error("❌ Database connection failed:", err));

// ----------------------
// ✅ JWT Authentication Middleware
// ----------------------
// ----------------------
// ✅ Verify Token Route
// ----------------------
app.get("/verifyToken", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.json({ valid: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.json({ valid: false, message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ valid: true, userId: decoded.id });
  } catch (err) {
    console.error("❌ Token invalid or expired:", err.message);
    return res.json({ valid: false, message: "Invalid or expired token" });
  }
});

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  console.log("🔹 Verifying token:", token);
  console.log("🔹 Using secret:", process.env.JWT_SECRET);

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("❌ JWT verification error:", err.message);
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    req.user = decoded;
    console.log("✅ Token decoded:", decoded);
    next();
  });
};

// ----------------------
// ✅ Test Route
// ----------------------
app.get("/", (req, res) => {
  res.send("🚀 Server is running fine!");
});

// ----------------------
// ✅ Signup Route
// ----------------------
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    const userExists = await UserModel.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new UserModel({
      username,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();
    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "✅ User created successfully",
      user: {
        id: savedUser._id,
        username: savedUser.username,
      },
      token,
    });
  } catch (error) {
    console.error("❌ Error in signup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ----------------------
// ✅ Signin Route
// ----------------------
// ----------------------
// ✅ Logout Route
// ----------------------
app.post("/logout", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // (Optional) If you want to track logged-in sessions, you can clear token in DB

    // Since JWT is stateless, just tell frontend to delete it
    res.clearCookie("token", { domain: ".yourapp.com" });
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("❌ Error during logout:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/signin", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("🔹 Signin request body:", req.body);

    const user = await UserModel.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Password is incorrect" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    console.log("✅ Login successful for:", user.username);

    res.status(200).json({
      message: "✅ Login successful",
      user: {
        id: user._id,
        username: user.username,
      },
      token,
    });
  } catch (error) {
    console.error("❌ Error in signin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ----------------------
// ✅ Add Holding Route
// ----------------------
app.post("/addHolding", authenticateUser, async (req, res) => {
  try {
    const { name, qty, avg, price, net, day } = req.body;

    const newHolding = new HoldingsModel({
      name,
      qty,
      avg,
      price,
      net,
      day,
      userId: req.user.id,
    });

    await newHolding.save();

    res.status(201).json({
      message: "✅ Holding added successfully",
      data: newHolding,
    });
  } catch (error) {
    console.error("❌ Error adding holding:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ----------------------
// ✅ Get All Holdings (Protected Route)
// ----------------------
app.get("/holdings", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const holdings = await HoldingsModel.find({ userId });

    res.status(200).json({
      message: "✅ Holdings fetched successfully",
      data: holdings,
    });
  } catch (error) {
    console.error("❌ Error fetching holdings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ----------------------
// ✅ Add Position Route
// ----------------------
app.post("/addPosition", authenticateUser, async (req, res) => {
  try {
    const { product, name, qty, avg, price, net, day, isLoss } = req.body;

    const newPosition = new PositionModel({
      product,
      name,
      qty,
      avg,
      price,
      net,
      day,
      isLoss,
      userId: req.user.id,
    });

    await newPosition.save();

    res.status(201).json({
      message: "✅ Position added successfully",
      data: newPosition,
    });
  } catch (error) {
    console.error("❌ Error adding position:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.get("/positions", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId);
    const positions = await PositionModel.find({ userId });

    res.status(200).json({
      message: "✅ Positions fetched successfully",
      data: positions,
    });
  } catch (error) {
    console.error("❌ Error fetching positions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// ----------------------
// ✅ Start Server
// ----------------------
// ----------------------
// ✅ Add Order Route (Protected)
// ----------------------
app.post("/addOrder", authenticateUser, async (req, res) => {
  try {
    const { name, qty, price, mode } = req.body;

    if (!name || !qty || !price || !mode) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Use decoded JWT to attach userId
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const newOrder = new OrderModel({
      name,
      qty,
      price,
      mode,
      userId,
    });

    await newOrder.save();

    res.status(201).json({
      message: "✅ Order added successfully",
      data: newOrder,
    });
  } catch (error) {
    console.error("❌ Error adding order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.get("/orders", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("🔹 Fetching orders for user:", userId);

    const orders = await OrderModel.find({ userId });

    res.status(200).json({
      message: "✅ Orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
