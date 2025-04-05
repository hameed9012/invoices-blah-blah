require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const SECRET_KEY = process.env.SECRET_KEY;
const API_KEY = process.env.API_KEY;
const APPLICATION_ID = process.env.APPLICATION_ID;

// 🔐 Generate Auth Token
app.get("/auth/token", (req, res) => {
    const { applicationId, key } = req.body;

    if (applicationId !== APPLICATION_ID || key !== API_KEY) {
        return res.status(403).json({ error: "Invalid Application ID or API Key" });
    }

    const token = jwt.sign({ app: applicationId }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
});

// 🧠 Middleware: Token Auth
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Invalid or expired token" });
        req.user = decoded;
        next();
    });
}

// 💰 Get Payment Info
app.get("/checkout/data/:paymentId", authenticateToken, (req, res) => {
    const { paymentId } = req.params;

    if (!paymentId) {
        return res.status(400).json({ error: "Payment ID is required" });
    }

    res.json({
        paymentId,
        paymentTotalAmount: 200.0,
        paymentCurrency: "USD",
        invoices: [
            { invoiceId: "INV-001", amount: 100.0, url: "https://stripe.com", paid: true },
            { invoiceId: "INV-002", amount: 100.0, url: "https://stripe.com", paid: false },
        ],
        paymentDescription: "Payment for website development services",
        vat: {
            // You can fill this if needed
        },
        business: {
            // You can fill this if needed
        },
        isNewCustomer: true,
        creditAmount: 10,
        balanceAmount: 0,
        amountDue: 190,
        customerId: 1
    });
});

// 🏢 Save Customer Business Data
app.post("/stripe/customer/update/:customerId", authenticateToken, (req, res) => {
    const { customerId } = req.params;
    const {
        name,
        billingAddressLine1,
        postalCode,
        city,
        country,
        vatValue,
        vatType
    } = req.body;

    if (!customerId || !name || !billingAddressLine1 || !postalCode || !city || !country || !vatValue || !vatType) {
        return res.status(400).json({ error: "All customer fields are required" });
    }

    if (!vatType.endsWith("_vat")) {
        return res.status(400).json({ error: "Invalid vatType. Must end with '_vat'" });
    }

    res.json({ message: "Customer data saved successfully", customerId });
});

// 🌍 Save Geolocation Data
app.post("/stripe/customer/geolocation", authenticateToken, (req, res) => {
    const { postalCode, city, country, region } = req.body;

    if (!postalCode || !city || !country || !region) {
        return res.status(400).json({ error: "All geolocation fields are required" });
    }

    res.json({ message: "Geolocation saved successfully" });
});

// 🚀 Start Server
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`🔥 API Server running on http://localhost:${PORT}`);
});
