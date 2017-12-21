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
            })
            voteMessage += voteUsers + '.';
        }
        return voteMessage;
    };

    message += createUserlistForVote('iwant', voteConfig.iwantList);
    message += createUserlistForVote('nothanks', voteConfig.nothanksList);

    const voteArray = Object.values(chatRoom.votes).filter((element) => element.vote === 'iwant');

    if (voteArray.length > 0) {
        const total = voteArray.length;
        message += '\n' + voteConfig.summary.replace('#', total);
    }
    return message;
};

module.exports = { createActiveVoteMessage, createIwantMessage };