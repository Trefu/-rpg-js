class Rogue extends Player {
    constructor(name) {
        super(name)
        this.maxHp = 16;
        this.hp = 16;
        this.armor = 14;
        this.strength = 11;
        this.dexterity = 16;
        this.intelligence = 13;
        this.weapon = dagger;
        this.modifiers = {
            'str': "0",
            'dex': '+3',
            'int': '+1',
        }

    }
    getAttackValues() {
        let dmg = Math.floor(Math.random() * this.weapon.damage + 1);
        let attackRoll = Math.floor(Math.random() * 20 + 1 + parseInt(this.modifiers.str));
        if (attackRoll >= 18) {
            attackRoll = 20;
        }
        let attackValues = {
            dmg,
            attackRoll,
        }
        return attackValues
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