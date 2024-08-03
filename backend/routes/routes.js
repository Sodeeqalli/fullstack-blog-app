const express = require('express')
const User = require('../models/User')
const jwt = require('jsonwebtoken');

const router = express.Router();

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    if(!token){
       return  res.status(401).json({message: 'No token, authentication denied'})
    }
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch(err){
        return res.status(401).json({message:"Token is not valid"});
    }
}


router.get('/:id', async (req, res) =>
{   try{
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({message: 'User not found'})
        }
        res.json(user);
    }
    catch (err){
        res.status(500).json({message: 'Server error'});
    }
}
);


router.put('/', authenticateToken, async (req, res) => {
    const {username, bio, profilePicture}  = req.body;

    try{
        const user = await User.findById(req.user.userId).select('-password');
        if(!user){
            return res.status(404).json({message: 'User not found'})
        }

        user.username = username || user.username;
        user.bio = bio  || user.bio;
        user.profilePicture = profilePicture || user.profilePicture;

        await user.save();
        res.json(user)
    }
    catch(err){
        res.status(500).json({message: 'Server Error'})
    }
}
)


router.post('/:id/follow', authenticateToken, async (req, res)=>{
    try{
        const user = await User.findById(req.params.id)
        if(!user){
            return res.status(404).json({message: 'User not found'});
        }
        const currentUser = await User.findById(req.user.userId)

       if (user.followers.includes(currentUser.userId)){
        return res.status(400).json({message: 'You are already following this user'});
       }

       user.followers.push(currentUser.userId)
       
       await user.save()

       currentUser.following.push(user.userId)
       await currentUser.save()
    }
    catch (err){
        res.status(500).json({message: "Server error"})
    }
})


router.post('/:id/unfollow', authenticateToken, async (req, res) =>{
    try{
        const user = User.findById(req.params.id);
         if(!user){
            return res.status(404).json({message: 'User not found'}); 
        }
        const currentUser = User.findById(req.user.userId);
        
        user.followers.pull(currentUser.userId)
        await  user.save()

        currentUser.following.pull(user.userId)
        await currentUser.save()
    }
    catch (err) {
        res.status(500).json({message: "server errror"})
    }







})