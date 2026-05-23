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

router.get('/me/friendRequests', authenticateToken, async (req, res) => {
    try {
        const {friendRequest} = await User.findById(req.user.id)

        let friends = [];

        for (const f of friendRequest) {
            let user = await User.findById(f)
            friends.push({user: {
                _id: user._id,
                username: user.username,
                faction: user.faction
                }});
        }

        res.json(friends);

    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
})

router.get('/me/friends', authenticateToken, async (req, res) => {
    try {
        const {friendList} = await User.findById(req.user.id)

        let friends = [];

        for (const f of friendList) {
            let user = await User.findById(f)
            friends.push({user: {
                    _id: user._id,
                    username: user.username,
                    faction: user.faction
                }});
        }

        res.json(friends);

    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
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

router.patch('/friends/request', authenticateToken, async (req, res) => {

    try {

        const sender = await User.findById(req.user.id)
        if (!sender) return res.status(401).json({ error: 'User does not exist' })

        const recipient = await User.findOne({ username: req.body.user.username })
        if (!recipient) return res.status(404).json({ error: 'Target user not found' })

        if (recipient.friendRequest.some(id => id.equals(sender._id)))
            return res.status(400).json({ error: 'Friend request already sent' })

        if (recipient.friendList.some(id => id.equals(sender._id)))
            return res.status(400).json({ error: 'Already friends' })

        await User.findByIdAndUpdate(recipient._id, {
            $addToSet: { friendRequest: sender._id }
        })

        res.status(200).json({ message: 'Pending friend request' })
    }
    catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.patch('/friends/request/accept', authenticateToken, async (req, res) => {

    try {

        const sender = await User.findById(req.user.id)
        const recipient = await User.findById(req.body.id)

        if(recipient.friendList.some(id => id.equals(sender._id)) || sender.friendList.some(id => id.equals(recipient._id))) {
            return res.status(401).json({ error: 'The User is already your friend' })
        }

        //UPDATE user friend list for both
        await User.findByIdAndUpdate(sender._id,{
            $addToSet: {friendList: recipient._id}});
        await User.findByIdAndUpdate(recipient._id,{
            $addToSet: {friendList: sender._id}});

        //DELETE friend request
        await User.findByIdAndUpdate(sender._id, {
            $pull: {friendRequest: recipient._id}
        })

        res.status(200).json({ message: 'Fren added successfully' });
    }
    catch (err) {
        res.status(500).json({ error: err.message })
    }

})

router.patch('/friends/request/delete', authenticateToken, async (req, res) => {

    try {

        const sender = await User.findById(req.user.id)
        const recipient = await User.findById(req.body.data.id)

        if(!sender.friendRequest.some(id => id.equals(recipient._id))) {
            return res.status(401).json({ error: 'Already removed!' })
        }

        await User.findByIdAndUpdate(sender._id, {
            $pull: {friendRequest: recipient._id}
        })

        res.status(200).json({ message: 'Fren not added successfully' });
    }
    catch (err) {
        res.status(500).json({ error: err.message })
    }

})

router.patch('/friends/remove', authenticateToken, async (req, res) => {

    try {
        const sender = await User.findById(req.user.id)
        const recipient = await User.findById(req.body.id)
        if(!sender.friendRequest.some(id => id.equals(recipient._id))) {
            return res.status(401).json({ error: 'Already removed!' })
        }

        await User.findByIdAndUpdate(sender._id, {
            $pull: {friendList: recipient._id}
        })
        await User.findByIdAndUpdate(recipient._id, {
            $pull: {friendList: recipient._id}
        })



    }
    catch (err) {
        res.status(500).json({ error: err.message })
    }

})




module.exports = router;