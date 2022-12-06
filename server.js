if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const ServiceBusReader = require('./scripts/service-bus-reader.js');

console.debug(process.env);

const serviceBusConnectionString = process.env.serviceBusConnectionString;
if (!serviceBusConnectionString) {
  console.error(`Environment variable ServiceBusConnectionString must be specified.`);
  return;
}
console.log(`Using Service Bus connection string [${serviceBusConnectionString}]`);

// Redirect requests to the public subdirectory to the root
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res /* , next */) => {
  res.redirect('/');
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        console.log(`Broadcasting data ${data}`);
        client.send(data);
      } catch (e) {
        console.error(e);
      }
    }
  });
};

server.listen(process.env.PORT || '3000', () => {
  console.log('Listening on %d.', server.address().port);
});

const serviceBusReader = new ServiceBusReader(serviceBusConnectionString);

const myMessageHandler = async (message) => {
  // your code here
  console.log(`message.body: ${message.body}`);

  try {

    console.debug(message);

    const payload = {
      data: message.body
    };

    // const payload = {
    //   IotData: message,
    //   MessageDate: date || Date.now().toISOString(),
    //   DeviceId: deviceId,
    // };

    wss.broadcast(JSON.stringify(payload));
  } catch (err) {
    console.error('Error broadcasting: [%s] from [%s].', err, message);
  }

};
const myErrorHandler = async (args) => {
  console.log(
    `Error occurred with ${args.entityPath} within ${args.fullyQualifiedNamespace}: `,
    args.error
  );
};

(async () => {
  await serviceBusReader.startReadMessage(myMessageHandler, myErrorHandler);
})().catch();
