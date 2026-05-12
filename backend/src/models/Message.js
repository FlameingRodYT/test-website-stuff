const mongoose = require('mongoose');

/*
These are our schemas, Message has the content of it, the person who sent it, faction and in which room it was sent
 */
const messageSchema = new mongoose.Schema({
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    username: { type: String, required: true },
    faction: { type: String, default: 'Neutral' },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);