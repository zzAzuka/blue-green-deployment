const http = require("http");
const port = process.env.PORT || 3000;
const color = process.env.COLOR || "blue";

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", color }));
  } else {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<h1>Hello from ${color} environment!</h1>`);
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}, color: ${color}`);
});


