const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

// Connect Database
mongoose.connect("mongodb://127.0.0.1:27017/cafe_app");

// User Model
const User = mongoose.model("User", new mongoose.Schema({
    cafeName: String,
    username: String,
    password: String
}));

// Register
app.post("/register", async (req, res) => {
    const { cafeName, username, password } = req.body;

    const exists = await User.findOne({ username });
    if (exists) return res.json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ cafeName, username, password: hashed });

    res.json({ success: true });
});

// Login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ error: "Invalid credentials" });

    res.json({ success: true, cafeName: user.cafeName });
});

app.listen(5000, () => console.log("Server running on 5000"));
