const Telegraf = require('telegraf');
const { Markup } = Telegraf;
/*const sqlite3 = require('sqlite3').verbose();
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
});*/


let chatRoomId = null;
const foodChatRoomId = {};
const questions = {
    subway_vote: {
        question: ' will einen 🌯 Sub, wer will auch einen?',
        answerA: { text: 'Ich will auch', callback: 'iwant' },
        answerB: { text: 'Nein, danke', callback: 'nothanks' }
    },
    pizza_vote: {
        question: ' will 🍕Pizza, wer will auch Pizza?',
        answerA: { text: 'Ich will auch', callback: 'iwant' },
        answerB: { text: 'Nein, danke', callback: 'nothanks' }
    },
    ice_vote: {
        qustion: ' will 🍦Eis, wer will noch Eis?',
        answerA: { text: 'Ich will auch', callback: 'iwant' },
        answerB: { text: 'Nein, danke', callback: 'nothanks' }
    },
    vote: {
        question: ' will wissen, was es heute geben soll - Pizza oder Subway?',
        answerA: { text: '🍕Pizza', callback: 'choose_pizza' },
        answerB: { text: '🌯 Subway', callback: 'choose_subway' },
        answerC: { text: 'Nichts davon', callback: 'choose_nothing:' }
    }
};

console.log("Running bot with token: ", process.env.BOT_TOKEN);
const app = new Telegraf(process.env.BOT_TOKEN, { username: "FoodSupply_bot" });
app.command('start', ({ from, chat, reply }) => {
    console.log('start', from);
    console.log('chat', chat);
    chatRoomId = chat.id;
    return reply('Welcome!');
});

app.command('/datenschutz', (ctx, chat) => {
    chatRoomId = chat.id;
    ctx.reply('Dieser Bot speichert zu Diagnosezwecken und zur Verbesserung des Services alle empfangenen Daten temporär zwischen.Diese Daten werden vertraulich behandelt und keinesfalls an Dritte weitergegeben.')
});

app.command('/food', (ctx, chat) => {
    chatRoomId = chat.id;
    const userId = ctx.from.id;
    foodChatRoomId[ctx.from.id] = ctx.chat;
    console.log(ctx.chat);

    const keyboard = Markup.inlineKeyboard([[Markup.callbackButton('🍦Eis', 'ice_vote'), Markup.callbackButton('🍕Pizza', 'pizza_vote'),
    Markup.callbackButton('🌯 Subway', 'subway_vote')], [Markup.callbackButton('🍕Pizza vs. 🌯 Subway', 'vote')]]);
    ctx.telegram.sendMessage(userId, 'Wähle eine der folgenden Umfragen!', keyboard.extra());
});

function handleFoodRequest(vote, ctx) {
    const chat = foodChatRoomId[ctx.from.id];
    if (chat) {
        console.log(chat);
        const buttons = [[Markup.callbackButton(questions[vote].answerA.text, questions[vote].answerA.callback),
        Markup.callbackButton(questions[vote].answerB.text, questions[vote].answerB.callback)]];
        if(questions[vote].answerC){
            buttons.push([Markup.callbackButton(questions[vote].answerC.text, questions[vote].answerC.callback)]);
        }
        const keyboard = Markup.inlineKeyboard(buttons);
        ctx.telegram.sendMessage(chat.id, '@' + ctx.from.username + questions[vote].question, keyboard.extra());
        ctx.telegram.sendMessage(ctx.from.id, 'Deine Umfrage wurde in ' + chat.title + ' gestartet.', { reply_markup: { remove_keyboard: true } });
        delete foodChatRoomId[ctx.from.id];
    }
};

app.action('pizza_vote', (ctx) => {
    handleFoodRequest('pizza_vote', ctx);
});

app.action('ice_vote', (ctx) => {
    handleFoodRequest('ice_vote', ctx);
});

app.action('subway_vote', (ctx) => {
    handleFoodRequest('subway_vote', ctx);
});

app.action('vote', (ctx) => {
    handleFoodRequest('vote', ctx);
});

app.on('callback_query', (ctx) => {
    console.log(ctx.callbackQuery);
});

app.startPolling();