const mongoose = require('mongoose');

/*
For our User we store the username obviously and the ahshed password in order to establish a basic bcrypt security system
 */
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    faction: { type: String, default: 'Neutral' }, //These are the factions a person might choose
    createdAt: { type: Date, default: Date.now },
    role: { type: String, enum: ['user', 'super_admin'],  default: 'user' },
    friendList: [{type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}],
    friendRequest: [{type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}],
    avatarUrl: { type: String, default: null } //basically link to the pfp
});

module.exports = mongoose.model('User', userSchema);