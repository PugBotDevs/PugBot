const states = ['QUEUE', 'READY', 'PROGRESS', 'DONE'];
class Game {

    constructor(name, size, opts, channel, id) {
        this.name = name;
        this.maxSize = size;
        this.size = 0;
        this.opts = opts;
        this.channel = channel;
        this.state = states[0];
        this.id = id;
        this.members = [];
        this.notReadyMembers = [];
        this.teams = {
            alpha: [],
            beta: [],
        };
        return this;
    }
    /**
     * @param  {String} Member ID
     * @returns {Boolean} True if game is full and false if game is not full
     */
    addMember(member) {
        this.members.push(member);
        this.size += 1;
        if (this.members.length >= this.maxSize) {
            this.notReadyMembers = this.members;
            return true;
        } else
            return false;
    }
    /**
     * @param  {String} Member ID
     * @returns {Boolean} True if member is found
     */
    removeMember(member) {
        const index = this.members.indexOf(member);
        this.size -= 1;
        if (index >= 0) {
            this.members.splice(index, 1);
            return true;
        } else
            return false;
    }
    /**
     * Changes the state of the game to queue state
     */
    queue() {
        this.state = states[0];
        return this;
    }
    /**
     * Changes the state of the game to ready wait
     */
    start() {
        this.state = states[1];
        return this;
    }
    /**
     * Changes the state of the game to progress (Match is ongoing)
     */
    ready() {
        this.state = states[2];
    }
    /**
     * Changes the state of match to done
     */
    done() {
        this.state = states[3];
    }

}

module.exports = Game;
module.exports.states = states;
