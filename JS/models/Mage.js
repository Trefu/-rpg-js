class Mage extends Player {
    constructor(name) {
        super(name)
        this.maxHp = 18;
        this.hp = 18;
        this.armor = 12;
        this.strength = 10;
        this.dexterity = 15;
        this.intelligence = 16;
        this.weapon = staff;
        this.modifiers = {
            'str': "0",
            'dex': '+2',
            'int': '+3',
        }
    }
    healSpell() {
        let heal = Math.floor(Math.random() * 6 + 1 + Math.floor(Math.random() * 6 + 1) + parseInt(this.modifiers.int))
        this.hp += heal;
        this.hp > this.maxHp ? this.hp = this.maxHp : this.hp;
        let msg = `${this.name} Heals for ${heal}, actual health: ${this.hp}`
        return {
            heal,
            msg
        }
    }

    poisonSpray() {
        let poisonDuration = parseInt(this.modifiers.int);
        let dmg = Math.floor(Math.random() * 4 + 1 + parseInt(this.modifiers.int))

        return {
            poisonDuration,
            dmg
        }
    }

    adjustStats(stat) {
        let newMod;
        switch (stat) {
            case 1:
                newMod = ("-5")
                return newMod;
            case 2:
            case 3:
                newMod = ("-4")
                return newMod;
            case 4:
            case 5:
                newMod = ("-3")
                return newMod;
            case 6:
            case 7:
                newMod = ("-2")
                return newMod;
            case 8:
                newMod = ("-1")
            case 9:
                newMod = ("-1")
                return newMod;
            case 10:
                newMod = ("0")
            case 11:
                newMod = ("0")
                return newMod;
            case 12:
            case 13:
                newMod = ("+1")
                return newMod;
            case 14:
            case 15:
                newMod = ("+2")
                return newMod;
            case 16:
            case 17:
                newMod = ("+3")
                return newMod;
            case 18:
            case 19:
                newMod = ("+4")
                return newMod;
            case 20:
            case 21:
                newMod = ("+5")
                return newMod;
        }

    }
}