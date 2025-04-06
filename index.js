require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const SECRET_KEY = process.env.SECRET_KEY;
const API_KEY = process.env.API_KEY;

// 🔐 AUTH - Token Generation
app.get("/auth/token", (req, res) => {
    const { applicationId, key } = req.body;

    if (!applicationId || !key) {
        return res.status(400).json({ error: "applicationId and key are required" });
    }

    if (key !== API_KEY) {
        return res.status(403).json({ error: "Invalid API Key" });
    }

    const token = jwt.sign({ applicationId }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
});

// 🧾 GET PAYMENT INFO
app.get("/checkout/data/:paymentId", authenticateToken, (req, res) => {
    const { paymentId } = req.params;

    if (!paymentId) {
        return res.status(400).json({ error: "Payment ID is required" });
    }

    res.json({
        paymentId: paymentId,
        paymentTotalAmount: 200.0,
        paymentCurrency: "USD",
        invoices: [
            { invoiceId: "INV-001", amount: 100.0, url: "https://stripe.com", paid: true },
            { invoiceId: "INV-002", amount: 100.0, url: "https://stripe.com", paid: false },
        ],
        paymentDescription: "Payment for website development services",
        isNewCustomer: true,
        creditAmount: 10,
        balanceAmount: 0,
        amountDue: 190,
        customerId: 1
    });
});

// 👤 SAVE CUSTOMER DATA
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
        return res.status(400).json({ error: `All fields are required ${customerId}, ${name}, ${billingAddressLine1}, ${postalCode}, ${city}, ${country}, ${vatValue}, ${vatType}
             ${JSON.stringify(req.body)}` });
    }

    // Only allow VAT types ending in _vat
    if (!vatType.endsWith("_vat")) {
        return res.status(400).json({ error: "Invalid vatType. Only types ending in '_vat' are supported." });
    }

    res.json({ message: "Customer data updated successfully" });
});

// 🌍 SAVE GEOLOCATION DATA
app.post("/stripe/customer/geolocation", authenticateToken, (req, res) => {
    const { postalCode, city, country, region } = req.body;

    if (!postalCode || !city || !country || !region) {
        return res.status(400).json({ error: "postalCode, city, country, and region are required" });
    }

    res.json({ message: "Geolocation data saved successfully" });
});

// 🔒 Middleware to Validate JWT
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
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`🔥 Server running on http://localhost:${PORT}`));
