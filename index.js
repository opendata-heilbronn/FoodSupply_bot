const express = require('express');
const foodsupplybot = require('./foodsupplybot')(process.env.BOT_TOKEN);

const app = express();
app.use(foodsupplybot.webhookCallback('/bot'));
foodsupplybot.telegram.setWebhook('https://bots.grundid.de/node/bot');
app.listen(5000, () => {
    console.log('Bot activated');
});