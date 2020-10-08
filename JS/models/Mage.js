class Mage extends Player {
    constructor(name, hp, armor, weapon) {
        super(name, hp, armor, weapon)
        this.strength = 10;
        this.dexterity = 15;
        this.constitution = 18;
        this.intelligence = 16;
        this.wisdom = 12;
        this.charisma = 8;
        this.modifiers = {
            'str': "0",
            'dex': '+2',
            'const': '+2',
            'int': '+3',
            'wis': '+1',
            'cha': '-1'
        }
    }

}