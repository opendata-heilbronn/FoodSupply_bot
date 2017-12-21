const Telegraf = require('telegraf');
const { Markup } = Telegraf;
/*const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('foodsupply.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function (error) {
    if (error === null) {
        db.serialize(function () {
            db.run('CREATE TABLE IF NOT EXISTS chats (chatId TEXT, created DATETIME)');
            db.run('CREATE TABLE IF NOT EXISTS orders (order_id INTEGER PRIMARY KEY AUTOINCREMENT, chatId TEXT, created DATETIME)');
            db.run('CREATE TABLE IF NOT EXISTS user_stats (user_order_id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
                'userId TEXT, ORDER_ID INTEGER, ' +
                'order_time DATETIME, order_type VARCHAR(32), amount NUMERIC)');
        });
    }
});*/


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

const database = {};
const chatRooms = {};

console.log('Running bot with token: ', process.env.BOT_TOKEN);
const app = new Telegraf(process.env.BOT_TOKEN, { username: 'FoodSupply_bot' });
app.command('start', ({ from, chat, reply }) => {
    console.log('start', from);
    console.log('chat', chat);
    return reply('Welcome!');
});

app.command('/datenschutz', (ctx) => {
    ctx.reply('Dieser Bot speichert zu Diagnosezwecken und zur Verbesserung des Services alle empfangenen Daten temporär zwischen.Diese Daten werden vertraulich behandelt und keinesfalls an Dritte weitergegeben.')
});

app.command('/food', (ctx) => {
    const vote = { 'chatRoomId': ctx.chat.id, 'created': Date.now(), 'title': ctx.chat.title };
    database[ctx.from.id] = vote;
    const userId = ctx.from.id;
    console.log(ctx);
    console.log(ctx.chat);

    const keyboard = Markup.inlineKeyboard([[Markup.callbackButton('🍦Eis', 'ice_vote'), Markup.callbackButton('🍕Pizza', 'pizza_vote'),
    Markup.callbackButton('🌯 Subway', 'subway_vote')], [Markup.callbackButton('🍕Pizza vs. 🌯 Subway', 'vote')]]);
    ctx.telegram.sendMessage(userId, 'Wähle eine der folgenden Umfragen!', keyboard.extra());
});

function createButtonsForVote(vote) {
    const buttons = [[Markup.callbackButton(questions[vote].answerA.text, questions[vote].answerA.callback),
    Markup.callbackButton(questions[vote].answerB.text, questions[vote].answerB.callback)]];
    if (questions[vote].answerC) {
        buttons.push([Markup.callbackButton(questions[vote].answerC.text, questions[vote].answerC.callback)]);
    }
    return buttons;
}

function handleFoodRequest(vote, ctx) {
    const voteDatabase = database[ctx.from.id];
    if (voteDatabase) {
        console.log(voteDatabase);
        const keyboard = Markup.inlineKeyboard(createButtonsForVote(vote));
        ctx.telegram.sendMessage(voteDatabase.chatRoomId, '@' + ctx.from.username + questions[vote].question, keyboard.extra())
            .then((response) => {
                console.log(response);
                const chatRoom = { 'active': true, 'votes': {}, 'type': vote, 'messageId': response.message_id };
                const userResponse = { 'name': ctx.from.first_name, 'vote': 'iwant', 'time': Date.now() };
                chatRoom.votes[ctx.from.id] = userResponse;
                chatRooms[voteDatabase.chatRoomId] = chatRoom;
            });
        ctx.telegram.sendMessage(ctx.from.id, 'Deine Umfrage wurde in ' + voteDatabase.title + ' gestartet.', { reply_markup: { remove_keyboard: true } });
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

app.action('iwant', (ctx) => {
    console.log('chatRooms: ', chatRooms);
    const chatRoom = chatRooms[ctx.chat.id];
    if (chatRoom) {
        const previousResponse = chatRoom.votes[ctx.from.id];
        if (previousResponse) {
            ctx.telegram.sendMessage(ctx.from.id, 'Vielen Dank, Du hast schon abgestimmt.').catch((error) => {
                console.log(error);
            })
        }
        else {
            const response = { 'name': ctx.from.first_name, 'vote': 'iwant', 'time': Date.now() };
            chatRoom.votes[ctx.from.id] = response;
            const vote = chatRoom.type;
            const keyboard = Markup.inlineKeyboard(createButtonsForVote(vote));
            let message = '@' + ctx.from.username + questions[vote].question;
            let iwantUsers = '\nFolgende Personen wollen auch: ';
            Object.values(chatRoom.votes).filter((element) => element.vote === 'iwant').forEach((element, index, array) => {
                if (index === 0) {
                    iwantUsers += element.name;
                }
                else if (index === array.length - 1) {
                    iwantUsers += ' und ' + element.name;
                }
                else {
                    iwantUsers += ', ' + element.name;
                }
            })
            message += iwantUsers;
            ctx.telegram.editMessageText(ctx.chat.id, chatRoom.messageId, null, message, keyboard.extra()).catch((error) => {
                console.log(error);
            });
        }

    }
    else {
        ctx.telegram.sendMessage(ctx.from.id, 'In "' + ctx.chat.title + '" wurde bis jetzt noch keine Umfrage gestartet!');
    };
});
/*
app.action('nothanks', (ctx) => {
    handleVoteRequest('vote', ctx);
});

app.action('choose_pizza', (ctx) => {
    handleFoodRequest('vote', ctx);
});

app.action('choose_subway', (ctx) => {
    handleFoodRequest('vote', ctx);
});

app.action('choose_nothing', (ctx) => {
    handleFoodRequest('vote', ctx);
});

app.on('callback_query', (ctx) => {
    console.log(ctx.callbackQuery);
});*/

app.startPolling();