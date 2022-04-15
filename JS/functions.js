
const arrayRemoveElement = (arr, value) => arr.filter(ele => ele != value);

const d100 = () => Math.ceil(Math.random() * 100);

const isPlayer = ent => ent instanceof BaseModel;

export const functions = {
    heal,
    showButtons,
    passTurn,
    generateWeaponDmg,
    counterAttack,
    arrayRemoveElement,
    d100,
    isPlayer,
    restantLife
}