class Enemy {
    constructor(name, hp, armor, strength, dexterity, intelligence, weapon) {
        this.name = name;
        this.hp = hp;
        this.armor = armor;
        this.strength = strength;
        this.dexterity = dexterity;
        this.intelligence = intelligence;
        this.weapon = weapon;
        this.modifiers = {
            'str': "+1",
            'dex': '+1',
            'const': '+1',
            'int': '+1',
            'wis': '+1',
            'cha': '+1'
        }
    }
    getAttackValues() {
        let dmg = Math.floor(Math.random() * this.weapon.damage + 1);
        let attackRoll = Math.floor(Math.random() * 20 + 1 + parseInt(this.modifiers.str));
        let attackValues = {
            dmg: dmg,
            attackRoll: attackRoll
        }
        return attackValues
    }

}