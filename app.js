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
app.use(cors({
  origin: ['http://127.0.0.1:3000', 'https://luqmanshaban.github.io', 'http://localhost:3000', 'https://mysupervisr-client.vercel.app', 'http://127.0.0.1:8080']
}))

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// process the request
app.post('/api/v1/articles', async (req, res) => {
  const article = req.body.article
  try {
    const response = await run(article);
    setTimeout(() => {
      deleteUploadedFiles()
    }, 30000)
    console.log(response);
    return res.status(200).json(response);  // Reversed the order of status and json
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });  // Send error as an object
  }
});

async function deleteUploadedFiles() {
  const filePath = path.join(__dirname, 'uploads/', 'file.txt');

  try {
    await fs.promises.unlink(filePath);
    console.log('File.txt has been deleted.');
  } catch (error) {
    console.error(`Error deleting file.txt: ${error.message}`);
  }
}

async function run(article) {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const message = `Analyze the provided essay, offering insightful summaries, highlighting key findings, and contributing suggestions for improvement. Provide alternative academic phrases and relevant peer-reviewed articles sourced exclusively from Google Scholar. Condense main points while maintaining accuracy and coherence.

  Ensure strict adherence to the following rules:
  1. Create and ONLY return a string object named 'feedback.' The object must contain keys such as summary, alternativePhrases (suggesting phrases for the writer to use instead), waysToImprove, and relevantArticles.
  2. Ensure that the response length is not less than 200 words.
  3. Return your response in and ONLY in a VALID  JSON OBJECT format i.e { "feedback": { "summery": "", "keyFindings": "", "alternativePhrases": "","waysToImprove": "", "relevantArticles":"" } }
  
  Here's the essay: ${article}
  `;

  const result = await model.generateContent(message);
  const response = await result.response;
  const text = response.text();
  return text;
}

app.post('/file-upload', async(req, res) => {
  const article = req.body.article 
  try {
    const response = await run(article)
    console.log(response);
    res.status(200).json({ response: response })
  } catch (error) {
    res.status(500).json({ error: error})
    console.log(error);
  }
})

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
app.get('/', (req, res) => {
  res.send('<p>Visit: <a href="https://luqmanshaban.github.io/mysupervisr-client/">The client side</a></p>')
})

// app.post('/file-upload', upload.single('file'), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).send('No file uploaded.');
//   }

//   const uploadedFilePath = new URL(req.file.filename, `file://${__dirname}/${uploadDirectory}`).toString();

//   // returns the content of the uploaded file
//   const file = `uploads/${req.file.filename}`;
//   fs.readFile(file, 'utf-8', async (err, data) => {
//     if (err) {
//       console.error(err.message);
//       return res.status(500).send('Error reading uploaded file.');
//     }

//     try {
//       const feedback = await getFeedback(data.toString());
//       res.status(200).send(feedback);
//     } catch (error) {
//       console.error(error.message);
//       res.status(500).send('Error generating feedback.');
//     }
//   });
// });

async function getFeedback(readArticle) {
  return new Promise(async (resolve, reject) => {
    const article = { article: readArticle };
    try {
      const response = await axios.post('http://localhost:4000/api/v1/articles', article);
      // fs.appendFile('uploads/feedback.txt', response.data, (err) => {
      //   if (err) {
      //     console.error(`Error appending data to the file: ${err.message}`);
      //     reject('Error appending data to the file.');
      //     return;
      //   }
      //   console.log('Data has been inserted into the file.');
        
      // });
      resolve(response.data)
      // });crucial
    } catch (error) {
      console.error(error.message);
      reject('Error sending request to generate feedback.');
    }
  });
}

app.listen(4000, () => console.log('Running on http://localhost:4000'));
