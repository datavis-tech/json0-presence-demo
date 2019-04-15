const http = require('http');
const express = require('express');
const ShareDB = require('@teamwork/sharedb');
const WebSocket = require('ws');
const WebSocketJSONStream = require('@teamwork/websocket-json-stream');

// Use the json0 fork that implements presence.
const json0 = require('@datavis-tech/ot-json0');
ShareDB.types.register(json0.type);
ShareDB.types.defaultType = json0.type;

const backend = new ShareDB({
  disableDocAction: true,
  disableSpaceDelimitedActions: true
});
createDoc(startServer);

// Create initial document.
function createDoc(callback) {
  const connection = backend.connect();
  const doc = connection.get('examples', 'example');
  doc.fetch(function(err) {
    if (err) throw err;
    if (doc.type === null) {
      doc.create({ example: '' }, 'json0', callback);
      return;
    }
    callback();
  });
}

// Create a web server to serve files and listen to WebSocket connections
function startServer() {
  const app = express();
  app.use(express.static('static'));
  const server = http.createServer(app);

  const wss = new WebSocket.Server({ server: server });
  wss.on('connection', function(ws, req) {
    const stream = new WebSocketJSONStream(ws);
    backend.listen(stream);
  });

  server.listen(8080);
  console.log('Listening on http://localhost:8080');
}
