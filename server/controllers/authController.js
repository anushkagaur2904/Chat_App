import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const signup = async (req, res) => {
    try{
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if(existingUser){
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // save user
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });
        res.status(201).json(user);
    }catch(error){
        res.status(500).json({ message: 'Something went wrong' });
    }
};
