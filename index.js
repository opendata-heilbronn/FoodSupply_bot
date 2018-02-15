const functions = require('firebase-functions');
const express = require('express');
const foodsupplybot = require('./foodsupplybot')(functions.config().bot.token);

const app = express();
app.use(foodsupplybot.webhookCallback('/bot'));
//foodsupplybot.telegram.setWebhook('https://us-central1-foodsupplybot.cloudfunctions.net/bot');
exports.bot = functions.https.onRequest(app);