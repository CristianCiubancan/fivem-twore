// Main client script that uses the event handler
console.log('example1 resource initialized');

// Import the safe message sender (if using a module system)
// If not using modules, this function should be available from the previous script
// const { safeSendNUIMessage } = require('./eventHandler.js');

// Function to safely send messages (simplified version if not using the full handler)
function safeSendNUIMessage(data: any) {
  SendNUIMessage(data);
  console.log('Sent message:', data.action);
}

// Send first message with a delay to let UI initialize
safeSendNUIMessage({
  action: 'ui',
  data: {
    message: 'First message from client',
  },
});

// Send second message after another delay
setTimeout(() => {
  safeSendNUIMessage({
    action: 'ui',
    data: {
      message: 'Second message from client',
    },
  });
}, 2000);

// Register a command to send a test message on demand
RegisterCommand(
  'testnui',
  () => {
    safeSendNUIMessage({
      action: 'ui',
      data: {
        message: 'Test message triggered by command',
      },
    });
  },
  false
);
