const mongoose = require('mongoose');
/*
SELF explanatory, but this is basically how we connect ot our database, in our case we use MongodDB atlas adn the infomration to the connection is stored in .env file
 */
const connectDB = async () => {
    try {
        /*
        Our connection to MogoDB via .env path
         */
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection failed:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;