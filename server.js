const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { errorHandler } = require('./src/appraisal/helpers/errorHandler');

require('dotenv').config(); // Load environment variables

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Routes
const authRoutes = require('./src/appraisal/v1/auth/auth.routes');
const recordsRoutes = require('./src/appraisal/v1/records/records.routes');
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/records', recordsRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
