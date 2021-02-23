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

    addMember(member) {
        this.members.push(member);
        this.size += 1;
        if (this.members.length >= this.maxSize) {
            this.notReadyMembers = this.members;
            return true;
        } else
            return false;
    }

    removeMember(member) {
        const index = this.members.indexOf(member);
        this.size -= 1;
        if (index >= 0) {
            this.members.splice(index, 1);
            return true;
        } else
            return false;
    }

    queue() {
        this.state = states[0];
        return this;
    }

    start() {
        this.state = states[1];
        return this;
    }

    ready() {
        this.state = states[2];
    }

    done() {
        this.state = states[3];
    }

}

module.exports = Game;
module.exports.states = states;
