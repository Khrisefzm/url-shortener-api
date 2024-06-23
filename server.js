const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const shortid = require("shortid");
const validUrl = require("valid-url");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

mongoose
  .connect("mongodb://127.0.0.1:27017/urlshortener")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const Url = mongoose.model(
  "Url",
  new mongoose.Schema({
    originalUrl: String,
    shortUrl: String,
    urlCode: String,
    date: { type: String, default: Date.now },
  })
);

app.post("/api/shorten", async (req, res) => {
  const { url } = req.body;
  const baseUrl = "http://localhost:5000";

  console.log("Received URL:", url);

  if (!validUrl.isUri(baseUrl)) {
    console.log("Invalid base URL");
    return res.status(401).json("Invalid base URL");
  }

  const urlCode = shortid.generate();

  if (validUrl.isUri(url)) {
    try {
      let urlData = await Url.findOne({ originalUrl: url });

      if (urlData) {
        console.log("URL already exists:", urlData);
        res.json(urlData);
      } else {
        const shortUrl = `${baseUrl}/${urlCode}`;

        urlData = new Url({
          originalUrl: url,
          shortUrl,
          urlCode,
          date: new Date(),
        });

        await urlData.save();
        console.log("URL saved:", urlData);

        res.json(urlData);
      }
    } catch (err) {
      console.error("Error saving URL:", err);
      res.status(500).json("Server error");
    }
  } else {
    console.log("Invalid original URL");
    res.status(401).json("Invalid original URL");
  }
});

app.get("/:code", async (req, res) => {
  try {
    const url = await Url.findOne({ urlCode: req.params.code });

    if (url) {
      return res.redirect(url.originalUrl);
    } else {
      return res.status(404).json("No URL found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
});

//enpoint
app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
