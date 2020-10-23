class Mage extends Player {
    constructor(name) {
        super(name)
        this.hp = 18;
        this.armor = 12;
        this.strength = 10;
        this.dexterity = 15;
        this.intelligence = 16;
        this.weapon = staff;
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