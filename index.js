const Telegraf = require('telegraf');

let chatRoomId = null;

console.log("Running bot with token: ", process.env.BOT_TOKEN);
const app = new Telegraf(process.env.BOT_TOKEN, {username: "FoodSupply_bot"});
app.command('start', ({from, chat, reply}) => {
    console.log('start', from);
    console.log('chat', chat);
    chatRoomId = chat.id;
    return reply('Welcome!');
});

app.hears('hi', (ctx) => {
    console.log("ctx: ", ctx);
    ctx.reply('Hey there!')
});

setInterval(function () {
    if (chatRoomId !== null) {
        app.telegram.sendMessage(chatRoomId, "Hat jemand Hunger???");
    }
}, 60000);
app.on('sticker', (ctx) => ctx.reply('👍'));
app.startPolling();