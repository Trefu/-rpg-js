var staff = {
    name: "Staff",
    dmg: [2, 6],
};
var dagger = {
    name: "dagger",
    dmg: [6, 8],
};
var greatsword = {
    name: "Greatsword",
    dmg: [12, 20],
};

var sword = {
    name: "Sword",
    dmg: [8, 16],
    fumbleChance: 5,
    type: "Slashing",
};

var claws = {
    name: "Claws",
    dmg: [4, 7],
    fumbleChance: 3,
    type: "Slashing"
}

var bite = {
    name: "jaws",
    dmg: [7, 11],
    type: "Piercing"
}

export const weapons = {
    staff,
    dagger,
    greatsword,
    sword,
    claws,
    bite
}