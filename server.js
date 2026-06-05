const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.urlencoded({ extended: false }));

const SECRET_CODE = "1234";

function getBulletins() {
  return JSON.parse(fs.readFileSync("bulletins.json", "utf8"));
}

function saveBulletins(bulletins) {
  fs.writeFileSync("bulletins.json", JSON.stringify(bulletins, null, 2));
}

app.get("/", (req, res) => {
  res.send("News Hotline is running.");
});

app.post("/news", (req, res) => {
  const bulletins = getBulletins();

  let twiml = "<Response>";
  twiml += `<Say voice="alice">Latest news bulletins. Newest first.</Say>`;

  bulletins.forEach((bulletin, index) => {
    twiml += `
      <Pause length="1"/>
      <Say voice="alice">Bulletin ${index + 1}. ${bulletin}</Say>
    `;
  });

  twiml += `<Pause length="1"/><Say voice="alice">End of bulletins. Goodbye.</Say>`;
  twiml += "</Response>";

  res.type("text/xml");
  res.send(twiml);
});

app.post("/sms", (req, res) => {
  const text = req.body.Body || "";

  if (!text.startsWith("ADD " + SECRET_CODE + " ")) {
    res.type("text/xml");
    return res.send(`<Response><Message>Not authorized.</Message></Response>`);
  }

  const bulletin = text.replace("ADD " + SECRET_CODE + " ", "").trim();

  const bulletins = getBulletins();
  bulletins.unshift(bulletin);
  saveBulletins(bulletins);

  res.type("text/xml");
  res.send(`<Response><Message>Bulletin added.</Message></Response>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("News Hotline running on port " + PORT);
});
