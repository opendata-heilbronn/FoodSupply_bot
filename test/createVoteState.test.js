const assert = require('chai').assert;
const messages = require("../messages");

const votes = {
    "user1": {
        name: "Leandro",
        selection: {
            0: 0.25,
            2: 0.5,
            7: 0.25
        }
    },
    "user2": {
        name: "Joni",
        selection: {
            2: 0.25,
            7: 0.25
        }
    },
    "user3": {
        name: "Vale",
        selection: {
            2: 0.25,
            3: 1,
            7: 0.25
        }
    },
    "user4": {
        name: "Adrian"
    },
    "user5": {
        name: "Adrian",
        selection: {}
    }
};



describe("createVoteStatus", () => {
    it("should create status message", () => {
        const result = messages.createUserOverview(votes);
        assert.equal(result, "Leandro möchte ¼ Döner, ½ Salami & ¼ Pilze\n" +
            "Joni möchte ¼ Salami & ¼ Pilze\n" +
            "Vale möchte ¼ Salami, 1 Schinken & ¼ Pilze");
    });
    it("should sum selections", () => {
        const result = messages.sumSelections(votes);
        assert.equal(result[7], 0.75);
        assert.equal(result[2], 1);
        assert.equal(result[0], 0.25);
        assert.equal(result[3], 1);

    });
    it("should create sum overiew", () => {
        const sums = messages.sumSelections(votes);
        const result = messages.createSumOverview(sums);

        assert.equal(result, "Zu bestellen wären: \n0.25 Döner\n1 Salami\n1 Schinken\n0.75 Pilze\nInsgesamt also min. 3 Pizzen");

    });
});
