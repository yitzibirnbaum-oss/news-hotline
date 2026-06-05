const express = require("express");
const fs = require("fs");
const { Pool } = require("pg");

const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
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

app.get("/admin", (req, res) => {
  res.send(`
    <html>
      <body style="font-family: Arial; max-width: 700px; margin: 40px auto;">
        <h1>News Hotline Admin</h1>

        <form method="POST" action="/admin/add">
          <input name="code" placeholder="Secret code" style="width:100%;padding:10px;margin-bottom:10px;" />

          <textarea name="bulletin" placeholder="Type bulletin here" style="width:100%;height:150px;padding:10px;"></textarea>

          <br><br>

          <button type="submit">Add Bulletin</button>
        </form>
      </body>
    </html>
  `);
});

app.post("/admin/add", (req, res) => {
  const code = req.body.code || "";
  const bulletin = req.body.bulletin || "";

  if (code !== SECRET_CODE) {
    return res.send("Wrong secret code.");
  }

  if (!bulletin.trim()) {
    return res.send("Bulletin cannot be empty.");
  }

  const bulletins = getBulletins();

  bulletins.unshift({
    text: bulletin.trim(),
    uploadedAt: new Date().toISOString()
  });

  saveBulletins(bulletins);

  res.send(`
    <h1>Bulletin Added</h1>
    <p>${bulletin}</p>
    <a href="/admin">Add Another</a>
  `);
});


app.post("/news", (req, res) => {
  res.type("text/xml");
  res.send(`
    <Response>
      <Redirect method="POST">/news/0</Redirect>
    </Response>
  `);
});

app.post("/news/:index", (req, res) => {
  const bulletins = getBulletins();
  const index = Number(req.params.index);

  function clean(text) {
    return String(text || "")
      .replace(/&/g, "and")
      .replace(/</g, "")
      .replace(/>/g, "")
      .replace(/"/g, "")
      .replace(/'/g, "");
  }

  if (index >= bulletins.length) {
    res.type("text/xml");
    return res.send(`
      <Response>
        <Say voice="alice">End of news. Goodbye.</Say>
        <Hangup/>
      </Response>
    `);
  }

  const item = bulletins[index];
  const text = typeof item === "string" ? item : item.text;
  const uploadedAt = typeof item === "string" ? null : item.uploadedAt;

  let timeText = "";

  if (uploadedAt) {
    const date = new Date(uploadedAt);

    const weekday = date.toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      weekday: "long"
    });

    const time = date.toLocaleTimeString("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "2-digit"
    });

    timeText = `${weekday} ${time}`;
  }

  const nextIndex = index + 1;

  res.type("text/xml");
  res.send(`
    <Response>
      <Gather input="dtmf" numDigits="1" action="/news/${nextIndex}" method="POST" timeout="1">
        <Say voice="alice">Ding.</Say>
        ${timeText ? `<Say voice="alice">${clean(timeText)}.</Say>` : ""}
        <Say voice="alice">${clean(text)}</Say>
      </Gather>

      <Redirect method="POST">/news/${nextIndex}</Redirect>
    </Response>
  `);
});

app.post("/sms", (req, res) => {
  const text = req.body.Body || "";

  if (!text.startsWith("ADD " + SECRET_CODE + " ")) {
    res.type("text/xml");
    return res.send("<Response><Message>Not authorized.</Message></Response>");
  }

  const bulletin = text.replace("ADD " + SECRET_CODE + " ", "").trim();

  const bulletins = getBulletins();

  bulletins.unshift({
    text: bulletin,
    uploadedAt: new Date().toISOString()
  });

  saveBulletins(bulletins);

  res.type("text/xml");
  res.send("<Response><Message>Bulletin added.</Message></Response>");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("News Hotline running on port " + PORT);
});
