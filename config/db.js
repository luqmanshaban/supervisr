import mongoose from "mongoose";
import dotenv from 'dotenv'

dotenv.config()

const connectionSring = process.env.DB_STRING;

export const connectToDB = async () => {
    try {
        await mongoose.connect(connectionSring, {
            autoIndex: true
        })
        console.log('DATABASE CONNECTION SUCCESSFUL');
        
    } catch (error) {
        console.error(error);
        
    }
}
