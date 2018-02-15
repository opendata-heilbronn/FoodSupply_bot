const Telegraf = require('telegraf');
const { Markup } = Telegraf;
const messages = require('./messages');
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
        question: ' hat eine Pizza-Umfrage gestartet. Klicke zuerst auf die Anzahl und danach auf die Sorte. Um eine ganze zu bestellen reicht ein Klick auf die Sorte.',
        answers: [
            [{ text: '1/4', callback: 'pizza_qty_0.25' }, { text: '1/2', callback: 'pizza_qty_0.5' }, { text: '3/4', callback: 'pizza_qty_0.75' }, { text: '1', callback: 'pizza_qty_1' }],
            [{ text: 'Döner', callback: 'pizza_iwant_Döner' }, { text: 'Döner m. Mais', callback: 'pizza_iwant_Döner mit Mais' }],
            [{ text: 'Salami', callback: 'pizza_iwant_Salami' }, { text: 'Schinken', callback: 'pizza_iwant_Schinken' }],
            [{ text: 'Joni', callback: 'pizza_iwant_Joni' }, { text: 'Hawaii', callback: 'pizza_iwant_Hawaii' }],
            [{ text: 'Pilze', callback: 'pizza_iwant_Pilze' }, { text: 'Sucuk', callback: 'pizza_iwant_Sucuk' }],
            [{ text: 'Pepperoni', callback: 'pizza_iwant_Pepperoni' }, { text: 'Margherita', callback: 'pizza_iwant_Margherita' }],
            [{ text: 'zurücksetzen', callback: 'pizza_reset' }, { text: 'Nein, danke', callback: 'pizza_nothanks' }]
        ],
        iwantList: 'Folgende Personen wollen Pizza: ',
        nothanksList: 'Folgende Personen wollen keine Pizza: ',
        summary: 'Insgesamt wollen # Personen Pizza.'
    },
    ice_vote: {
        question: ' will 🍦Eis, wer will noch Eis?',
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

const userQuestions = {

}

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
    const keyboard = Markup.inlineKeyboard([[Markup.callbackButton('🍦Eis', 'ice_vote'), Markup.callbackButton('🍕Pizza', 'pizza_vote'),
    Markup.callbackButton('🌯 Subway', 'subway_vote')], [Markup.callbackButton('🍕Pizza vs. 🌯 Subway', 'vote')]]);
    ctx.telegram.sendMessage(userId, 'Wähle eine der folgenden Umfragen!', keyboard.extra());
});

function createButtonsForVote(vote) {
    const buttons = [];
    const answers = questions[vote].answers;
    answers.forEach((answerLine) => {
        const buttonLine = [];
        answerLine.forEach((answer) => {
            buttonLine.push(Markup.callbackButton(answer.text, answer.callback));
        });
        buttons.push(buttonLine);
    });
    return buttons;
}

function handleFoodRequest(vote, ctx) {
    const voteDatabase = database[ctx.from.id];
    if (voteDatabase) {
        console.log(voteDatabase);
        const keyboard = Markup.inlineKeyboard(createButtonsForVote(vote));
        ctx.telegram.sendMessage(voteDatabase.chatRoomId, ctx.from.first_name + questions[vote].question, keyboard.extra())
            .then((response) => {
                const chatRoom = { 'active': true, 'votes': {}, 'type': vote, 'keyboardMessageId': response.message_id };
                chatRooms[voteDatabase.chatRoomId] = chatRoom;
                ctx.telegram.sendMessage(voteDatabase.chatRoomId, 'Niemand hat abgestimmt.').then((secondResponse) => {
                    chatRoom.messageId = secondResponse.message_id;
                });
            });
        ctx.telegram.sendMessage(ctx.from.id, 'Deine Umfrage wurde in ' + voteDatabase.title + ' gestartet.', { reply_markup: { remove_keyboard: true } });
    }
}

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

function handleVoteAction(ctx, voteAction, param) {
    //console.log('chatRooms: ', chatRooms);
    console.log(voteAction, param);
    const chatRoom = chatRooms[ctx.chat.id];
    if (chatRoom) {
        let previousResponse = chatRoom.votes[ctx.from.id];
        if (!previousResponse) {
            previousResponse = { 'name': ctx.from.first_name, 'time': Date.now() };
            chatRoom.votes[ctx.from.id] = previousResponse;

        }
        if (voteAction === 'qty') {
            previousResponse.lastQty = param;
        } else if (voteAction === 'iwant') {
            const qty = previousResponse.lastQty ? Number(previousResponse.lastQty) : 1;
            const selection = previousResponse.selection || {};
            selection[param] = qty;
            previousResponse.selection = selection;
            delete previousResponse.lastQty;
        } else if (voteAction === 'reset') {
            delete chatRoom.votes[ctx.from.id];
        }

        const vote = chatRoom.type;
        let message = '';
        const sums = messages.sumSelections(chatRoom.votes);
        const sumOverview = messages.createSumOverview(sums);
        if (sumOverview) {
            message += messages.createUserOverview(chatRoom.votes);
            message += '\n' + sumOverview;
        } else {
            message = 'Niemand hat abgestimmt.';
        }

        if (chatRoom.lastMessage !== message) {
            ctx.telegram.editMessageText(ctx.chat.id, chatRoom.messageId, null, message).then(() => {
                chatRoom.lastMessage = message;
            }).catch((error) => {
                console.log(error);
            });
        }

    }
    else {
        ctx.telegram.sendMessage(ctx.from.id, 'In "' + ctx.chat.title + '" läuft keine aktive Umfrage!');
    };
};
app.action(/pizza_([a-z]+)_?(.*)/, (ctx) => {
    handleVoteAction(ctx, ctx.match[1], ctx.match[2]);
});

app.action(/qty_(.*)/, (ctx) => {
    handleVoteAction(ctx, 'iwant', ctx.match[1])
});

app.action('nothanks', (ctx) => {
    handleVoteAction(ctx, 'nothanks');
});

/*
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