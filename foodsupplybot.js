const Telegraf = require('telegraf');
const { Markup } = Telegraf;
const messages = require('./messages');

const questions = {
    food_vote: {
        question: ' hat eine Food-Umfrage gestartet. Für Pizza klicke zuerst auf die Anzahl und danach auf die Sorte. Um eine Ganze zu bestellen reicht ein Klick auf die Sorte.',
        answers: [
            [{ text: '1/4', callback: 'qty_0.25' }, { text: '1/2', callback: 'qty_0.5' }, { text: '3/4', callback: 'qty_0.75' }, { text: '1', callback: 'qty_1' }],
            [{ text: 'Döner', callback: 'pizza_iwant_Döner' }, { text: 'Döner m. Mais', callback: 'pizza_iwant_Döner mit Mais' }],
            [{ text: 'Joni', callback: 'pizza_iwant_Joni (Ananas, Schafskäse)' }, { text: 'Joni Spezial', callback: 'pizza_iwant_Joni Spezial (Ananas, Schafskäse, Döner)' }],
            [{ text: 'Schinken', callback: 'pizza_iwant_Schinken' }, { text: 'Hawaii', callback: 'pizza_iwant_Hawaii' }],
            [{ text: 'Salami', callback: 'pizza_iwant_Salami' }, { text: 'Sucuk', callback: 'pizza_iwant_Sucuk' }],
            [{ text: 'Pepperoni', callback: 'pizza_iwant_Pepperoni' }, { text: 'Margherita', callback: 'pizza_iwant_Margherita' }],
            [{ text: 'Pilze', callback: 'pizza_iwant_Pilze' }, { text: 'Vier Käse', callback: 'pizza_iwant_Vier Käse' }],
            [{ text: 'Seele', callback: 'pizza_iwant_Seele' }, { text: 'Seele mit Falafel', callback: 'pizza_iwant_Seele mit Falafel' }],
            [
                { text: '🍔 Burger', callback: 'go_🍔 Burger' },
                { text: '🌯 Subway', callback: 'go_🌯 Subway' }
            ],
            [
                { text: '🗑 Doch nicht', callback: 'order_reset' },
                { text: '🏁 Bestellung schließen', callback: 'order_close' }
            ]
        ]
    },
    ice_vote: {
        question: ' will 🍦 Eis, wer will noch Eis?',
        answerA: { text: 'Ich will auch', callback: 'iwant' },
        answerB: { text: 'Nein, danke', callback: 'nothanks' }
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
        const vote = 'food_vote';
        const voteDatabase = { 'chatRoomId': ctx.chat.id, 'created': Date.now(), 'title': ctx.chat.title };
        database[ctx.from.id] = voteDatabase;

        if (voteDatabase) {
            console.log(voteDatabase);
            console.log(ctx.chat);

            const keyboard = Markup.inlineKeyboard(createButtonsForVote(vote));
            return ctx.telegram.sendMessage(voteDatabase.chatRoomId, ctx.from.first_name + questions[vote].question, keyboard.extra())
                .then((response) => {
                    const chatRoom = { 'active': true, 'votes': {}, 'starter': ctx.from.id, 'isOrdered': false, 'admins': [], 'type': vote, 'keyboardMessageId': response.message_id };
                    chatRooms[voteDatabase.chatRoomId] = chatRoom;

                    ctx.telegram.getChatAdministrators(voteDatabase.chatRoomId).then((response) => {
                        response.forEach((account) => {
                            chatRoom.admins.push(account.user.id);
                        });
                        console.log('Admins loaded', chatRoom.admins);
                    });

                    return ctx.telegram.sendMessage(voteDatabase.chatRoomId, 'Niemand hat abgestimmt.').then((secondResponse) => {
                        chatRoom.messageId = secondResponse.message_id;
                        return ctx.telegram.sendMessage(ctx.from.id, 'Deine Umfrage wurde in ' + voteDatabase.title + ' gestartet.', { reply_markup: { remove_keyboard: true } });
                    });
                });
        } else {
            return ctx.answerCbQuery();
        }
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
            return ctx.telegram.sendMessage(voteDatabase.chatRoomId, ctx.from.first_name + questions[vote].question, keyboard.extra())
                .then((response) => {
                    const chatRoom = { 'active': true, 'votes': {}, 'isOrdered': false, 'admins': [], 'type': vote, 'keyboardMessageId': response.message_id };
                    chatRooms[voteDatabase.chatRoomId] = chatRoom;

                    ctx.telegram.getChatAdministrators(voteDatabase.chatRoomId).then((response) => {
                        response.forEach((account) => {
                            chatRoom.admins.push(account.user.id);
                        });
                        console.log('Admins loaded', chatRoom.admins);
                    });

                    return ctx.telegram.sendMessage(voteDatabase.chatRoomId, 'Niemand hat abgestimmt.').then((secondResponse) => {
                        chatRoom.messageId = secondResponse.message_id;
                        return ctx.telegram.sendMessage(ctx.from.id, 'Deine Umfrage wurde in ' + voteDatabase.title + ' gestartet.', { reply_markup: { remove_keyboard: true } });
                    });
                });
        } else {
            return ctx.answerCbQuery();
        }
    }

    app.action('ice_vote', (ctx) => {
        handleFoodRequest('ice_vote', ctx);
    });

    function handleVoteAction(ctx, voteAction, param) {
        //console.log('chatRooms: ', chatRooms);
        console.log(voteAction, param);
        const chatRoom = chatRooms[ctx.chat.id];
        let isClosing = false;

        if (chatRoom) {
            // console.log(arguments);
            console.log(chatRoom);
            console.log(ctx.from);

            if (chatRoom.isOrdered && voteAction !== 'go') {
                return;
            }

            let previousResponse = chatRoom.votes[ctx.from.id];
            if (!previousResponse) {
                previousResponse = {
                    name: ctx.from.first_name,
                    time: Date.now(),
                    selection: {},
                    lastQty: 1,
                    go: ''
                };
                chatRoom.votes[ctx.from.id] = previousResponse;
            }

            if (voteAction === 'qty') {
                previousResponse.lastQty = param;
            } else if (voteAction === 'iwant') {
                const selection = previousResponse.selection || {};
                selection[param] = previousResponse.lastQty;
                previousResponse.selection = selection;

                previousResponse.lastQty = 1;
            } else if (voteAction === 'go') {
                previousResponse.go = param;
            } else if (voteAction === 'reset') {
                delete chatRoom.votes[ctx.from.id];
            } else if (voteAction === 'close' && !chatRoom.isOrdered) {
                if (ctx.from.id === chatRoom.starter || chatRoom.admins.indexOf(ctx.from.id) !== -1) {
                    chatRoom.isOrdered = true;
                    isClosing = true;
                }
            }

            let message = '';
            if (Object.keys(chatRoom.votes).length === 0) {
                message = 'Niemand hat abgestimmt.';
            } else {
                const sums = messages.sumSelections(chatRoom.votes);
                const sumOverview = messages.createSumOverview(sums);

                message += messages.createUserOverview(chatRoom.votes);
                message += '\n\n' + sumOverview;

                if (chatRoom.isOrdered) {
                    message += '\n\n' + '🍕 Pizza wurde bereits bestellt!';
                }

                if (isClosing) {
                     ctx.telegram.sendMessage(ctx.from.id,
                         'Bestellung "' + ctx.chat.title + '":\n\n'
                         + sumOverview + '\n\n'
                         + '📞 07131/5943226');

                     sendPayMemos(ctx, chatRoom.votes);
                }

                message += messages.createGoOverview(chatRoom.votes);
            }

            if (chatRoom.lastMessage !== message) {
                chatRoom.lastMessage = message;
                ctx.telegram.editMessageText(ctx.chat.id, chatRoom.messageId, null, message).catch((error) => {
                    console.error(error);
                });
            }

        } else {
            ctx.telegram.sendMessage(ctx.from.id, 'In "' + ctx.chat.title + '" läuft keine aktive Umfrage!');
        }

        ctx.answerCbQuery();
    }

    function sendPayMemos(ctx, votes) {
        Object.keys(votes).map((key) => { return key; }).forEach((key) => {
            const user = votes[key];
            if (user.selection) {
                let amount = 0.0;
                Object.keys(user.selection).forEach((product) => {
                    if (user.selection[product]) {
                        amount += parseFloat(user.selection[product]);
                    }
                });

                if (amount) {
                    ctx.telegram.sendMessage(key, 'Bitte bezahle ' + (amount * 8) + '€ für deine Bestellung in die CoWo Kasse neben dem Getränke Kühlschrank, danke!');
                }
            }
        });
    }

    app.action(/qty_(.*)/, (ctx) => {
        handleVoteAction(ctx, 'qty', ctx.match[1])
    });

    app.action(/pizza_([a-z]+)_?(.*)/, (ctx) => {
        handleVoteAction(ctx, ctx.match[1], ctx.match[2]);
    });

    app.action(/order_(reset|close)/, (ctx) => {
        handleVoteAction(ctx, ctx.match[1]);
    });

    app.action(/go_(.*)/, (ctx) => {
        handleVoteAction(ctx, 'go', ctx.match[1]);
    });

    app.action('nothanks', (ctx) => {
        handleVoteAction(ctx, 'nothanks');
    });
    return app;
};
