class Fighter extends Player {
    constructor(name, hp, armor, weapon) {
        super(name, hp, armor, weapon)
        this.strength = 16;
        this.dexterity = 14;
        this.constitution = 15;
        this.intelligence = 9;
        this.wisdom = 13;
        this.charisma = 11;
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