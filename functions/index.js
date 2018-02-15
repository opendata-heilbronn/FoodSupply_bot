const functions = require('firebase-functions');
const express = require('express');
const foodsupplybot = require('./foodsupplybot');

const app = express();
app.use(foodsupplybot.webhookCallback('/bot'));
//foodsupplybot.telegram.setWebhook();
functions.https.onRequest(app);