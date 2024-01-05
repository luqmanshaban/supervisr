import User from "../model/User.js";
import bcrypt from 'bcryptjs'
import Jwt from "jsonwebtoken";

const login = async (req, res, next) => {
    const {username, password} = req.body;
    try {
        const user =  await User.findOne({ username: username });
        if(!user) {
            res.status(401).json({"message": "Invalid username or password"});
        }else {
            const result = bcrypt.compare(password, user.password);
            if(result) {
                const token = Jwt.sign({id: user.id},  'secret_jwt', { expiresIn: '30d' });
                res.status(200).json({ token: token });
            }else{
                res.status(401).json({"message": "Invalid username or password"});
             }
        }
        
    } catch (error) {
        console.log(error);
    }
};

const signup = async (req, res, next) => {
    const { username, email, password } = req.body;
 
    try {
       const hash = await bcrypt.hash(password, 10);
       const user = await User.create({ username: username, email: email,  password: hash });
       const token = Jwt.sign({ user: user.user }, 'secret_key', { expiresIn: '1hr'});
       res.status(200).json({ user: user })
    } catch (error) {
       next(error);
    }
 }
 
 export { login, signup };