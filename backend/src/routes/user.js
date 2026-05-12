const express = require('express');
const router = express.Router()
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const authenticateToken = require("../service/auth");
const Room = require('../models/Room');
const bcrypt = require('bcrypt')

router.get('/', async (req, res) => {
    const users = await User.find();
    res.json(users);
})

router.patch('/me', authenticateToken, async (req, res) => {

    try {
        const { username, faction } = req.body;

        const currentUser = User.findById(req.user.id);

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { username, faction },
            { new: true }
        );

        if(currentUser.faction !== faction) {

            //Removes the user from the old rooom
            await Room.updateOne(
                {faction: currentUser.faction},
                {$pull: {members: updatedUser._id}}
            )

            //Put them in the new one
            await Room.updateOne(
                {faction: faction},
                {$addToSet: {members: updatedUser._id}}
            )

        }


      res.status(200).json(updatedUser);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }

});

router.patch('/me/password', authenticateToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Both fields are required' })
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' })
        }

        const user = await User.findById(req.user.id)
        const isMatch = await bcrypt.compare(oldPassword, user.passwordHash)
        if (!isMatch) {
            return res.status(401).json({ error: 'Old password is incorrect' })
        }

        const hashed = await bcrypt.hash(newPassword, 10)
        await User.findByIdAndUpdate(req.user.id, { passwordHash: hashed })

        res.status(200).json({ message: 'Password updated successfully' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})


module.exports = router;