class Fighter extends Player {
    constructor(name) {
        super(name)
        this.hp = 100;
        this.armor = 16;
        this.strength = 16;
        this.dexterity = 14;
        this.constitution = 15;
        this.intelligence = 9;
        this.wisdom = 13;
        this.charisma = 11;
        this.weapon = greatsword;
        this.modifiers = {
            'str': "+3",
            'dex': '+2',
            'const': '+2',
            'int': '-2',
            'wis': '-1',
            'cha': '0'
        }

    }
    block(boolean) {
        let buffedArmor = boolean;
        buffedArmor ? this.armor += 3 : this.armor -= 3;
    }
    agresive(boolean) {
        let agresiveStance = boolean;
        agresiveStance ? (this.strength += 4, console.log("agresive activado")) :
            (this.strength -= 4, console.log("str " + this.strength));
        this.modifiers.str = this.adjustStats(this.strength)
    }
    reckless(boolean) {
        let recklessStance = boolean;
        recklessStance ? (this.weapon.damage += 6, this.armor -= 2, console.log(weapon.damage + "reckless activado " + this.armor)) :
            (this.weapon.damage -= 3, this.armor += 2, console.log("re desact " + this.weapon.damage + this.armor));
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