class Rogue extends Player {
    constructor(name, hp, armor, weapon) {
        super(name, hp, armor, weapon)
        this.hp = 10;
        this.armor = 14;
        this.strength = 11;
        this.dexterity = 16;
        this.constitution = 14;
        this.intelligence = 13;
        this.wisdom = 9;
        this.charisma = 15;
        this.weapon = dagger;
        this.modifiers = {
            'str': "0",
            'dex': '+3',
            'const': '+2',
            'int': '+1',
            'wis': '-1',
            'cha': '+2'
        }

    }
    getAttackValues() {
        let dmg = Math.floor(Math.random() * this.weapon.damage + 1);
        let attackRoll = Math.floor(Math.random() * 20 + 1 + parseInt(this.modifiers.str));
        if (attackRoll > 18) {
            attackRoll = 20;
        }
        let attackValues = {
            dmg,
            attackRoll,
        }
        return attackValues
    }



}