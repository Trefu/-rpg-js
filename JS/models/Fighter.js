class Fighter extends Player {
    constructor(name) {
        super(name)
        this.hp = 12;
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
        var buffedArmor = boolean;
        buffedArmor ? (this.armor += 2, console.log("activado")) : (this.armor = 17, console.log("desactivado", this.armor));

    }


}