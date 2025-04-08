#!/usr/bin/env node

function initializeApp() {
  const express = require('express');
  const app = express();

  // Set up the static routes
  app.use('/collection-indexes', express.static('mock-data/collection-indexes'));
  app.use('/collection-bundles', express.static('mock-data/collection-bundles'));

  return app;
}

async function runMockRemoteHost() {
  // Create the express app
  const app = initializeApp();

  const port = process.env.PORT ?? 80;
  const server = app.listen(port, function () {
    const host = server.address().address;
    const port = server.address().port;

    console.info(`Listening at http://${host}:${port}`);
    console.info('Mock Remote Host start up complete');
  });

  // Listen for a ctrl-c
  process.on('SIGINT', () => {
    console.info('SIGINT received, stopping HTTP server');
    server.close();
  });

  // Docker terminates a container with a SIGTERM
  process.on('SIGTERM', () => {
    console.info('SIGTERM received, stopping HTTP server');
    server.close();
  });

  // Wait for the server to close
  const events = require('events');
  await events.once(server, 'close');

  console.info('Mock Remote Host terminating');
}

runMockRemoteHost()
  .then(() => {
    console.log('runMockRemoteHost() - Terminating normally');
    process.exit();
  })
  .catch((err) => {
    console.log('runMockRemoteHost() - Error: ' + err);
    process.exit(1);
  });
