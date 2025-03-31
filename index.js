require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const SECRET_KEY = process.env.SECRET_KEY;
const API_KEY = process.env.API_KEY;

// 🚀 API to Generate JWT Token
app.post("/get-token", (req, res) => {
    const { apiKey, userId } = req.body;

    if (apiKey !== API_KEY) {
        return res.status(403).json({ error: "Invalid API Key" });
    }
    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    const token = jwt.sign({ userId }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
});

// 🚀 Protected API Endpoint
app.get("/api/data", authenticateToken, (req, res) => {
    res.json({
        paymentTotalAmount: 200.0,
        paymentCurrency: "USD",
        invoices: [
            { invoiceId: "INV-001", amount: 100.0, url: "https://stripe.com", paid: true },
            { invoiceId: "INV-002", amount: 100.0, url: "https://stripe.com", paid: false },
        ],
        paymentDescription: "Payment for website development services",
        vat: { country: "IT", rate: "22" },
        business: {
            id: "VAT ID",
            country: "COUNTRY",
            city: "CITY",
            name: "NAME",
            address: "address",
            postalCode: "POSTAL CODE"
        },
        isNewCustomer: false,
        creditAmount: 10,
        balanceAmount: 0,
        amountDue: 190
    });
});

// 🔥 Middleware to Authenticate JWT Token
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
}

// 🚀 Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Server running on http://localhost:${PORT}`));
