const mongoose = require('mongoose');

/*
Again this is our rooms, there would be multiple and each room can have messages (look at Message.js)
 */
const roomSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    createdBy: { type: String, default: 'system' },
    createdAt: { type: Date, default: Date.now },
    faction: { type: String, default: 'Neutral', required: true },
    members: [{ user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
                role: { type: String, enum: ['member', 'commander', 'supreme_commander'], default: 'member'},
                joinedAt: { type: Date, default: Date.now },
    }],
});

module.exports = mongoose.model('Room', roomSchema);