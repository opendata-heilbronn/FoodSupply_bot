const express = require('express');
const config = require('./config.json');
const foodsupplybot = require('./foodsupplybot')(config.botToken);

const app = express();
app.use(foodsupplybot.webhookCallback('/node/bot'));
foodsupplybot.telegram.setWebhook(config.webHookURL);
if (!config.webHookURL) {
    foodsupplybot.startPolling();
}
app.listen(5000, () => {
    console.log('Bot activated');
});
