const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const { User } = require('../models');

async function generateToken() {
    try {
        const user = await User.findOne({ where: { email: 'testadmin@example.com' } });
        if (!user) {
            console.error('User not found');
            process.exit(1);
        }

        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            companyId: 1 // We want to simulate having selected company 1
        };

        const secret = process.env.JWT_SECRET || 'your_jwt_secret';
        const token = jwt.sign(payload, secret, { expiresIn: '1h' });

        console.log(token);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

generateToken();
