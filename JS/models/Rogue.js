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



}