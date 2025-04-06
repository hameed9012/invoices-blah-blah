require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const SECRET_KEY = process.env.SECRET_KEY;
const API_KEY = process.env.API_KEY;

// 🚀 API to Generate JWT Token
app.post("/auth/token", (req, res) => {
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


//PAYMENT INFO
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
        isNewCustomer: false,
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
        vatType,
        region
    } = req.body;

    // Check if either Business or Geolocation data is present
    const isBusinessData = name && billingAddressLine1 && vatValue && vatType;
    const isGeolocationData = postalCode && city && country && region;

    // Validation for both Business and Geolocation data
    if (!customerId || (!isBusinessData && !isGeolocationData)) {
        return res.status(400).json({
            error: `Missing required fields for the data type. CustomerId: ${customerId}, Received Data: ${JSON.stringify(req.body)}`
        });
    }

    // Business Data Validation (only check for VAT and related fields if Business data is present)
    if (isBusinessData) {
        //if (!vatType.endsWith("_vat")) {
        //    return res.status(400).json({ error: "Invalid vatType. Only types ending in '_vat' are supported." });
        //}
    }

    console.log("received POST request on /stripe/customer/update");
    res.json({ message: "Customer data updated successfully" });
});


//Middleware to Validate JWT
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
//app.options("/auth/token", cors(corsOptions));
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`🔥 Server running on http://localhost:${PORT}`));
