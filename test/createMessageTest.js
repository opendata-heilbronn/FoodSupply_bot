const chai = require('chai');
const messages = require('../messages');
const pizzaVote = {
    question: ' will 🍕Pizza, wer will auch Pizza?',
    answerA: { text: 'Ich will auch', callback: 'iwant' },
    answerB: { text: 'Nein, danke', callback: 'nothanks' },
    iwantList: 'Folgende Personen wollen auch Pizza: ',
    nothanksList: 'Folgende Personen wollen keine Pizza: ',
    summary: 'Insgesamt wollen # Personen Pizza.'
};

describe('messages', () => {
    it('createActiveVoteMessage', () => {
        const result = messages.createActiveVoteMessage({
            votes: {
                '1': { 'name': 'Max', 'vote': 'iwant', 'time': Date.now(), qty : 0.5, type: ['döner','dönerMais', 'sucuk', 'pilze', 'schinken', 'hawaii', 'salami']}
            }
        }, pizzaVote);
        chai.expect(result).to.equal('\nFolgende Personen wollen auch Pizza: Max.\nInsgesamt wollen 1 Personen Pizza.');
    });
    it('createActiveVoteMessage Three Users', () => {
        const result = messages.createActiveVoteMessage({
            votes: {
                '1': { 'name': 'Max', 'vote': 'iwant', 'time': Date.now() },
                '2': { 'name': 'Micha', 'vote': 'iwant', 'time': Date.now() },
                '3': { 'name': 'Lisa', 'vote': 'iwant', 'time': Date.now() }
            }
        }, pizzaVote);
        chai.expect(result).to.equal('\nFolgende Personen wollen auch Pizza: Max, Micha und Lisa.\nInsgesamt wollen 3 Personen Pizza.');
    });
    it('createActiveVoteMessage TwoIwant, TwoNothanks', () => {
        const result = messages.createActiveVoteMessage({
            votes: {
                '1': {'name': 'Max', 'vote': 'iwant', 'time': Date.now()},
                '2': {'name': 'Micha', 'vote': 'iwant', 'time': Date.now()},
                '3': {'name': 'Lisa', 'vote': 'nothanks', 'time': Date.now()},
                '4': {'name': 'Marie', 'vote': 'nothanks', 'time': Date.now()}
            }
        }, pizzaVote);
        chai.expect(result).to.equal('\nFolgende Personen wollen auch Pizza: Max und Micha.\nFolgende Personen wollen keine Pizza: Lisa und Marie.\nInsgesamt wollen 2 Personen Pizza.');
    });
    it('createActiveVoteMessage TwoNothanks', () => {
        const result = messages.createActiveVoteMessage({
            votes: {
                '1': {'name': 'Lisa', 'vote': 'nothanks', 'time': Date.now()},
                '2': {'name': 'Marie', 'vote': 'nothanks', 'time': Date.now()}
            }
        }, pizzaVote);
        chai.expect(result).to.equal('\nFolgende Personen wollen keine Pizza: Lisa und Marie.');
    });
    it('createIwantMessage', () => {
        const result = messages.createIwantMessage({
            votes: {
                '1': { 'name': 'Max', 'vote': 'iwant', 'time': 1 },
                '2': { 'name': 'Micha', 'vote': 'iwant', 'time': 2 },
                '3': { 'name': 'Lisa', 'vote': 'nothanks', 'time': 3 },
                '4': { 'name': 'Marie', 'vote': 'nothanks', 'time': 4 }
            }
        }, pizzaVote);
        chai.expect(result).to.equal('Micha will 🍕Pizza, wer will auch Pizza?');
    })
});
