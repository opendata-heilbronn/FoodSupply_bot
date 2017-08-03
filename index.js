const Telegraf = require('telegraf');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('foodsupply.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function (error) {
    if (error === null) {
        db.serialize(function () {
            db.run("CREATE TABLE IF NOT EXISTS chats (chatId TEXT, created DATETIME)");
            db.run("CREATE TABLE IF NOT EXISTS orders (order_id INTEGER PRIMARY KEY AUTOINCREMENT, chatId TEXT, created DATETIME)");
            db.run("CREATE TABLE IF NOT EXISTS user_stats (user_order_id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "userId TEXT, ORDER_ID INTEGER, " +
                "order_time DATETIME, order_type VARCHAR(32), amount NUMERIC)");
        });
    }
});


let chatRoomId = null;

console.log("Running bot with token: ", process.env.BOT_TOKEN);
const app = new Telegraf(process.env.BOT_TOKEN, {username: "FoodSupply_bot"});
app.command('start', ({from, chat, reply}) => {
    console.log('start', from);
    console.log('chat', chat);
    chatRoomId = chat.id;
    return reply('Welcome!');
});


app.hears(/piz?za/i, (ctx) => {
    console.log("ctx: ", ctx);
    console.log('from', ctx.from);
    console.log('chat', ctx.chat);
    ctx.reply('Will @' + ctx.from.username + ' Pizza?')
});

setInterval(function () {
    if (chatRoomId !== null) {
        app.telegram.sendMessage(chatRoomId, "Hat jemand Hunger???");
    }
}, 60000);
app.on('sticker', (ctx) => ctx.reply('👍'));
app.startPolling();