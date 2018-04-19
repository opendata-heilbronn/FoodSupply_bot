const Telegraf = require('telegraf');
const { Markup } = Telegraf;
const messages = require('./messages');
const config = require('./config.json');

const questions = {
    subway_vote: {
        question: ' will einen 🌯 Sub, wer will auch einen?',
        answerA: { text: 'Ich will auch', callback: 'iwant' },
        answerB: { text: 'Nein, danke', callback: 'nothanks' }
    },
    pizza_vote: {
        question: ' hat eine Pizza-Umfrage gestartet. Klicke zuerst auf die Anzahl und danach auf die Sorte. Um eine Ganze zu bestellen reicht ein Klick auf die Sorte.',
        answers_qty: [
            { text: '1/4', callback: 'pizza_qty_0.25' },
            { text: '1/2', callback: 'pizza_qty_0.5' },
            { text: '3/4', callback: 'pizza_qty_0.75' },
            { text: '1', callback: 'pizza_qty_1' }
        ],
        answers_pizza: config.pizza,
        answers_finish: [
            { text: 'zurücksetzen', callback: 'pizza_reset' } /*,
            { text: 'Nein, danke', callback: 'pizza_nothanks' }*/
        ],
        iwantList: 'Folgende Personen wollen Pizza: ',
        nothanksList: 'Folgende Personen wollen keine Pizza: ',
        summary: 'Insgesamt wollen # Personen Pizza.'
    },
    ice_vote: {
        question: ' will 🍦 Eis, wer will noch Eis?',
        answerA: { text: 'Ich will auch', callback: 'iwant' },
        answerB: { text: 'Nein, danke', callback: 'nothanks' }
    },
    vote: {
        question: ' will wissen, was es heute geben soll - Pizza oder Subway?',
        answerA: { text: '🍕 Pizza', callback: 'choose_pizza' },
        answerB: { text: '🌯 Subway', callback: 'choose_subway' },
        answerC: { text: 'Nichts davon', callback: 'choose_nothing:' }
    }
};

const database = {};
const chatRooms = {};

module.exports = function (botToken) {
    console.log('Running bot with token: ', botToken);
    const app = new Telegraf(botToken, { username: 'FoodSupply_bot' });
    app.command('start', ({ from, chat, reply }) => {
        console.log('start', from);
        console.log('chat', chat);
        return reply('Welcome!');
    });

    app.command('/datenschutz', (ctx) => {
        ctx.reply('Dieser Bot speichert zu Diagnosezwecken und zur Verbesserung des Services alle empfangenen Daten temporär zwischen. Diese Daten werden vertraulich behandelt und keinesfalls an Dritte weitergegeben.')
    });

    app.command('/food', (ctx) => {
        const vote = { 'chatRoomId': ctx.chat.id, 'created': Date.now(), 'title': ctx.chat.title };
        database[ctx.from.id] = vote;
        const userId = ctx.from.id;
        const keyboard = Markup.inlineKeyboard([[Markup.callbackButton('🍦 Eis', 'ice_vote'), Markup.callbackButton('🍕 Pizza', 'pizza_vote'),
        Markup.callbackButton('🌯 Subway', 'subway_vote')], [Markup.callbackButton('🍕 Pizza vs. 🌯 Subway', 'vote')]]);
        ctx.telegram.sendMessage(userId, 'Wähle eine der folgenden Umfragen!', keyboard.extra());
    });

    function createButtonsForVote(vote) {
        const buttons = [];

        let buttonLine = [];
        questions[vote].answers_qty.forEach((answer) => {
            buttonLine.push(Markup.callbackButton(answer.text, answer.callback));
        });
        buttons.push(buttonLine);

        buttonLine = [];
        questions[vote].answers_pizza.forEach((pizza, i) => {
            buttonLine.push(Markup.callbackButton(pizza, 'pizza_iwant_' + i));
            if (buttonLine.length === 2) {
                buttons.push(buttonLine);
                buttonLine = [];
            }
        });
        if (buttonLine.length) {
            buttons.push(buttonLine);
        }

        buttonLine = [];
        questions[vote].answers_finish.forEach((answer) => {
            buttonLine.push(Markup.callbackButton(answer.text, answer.callback));
        });
        buttons.push(buttonLine);

        return buttons;
    }

    function handleFoodRequest(vote, ctx) {
        const voteDatabase = database[ctx.from.id];
        if (voteDatabase) {
            console.log(voteDatabase);
            const keyboard = Markup.inlineKeyboard(createButtonsForVote(vote));
            return ctx.telegram.sendMessage(voteDatabase.chatRoomId, ctx.from.first_name + questions[vote].question, keyboard.extra())
                .then((response) => {
                    const chatRoom = { 'active': true, 'votes': {}, 'type': vote, 'keyboardMessageId': response.message_id };
                    chatRooms[voteDatabase.chatRoomId] = chatRoom;
                    return ctx.telegram.sendMessage(voteDatabase.chatRoomId, 'Niemand hat abgestimmt.').then((secondResponse) => {
                        chatRoom.messageId = secondResponse.message_id;
                        return ctx.telegram.sendMessage(ctx.from.id, 'Deine Umfrage wurde in ' + voteDatabase.title + ' gestartet.', { reply_markup: { remove_keyboard: true } });
                    });
                });
        } else {
            return ctx.answerCbQuery();
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
                chatRoom.lastMessage = message;
                ctx.telegram.editMessageText(ctx.chat.id, chatRoom.messageId, null, message).catch((error) => {
                    console.log(error);
                });
            }

        }
        else {
            ctx.telegram.sendMessage(ctx.from.id, 'In "' + ctx.chat.title + '" läuft keine aktive Umfrage!');
        }
        ctx.answerCbQuery();
    }
    app.action(/pizza_([a-z]+)_?(.*)/, (ctx) => {
        handleVoteAction(ctx, ctx.match[1], ctx.match[2]);
    });

    app.action(/qty_(.*)/, (ctx) => {
        handleVoteAction(ctx, 'iwant', ctx.match[1])
    });

    app.action('nothanks', (ctx) => {
        handleVoteAction(ctx, 'nothanks');
    });
    return app;
};
