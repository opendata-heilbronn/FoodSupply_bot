function createIwantMessage(chatRoom, voteConfig) {
    const voteArray = Object.values(chatRoom.votes).filter((element) => element.vote === 'iwant').sort((a, b) => {
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
        const voteArray = Object.values(chatRoom.votes).filter((element) => element.vote === vote);
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

    const voteArray = Object.values(chatRoom.votes).filter((element) => element.vote === 'iwant');

    if (voteArray.length > 0) {
        const total = voteArray.length;
        message += '\n' + voteConfig.summary.replace('#', total);
    }
    return message;
}

function sumSelections(votes) {
    const result = {};
    Object.values(votes).forEach((user) => {
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
        "0.25": "viertel",
        "0.5": "halbe",
        "0.75": "dreiviertel",
        "1": "ganze"
    };
    const voteArray = Object.values(votes).filter((user) => {
        return user.selection && Object.keys(user.selection).length > 0;
    });

    voteArray.forEach((user, userIndex) => {
        const userSelection = Object.keys(user.selection);
        if (userSelection.length > 0) {
            let userProducts = user.name + " möchte ";
            userSelection.forEach((product, productIndex) => {
                if (productIndex > 0) {
                    if (productIndex === userSelection.length - 1) {
                        userProducts += " und ";
                    } else {
                        userProducts += ", ";
                    }
                }
                let amount = user.selection[product];
                let amountText = amountMap["" + amount];
                if (amountText) {
                    userProducts += amountText + " " + product;
                } else {
                    userProducts += amount + " " + product;
                }
            });
            if (userIndex > 0) {
                if (userIndex === voteArray.length - 1) {
                    result += " und ";
                } else {
                    result += ", ";
                }
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
        sumKeys.forEach((product, index) => {
            if (index > 0) {
                if (index === sumKeys.length - 1) {
                    result += " und ";
                } else {
                    result += ", ";
                }
            }
            let amount = sums[product];
            total += amount;
            result += amount + " " + product;
        });
        if (total > 0) {
            result += " - Insgesamt also min. " + total + " Pizzen";
        }
        return result;
    } else {
        return null;
    }

}
module.exports = {createActiveVoteMessage, createIwantMessage, sumSelections, createSumOverview, createUserOverview};