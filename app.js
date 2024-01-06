import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express';
import 'dotenv/config'
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import fs from 'fs'
import cors from 'cors'
import path from "path";

import axios from 'axios'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

app.use(express.json());
app.use(cors())

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// process the request
app.post('/api/v1/articles', async (req, res) => {
  const article = req.body.article
  try {
    const response = await run(article);
    // console.log(response);
    return res.status(200).json(response);  // Reversed the order of status and json
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });  // Send error as an object
  }
});


async function run(article) {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const message = `analyze the following essay, and return insightful summaries, highlight key findings, contribute and offer ways to improve the work by suggesting alternative academic phrases and relevant peer-reviewed articles only from Google Scholar. Ensure to condense main points while maintaining accuracy and coherence.
  Make sure you do the following: 
  1. Create and return a JavaScript object called feedback. The object MUST have the keys: summary, alternativePhrases, waysToImprove, relevantArticles.
  2. Don't add any other word or character before or after the JavaScript object 
  3. Make sure the length of the response is not less than 200 words
  4. Return your response in a TEXT format and NOT in a CODE SNIPPET format i.e NO BACKTICKS

   Here's the essay : ${article}`;

  const result = await model.generateContent(message);
  const response = await result.response;
  const text = response.text();
  return text;
}


const uploadDirectory = 'uploads/';

// Create 'uploads' directory if it doesn't exist
if (!existsSync(uploadDirectory)) {
  mkdirSync(uploadDirectory);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

app.post('/file-upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const uploadedFilePath = new URL(req.file.filename, `file://${__dirname}/${uploadDirectory}`).toString();

  // returns the content of the uploaded file
  const file = `uploads/${req.file.filename}`;
  fs.readFile(file, 'utf-8', async (err, data) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Error reading uploaded file.');
    }

    try {
      const feedback = await getFeedback(data.toString());
      res.status(200).send(feedback);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Error generating feedback.');
    }
  });
});

async function getFeedback(readArticle) {
  return new Promise(async (resolve, reject) => {
    const article = { article: readArticle };
    try {
      const response = await axios.post('http://localhost:4000/api/v1/articles', article);
      fs.appendFile('uploads/feedback.txt', response.data, (err) => {
        if (err) {
          console.error(`Error appending data to the file: ${err.message}`);
          reject('Error appending data to the file.');
          return;
        }
        console.log('Data has been inserted into the file.');
        
          resolve(response.data)
        });
      // });
    } catch (error) {
      console.error(error.message);
      reject('Error sending request to generate feedback.');
    }
  });
}

app.listen(4000, () => console.log('Running on http://localhost:4000'));
