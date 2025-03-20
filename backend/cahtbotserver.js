require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");

const app = express();
app.use(express.json());
app.use(cors());

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
    organization: "org-lgb7qMXz53eYYQ8x3wd9rIsn", // Check your OpenAI account settings
  })
);


app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: "You are an AI farm assistant." }, { role: "user", content: message }],
    });

    res.json({ reply: response.data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: "Error processing request" });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
