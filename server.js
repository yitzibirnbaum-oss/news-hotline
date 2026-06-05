const express = require("express");
const fs = require("fs");

const app = express();

app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("News Hotline is running.");
});

app.post("/news", (req, res) => {
  const bulletins = JSON.parse(
    fs.readFileSync("bulletins.json", "utf8")
  );

  let twiml = "<Response>";

  twiml += `
    <Say voice="alice">
      Latest news bulletins. Newest first.
    </Say>
  `;

  bulletins.forEach((bulletin, index) => {
    twiml += `
      <Pause length="1"/>
      <Say voice="alice">
        Bulletin ${index + 1}. ${bulletin}
      </Say>
    `;
  });

  twiml += `
    <Pause length="1"/>
    <Say voice="alice">
      End of bulletins. Goodbye.
    </Say>
  `;

  twiml += "</Response>";

  res.type("text/xml");
  res.send(twiml);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("News Hotline running on port " + PORT);
});
