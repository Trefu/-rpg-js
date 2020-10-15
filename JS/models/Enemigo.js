class Enemy {
    constructor(name, hp, armor, strength, dexterity,constitution, intelligence,wisdom,charisma, weapon) {
        this.name = name;
        this.hp = hp;
        this.armor = armor;
        this.strength = strength;
        this.dexterity = dexterity;
        this.constitution = constitution;
        this.intelligence = intelligence;
        this.wisdom = wisdom;
        this.charisma = charisma;
        this.weapon = weapon;

    }
    getAttackValues() {
        let dmg = Math.floor(Math.random() * this.weapon.damage + 1);
        let attackRoll = Math.floor(Math.random() * 20 + 1 + parseInt(this.strength));
        let attackValues = {
            dmg: dmg,
            attackRoll: attackRoll
        }
        return attackValues
    }

}