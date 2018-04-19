const config = require('./config.json');

function createIwantMessage(chatRoom, voteConfig) {
    const voteArray = Object.keys(chatRoom.votes).map((key) => { return chatRoom.votes[key]; }).filter((element) => element.vote === 'iwant').sort((a, b) => {
        return b.time - a.time;
    });
    if (voteArray.length > 0) {
        const vote = voteArray[0];
        return vote.name + voteConfig.question;
    }
    else {
        return '';
    }
}

function createActiveVoteMessage(chatRoom, voteConfig) {
    let message = '';

    function createUserlistForVote(vote, listMessage) {
        let voteMessage = '';
        const voteArray = Object.keys(chatRoom.votes).map((key) => { return chatRoom.votes[key]; }).filter((element) => element.vote === vote);
        if (voteArray.length > 0) {
            let voteUsers = '\n' + listMessage;
            voteArray.forEach((element, index, array) => {
                if (index === 0) {
                    voteUsers += element.name;
                }
                else if (index === array.length - 1) {
                    voteUsers += ' und ' + element.name;
                }
                else {
                    voteUsers += ', ' + element.name;
                }
            });
            voteMessage += voteUsers + '.';
        }
        return voteMessage;
    }

    message += createUserlistForVote('iwant', voteConfig.iwantList);
    message += createUserlistForVote('nothanks', voteConfig.nothanksList);

    const voteArray = Object.keys(chatRoom.votes).map((key) => { return chatRoom.votes[key]; }).filter((element) => element.vote === 'iwant');

    if (voteArray.length > 0) {
        const total = voteArray.length;
        message += '\n' + voteConfig.summary.replace('#', total);
    }
    return message;
}

function sumSelections(votes) {
    const result = {};
    Object.keys(votes).map((key) => { return votes[key]; }).forEach((user) => {
        if (user.selection) {
            Object.keys(user.selection).forEach((product) => {
                let amount = result[product];
                if (amount) {
                    amount += user.selection[product];
                } else {
                    amount = user.selection[product];
                }
                result[product] = amount;
            });
        }
    });
    return result;
}

function createUserOverview(votes) {
    let result = "";
    const amountMap = {
        "0.25": "¼",
        "0.5": "½",
        "0.75": "¾",
        "1": "1"
    };
    const voteArray = Object.keys(votes).map((key) => { return votes[key]; }).filter((user) => {
        return user.selection && Object.keys(user.selection).length > 0;
    });

    voteArray.forEach((user, userIndex) => {
        const userSelection = Object.keys(user.selection);
        if (userSelection.length > 0) {
            let userProducts = user.name + " möchte ";
            userSelection.forEach((product, productIndex) => {
                if (productIndex > 0) {
                    if (productIndex === userSelection.length - 1) {
                        userProducts += " & ";
                    } else {
                        userProducts += ", ";
                    }
                }
                let amount = user.selection[product];
                let amountText = amountMap[String(amount)];
                if (amountText) {
                    userProducts += amountText + " " + config.pizza[product];
                } else {
                    userProducts += amount + " " + config.pizza[product];
                }
            });
            if (userIndex > 0) {
                result += "\n";
            }
            result += userProducts;
        }
    });
    return result;
}

function createSumOverview(sums) {
    const sumKeys = Object.keys(sums);
    if (sumKeys.length > 0) {
        let total = 0;
        let result = "Zu bestellen wären: ";
        sumKeys.forEach((product) => {
            result += '\n';
            let amount = sums[product];
            total += amount;
            result += amount + " " + config.pizza[product];
        });
        if (total > 0) {
            result += "\nInsgesamt also min. " + total + " Pizzen";
        }
        return result;
    } else {
        return null;
    }

}
module.exports = { createActiveVoteMessage, createIwantMessage, sumSelections, createSumOverview, createUserOverview };
