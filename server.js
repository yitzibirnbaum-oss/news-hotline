const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("News Hotline is running.");
});

app.post("/news", (req, res) => {
  res.type("text/xml");
  res.send(`
<Response>
  <Say voice="alice">
    Latest news bulletins. Newest first.
    Bulletin one. This is your first hosted bulletin.
    Bulletin two. This is the previous bulletin.
    End of bulletins. Goodbye.
  </Say>
</Response>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("News Hotline running on port " + PORT);
});
