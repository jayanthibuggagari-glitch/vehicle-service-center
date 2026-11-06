
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Home page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Get customers
app.get('/api/customers', (req, res) => {
    db.query('SELECT * FROM customers', (err, results) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        res.json(results);
    });
});

// Add customer
app.post('/api/customers', (req, res) => {
    const { customer_name, phone, email, address } = req.body;

    const sql = `
        INSERT INTO customers
        (customer_name, phone, email, address)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [customer_name, phone, email, address], (err, result) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        res.json({ message: 'Customer added successfully', id: result.insertId });
    });
});

// Get vehicles
app.get('/api/vehicles', (req, res) => {
    const sql = `
        SELECT v.*, c.customer_name
        FROM vehicles v
        LEFT JOIN customers c ON v.customer_id = c.customer_id
        ORDER BY v.vehicle_id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        res.json(results);
    });
});

// Add vehicle
app.post('/api/vehicles', (req, res) => {
    const { customer_id, vehicle_number, vehicle_model, vehicle_type } = req.body;

    const sql = `
        INSERT INTO vehicles
        (customer_id, vehicle_number, vehicle_model, vehicle_type)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [customer_id, vehicle_number, vehicle_model, vehicle_type], (err, result) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        res.json({ message: 'Vehicle added successfully', id: result.insertId });
    });
});

// Get services
app.get('/api/services', (req, res) => {
    const sql = `
        SELECT service_id, vehicle_id, service_type,
        service_date, description, service_charge, status
        FROM services
        ORDER BY service_id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        res.json(results);
    });
});

// Add service
app.post('/api/services', (req, res) => {
    const {
        vehicle_id,
        service_type,
        service_date,
        description,
        service_charge,
        status
    } = req.body;

    const sql = `
        INSERT INTO services
        (vehicle_id, service_type, service_date,
        description, service_charge, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        vehicle_id,
        service_type,
        service_date,
        description,
        service_charge,
        status || 'Pending'
    ], (err, result) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        res.json({ message: 'Service added successfully', id: result.insertId });
    });
});

// Update service status
app.put('/api/services/:id/status', (req, res) => {
    const { status } = req.body;

    db.query(
        'UPDATE services SET status = ? WHERE service_id = ?',
        [status, req.params.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
            res.json({ message: 'Service status updated successfully' });
        }
    );
});

// Get payments
app.get('/api/payments', (req, res) => {
    const sql = `
        SELECT payment_id, service_id, amount,
        DATE_FORMAT(payment_date, '%Y-%m-%d') AS payment_date,
        payment_method, status
        FROM payments
        ORDER BY payment_id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        res.json(results);
    });
});

// Add payment
app.post('/api/payments', (req, res) => {
    const {
        service_id,
        amount,
        payment_date,
        payment_method,
        status
    } = req.body;

    if (!service_id || !amount || !payment_date || !payment_method || !status) {
        return res.status(400).json({ message: 'Please enter all payment details' });
    }

    const sql = `
        INSERT INTO payments
        (service_id, amount, payment_date, payment_method, status)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        service_id,
        amount,
        payment_date,
        payment_method,
        status
    ], (err, result) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }

        res.json({
            message: 'Payment saved successfully',
            payment_id: result.insertId
        });
    });
});

// Dashboard
app.get('/api/dashboard', (req, res) => {
    const queries = [
        'SELECT COUNT(*) AS total_customers FROM customers',
        'SELECT COUNT(*) AS total_vehicles FROM vehicles',
        'SELECT COUNT(*) AS total_services FROM services',
        'SELECT COUNT(*) AS total_payments FROM payments'
    ];

    Promise.all(queries.map(sql => new Promise((resolve, reject) => {
        db.query(sql, (err, result) => {
            if (err) reject(err);
            else resolve(result[0]);
        });
    })))
    .then(results => {
        res.json({
            customers: results[0].total_customers,
            vehicles: results[1].total_vehicles,
            services: results[2].total_services,
            payments: results[3].total_payments
        });
    })
    .catch(err => {
        res.status(500).json({ message: err.message });
    });
});

// Start server
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
