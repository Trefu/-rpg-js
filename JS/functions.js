const heal = function (obj, num) {
    obj.health += num;
    obj.health >= obj.maxHealth ? obj.health = obj.maxHealth : obj.health;
    battleTextAdd(`${obj.name} heals for ${num}`, "heal");

    actStats(obj);
}

const showButtons = function (boolean, btn) {
    boolean ? btn.classList.remove("d-none") : btn.classList.add("d-none");
};

const passTurn = (nextEnt) => {
    setTimeout(() => {
        battleText.innerHTML += (`<h4>${nextEnt.name} Turn</h4>`);
        isPlayer(nextEnt) ? $(playerCombatsBtns).show() : nextEnt.turn();
    }, 3000);
}
const generateWeaponDmg = (weapon) => {
    let min = weapon.dmg[0];
    let max = weapon.dmg[1];
    let output = Math.floor(Math.random() * (max - min + 1) + min);
    return output;
}

const counterAttack = function (counter, objective) {
    let counterdmg = generateWeaponDmg(counter.weapon)
    objective.health -= counterdmg;
    battleTextAdd(`${counter.name} counter the attack dealing ${counterdmg} ${counter.weapon.type} damage`, "counter")
    if (objective.health <= 0) {
        objective.health = 0;
        alert("win coutner")
    }
    actStats(enemy);
    actStats(player);

}
const arrayRemoveElement = (arr, value) => arr.filter(ele => ele != value);

const d100 = () => Math.ceil(Math.random() * 100);

const isPlayer = ent => ent instanceof BaseModel;

const restantLife = (obj) => {
    return Math.round((obj.maxHealth - obj.health) / obj.maxHealth * 100 / 3)
}

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