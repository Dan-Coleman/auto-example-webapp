const { ServiceBusClient } = require("@azure/service-bus");
const { Receiver } = require("rhea-promise");

const queueName = "sam-hot-path-alerts";

class ServiceBusReader {
  constructor(serviceBusConnectionString) {
    this.serviceBusConnectionString = serviceBusConnectionString;
  }

  async startReadMessage(myMessageHandler, myErrorHandler) {
    try {

      const serviceBusClient = new ServiceBusClient(this.serviceBusConnectionString);

      this.serviceBusReceiver = serviceBusClient.createReceiver(queueName);
      
      console.log('Successfully created the ServiceBusReceiver.');

      this.serviceBusReceiver.subscribe({
        processMessage: myMessageHandler,
        processError: myErrorHandler,
      });

    } catch (ex) {
      console.error(ex.message || ex);
    }
  }

  // Close connection to Event Hub.
  async stopReadMessage() {
    this.serviceBusReceiver.close();
  }
}

module.exports = ServiceBusReader;
