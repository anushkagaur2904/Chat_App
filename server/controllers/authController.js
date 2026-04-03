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
        res.status(201).json({ message: 'User created successfully' });
    }catch(error){
        res.status(500).json({ message: 'Something went wrong' });
    }
};

export const login = async (req, res) => {
    try{
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if(!user){
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({ token });
    }catch(error){
        res.status(500).json({ message: 'Something went wrong' });
    }
};