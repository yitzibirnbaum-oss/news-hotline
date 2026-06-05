const express = require("express");
const fs = require("fs");

const app = express();

app.use(express.urlencoded({ extended: false }));

const SECRET_CODE = "1234";

function getBulletins() {
return JSON.parse(fs.readFileSync("bulletins.json", "utf8"));
}

function saveBulletins(bulletins) {
fs.writeFileSync(
"bulletins.json",
JSON.stringify(bulletins, null, 2)
);
}

app.get("/", (req, res) => {
res.send("News Hotline is running.");
});

app.get("/admin", (req, res) => {
res.send(`


News Hotline Admin

    <form method="POST" action="/admin/add">
      <input
        name="code"
        placeholder="Secret code"
        style="width:100%;padding:10px;margin-bottom:10px;"
      />

      <textarea
        name="bulletin"
        placeholder="Type bulletin here"
        style="width:100%;height:150px;padding:10px;"
      ></textarea>

      <br><br>

      <button type="submit">
        Add Bulletin
      </button>
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

res.send( <h1>Bulletin Added</h1> <p>${bulletin}</p> <a href="/admin">Add Another</a> );
});

app.post("/news", (req, res) => {
const bulletins = getBulletins();

let twiml = "";

bulletins.forEach((item) => {
const text =
typeof item === "string"
? item
: item.text;

const uploadedAt =
  typeof item === "string"
    ? null
    : item.uploadedAt;

twiml += `
  <Play>
  https://actions.google.com/sounds/v1/alarms/beep_short.ogg
  </Play>
`;

if (uploadedAt) {
  const timeText = new Date(uploadedAt)
    .toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });

  twiml += `
    <Say voice="alice">
      Posted ${timeText}
    </Say>
  `;
}

twiml += `
  <Say voice="alice">
    ${text}
  </Say>

  <Pause length="1"/>
`;

});

twiml += "";

res.type("text/xml");
res.send(twiml);
});

app.post("/sms", (req, res) => {
const text = req.body.Body || "";

if (!text.startsWith("ADD " + SECRET_CODE + " ")) {
res.type("text/xml");
return res.send(
"Not authorized."
);
}

const bulletin = text
.replace("ADD " + SECRET_CODE + " ", "")
.trim();

const bulletins = getBulletins();

bulletins.unshift({
text: bulletin,
uploadedAt: new Date().toISOString()
});

saveBulletins(bulletins);

res.type("text/xml");
res.send(
"Bulletin added."
);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
console.log("News Hotline running on port " + PORT);
});
