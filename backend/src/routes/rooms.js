const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Message = require('../models/Message');
const authenticateToken = require('../service/auth');

//GET ALL ROOMS
/*
Simple route that finds all rooms
 */
router.get('/', authenticateToken,async (req, res) => {
    try {
        //With this commadn we both get and popualte our user and also prevent password has leaks so litearlly only the important data can be viewed aka username
        const rooms = await Room.find({ 'members.user' : req.user.id }).populate('members.user', 'username faction');
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//GET all messages
/*
We get our messages per room
 */
router.get('/:roomId/messages', async (req, res) => {
    const messages = await Message.find({ roomId: req.params.roomId })
        .sort({ createdAt: 1 })
        .limit(50);
    res.json(messages);
});

/*
Check if an actual user with a JWT token creeated the room and not whatever
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description, faction } = req.body;
        const existing = await Room.findOne({ name });
        if (existing) return res.status(400).json({ error: 'Room already exists' });

        if (faction === '' || faction === null) {
            return res.status(400).json({ error: 'Faction is a requirement' });
        }

        //TODO: change this when you add invite based thing
        const User = require('../models/User');
        const eligibleUsers = faction === 'Neutral'
            ? await User.find({}, '_id role')
            : await User.find({ faction }, '_id role');

        const memberIds = eligibleUsers.map(u => u._id);
        const supreme_commander = eligibleUsers
            .filter(u => u.role === 'super_admin')
            .map(u => u._id);

        const normalUsers = eligibleUsers
            .filter(u =>
                u.role === 'user' &&
                u._id.toString() !== req.user.id &&
                !supreme_commander.some(id => id.toString() === u._id.toString())
            )
            .map(u => u._id);


        const members = [];
        members.push({
            user: req.user.id,
            role: 'commander',
        });

        supreme_commander.forEach(id => {
            members.push({
                user: id,
                role: 'supreme_commander',
            });
        });

        normalUsers.forEach(id => {
            members.push({
                user: id,
                role: 'member',
            });
        });


        const room = await Room.create({
            name,
            description,
            createdBy: req.user.username,
            faction: faction,
            members: members,
        });

        const populated = await room.populate('members.user', 'username faction');
        res.status(201).json(populated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;