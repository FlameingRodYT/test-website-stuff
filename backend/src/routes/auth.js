const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');
const RefreshToken = require('../models/RefreshToken');
const authenticateToken = require("../service/auth");

//the node env stuff can be iognored
//httpOnly -> this is our cookie flag TO MAKING IT httpOnly so the browser doesnt even get a say in it
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
}

//This method is used to issuing all our neededTokens
//All our user need both upon register and login
const issueTokens = (res, payload) => {

    //We sign our tokens ensuring user can pass
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' })
    const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET, { expiresIn: '7d' })

    //this is how long and where we store our cookies -> this IS HOW WELL TELL TH EBRWOSER TO STORE THE COOKIES
    res.cookie('accessToken', accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000
    })
    res.cookie('refreshToken', refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000
    })

    //return our cool token
    return refreshToken
}

//POST /api/auth/register
/*
With this code we do the actual registration fo the suer, it is literally the same as in springboot, maybe a bit more annoying lol
 */
router.post('/register', async (req, res) => {
    try {
        /*
        Grab the contents of the user from our Registration.jsx app (axiom connection duh)
         */
        const { username, password, faction } = req.body;

        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ error: 'Username already taken' });

        /*
        10 is a standard salt for hashing, the more you add the longer it takes
         */
        //TODO: make sure the password adheres to the rule of above 16 char and at least 1 special cahrater....
        if (password.length > 30) {
            return res.status(400).json({ error: 'Password is larger than 30 characters' });
        } else if (password.length < 10) {
            return res.status(400).json({ error: 'Password is shorter than 10 characters' });
        }

        const checks = [
            { regex: /[a-z]/, message: 'Password must contain at least one lowercase letter' },
            { regex: /[A-Z]/, message: 'Password must contain at least one uppercase letter' },
            { regex: /\d/,    message: 'Password must contain at least one number' },
            { regex: /[@.#$!%^&*.?]/, message: 'Password must contain at least one special character' },
        ];

        for (const { regex, message } of checks) {
            if (!regex.test(password)) {
                return res.status(400).json({ error: message });
            }
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({ username, passwordHash, faction });

        //We add our user to the neutral room and the room of the user faction
        await Room.updateMany(
            { $or: [{ faction: 'Neutral' }, { faction: user.faction }] },
            {
                $addToSet: {
                    members: {
                        user: user._id,
                        role: 'member'
                    }
            } }
        );


        //our payload is the data we parse to out token
        const payload = { id: user._id, username: user.username, faction: user.faction }
        //Delete any existing refreshTokens in the database -> we dont want the suer to be able to login on all devices at the same time
        await RefreshToken.deleteMany({ userId: user._id })
        //we grab our created refresh tokens from the method explained above
        const refreshToken = issueTokens(res, payload)
        await RefreshToken.create({ token: refreshToken, userId: user._id })

        /*
        If user created it a success -> and send back a json ONLY WITH NON CRITICAL DATA
         */
        res.status(201).json({ username: user.username, faction: user.faction });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//POST /api/auth/login
/*
honestly, its the same as above, cant be bother to expalin -> one difference is the comaprison stuff
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        /*
        just liike my other project we do not decrypt our password for obvious reason, we just comapre the hasesh and if the ahsesh align send the user thru
         */
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return res.status(400).json({ error: 'Invalid credentials' });


        //same as above
        const payload = { id: user._id, username: user.username, faction: user.faction }
        await RefreshToken.deleteMany({ userId: user._id })
        const refreshToken = issueTokens(res, payload)
        await RefreshToken.create({ token: refreshToken, userId: user._id })

        //Just send back that the user data instead of a creation success status
        res.json({ username: user.username, faction: user.faction });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//our post mehtod for refreshing our token
router.post('/refresh', async (req, res) => {
    //in issueToken we added the refreshToken fields
    //here we grab it
    const token = req.cookies.refreshToken
    //This error gets intercepted by axios.js and exits us out of the website due to expiration
    if (!token) return res.status(401).json({ error: 'No refresh token' })

    //validate the token
    const stored = await RefreshToken.findOne({ token })
    if (!stored) return res.status(403).json({ error: 'Invalid refresh token' })

    try {
        const user = jwt.verify(token, process.env.REFRESH_SECRET)
        const payload = { id: user.id, username: user.username, faction: user.faction }

        //Delete old, issue new (rotation — old token can't be reused)
        await RefreshToken.deleteOne({ token })
        const newRefreshToken = issueTokens(res, payload)
        await RefreshToken.create({ token: newRefreshToken, userId: user.id })

        res.json({ success: true })
    } catch {
        await RefreshToken.deleteOne({ token })
        res.status(403).json({ error: 'Session expired, please log in again' })
    }
});

router.post('/logout', async (req, res) => {
    const token = req.cookies.refreshToken
    if (token) await RefreshToken.deleteOne({ token })

    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    res.json({ success: true })
})

//used to quickly establish a ws connection -> technically can be compromised, but at least we dont expose the token in the frontend
router.get('/ws-ticket', authenticateToken, (req, res) => {
   //all the data required by our web scoket sicne it boradcasts it to all user -> not apswword ofc
    const ticket = jwt.sign(
        { id: req.user.id, username: req.user.username, faction: req.user.faction },
        process.env.JWT_SECRET,
        { expiresIn: '30s' }
    )
    res.json({ ticket })
})


router.get('/me', authenticateToken, (req, res) => {
    res.json({ username: req.user.username, faction: req.user.faction })
})

module.exports = router;