let shortSword = {
    "name": "shortSword",
    "damage": 6,
    "crit": 20
};

let bite = {
    "name": "Bite",
    "damage": 4,
    "crit": 20
};

let spores = {
    "name": "Spores",
    "damage": 8,
    "crit": 20
};


let claws = {
    "name": "Claws",
    "damage": 8,
    "crit": 20
};


let staff = {
    "name": "Staff",
    "damage": 4,
    "crit": 20
};
let dagger = {
    "name": "Dagger",
    "damage": 4,
    "crit": [18, 19, 20]
};
let greatsword = {
    "name": "Greatsword",
    "damage": 12,
    "crit": 20
};
let Manager = {
    setGameStart: function (classType) {
        this.resetPlayer(classType);
        this.setPrefight();
    },
    resetPlayer: function (classType) {
        switch (classType) {
            //(classType, hp, armor, strength, dexterity, intelligence, weapon) 
            case "fighter":
                player = new Player(classType, 12, 17, 3, -1, -1, greatsword)
                break;
            case "mage":
                player = new Player(classType, 8, 11, -1, 1, 3, staff)
                break;
            case "rogue":
                player = new Player(classType, 16, 14, 0, 6, 3, dagger)
                break;
        }
        let getHeader = document.getElementById("header");
        getHeader.innerHTML = "<h1>Fight!</h1>";
        let getInterface = document.getElementById("interface");
        getInterface.innerHTML = `<img class="avatarFight" src="imgs/avatars/${classType}.png">
        <div class="class2">
        <h3>${classType.toUpperCase()}</h3>
        <p id="player-health">Health: ${player.hp}</p>
        <p>Armor: ${player.armor}</p>
        <p>Strength: ${player.strength}</p>
        <p>Dexterity: ${player.dexterity}</p>
        <p>Intelligence: ${player.intelligence}</p>
        <p>Weapon: ${player.weapon.name} </p>
        <p>Damage : 1d${player.weapon.damage}</p>
        </div>
        <div id="actions"></div>
        <div id="arena"> <img src="imgs/arena.jpg" alt="arena" class="arena"> </div>
        <div id="enemy" class="enemy"></div>
        `;

    },
    setPrefight: function () {
        getActions = document.getElementById("actions");
        getArena = document.getElementById("arena");
        getActions.innerHTML = `
        <a href="#" class="btn" onclick="Manager.setFight()">Search an enemy!</a>
        `;
    },

    //crear enemigo aleatorio
    setFight: function () {
        let enemy01 = new Enemy("Goblin", 7, 15, -1, 2, 0, shortSword);
        let enemy02 = new Enemy("Violet Fungus", 18, 5, -4, -4, -5, spores);
        let enemy03 = new Enemy("Wolf", 11, 13, +1, +2, -4, bite);
        let enemy04 = new Enemy("Gnoll", 22, 15, +2, +1, -2, shortSword);
        let enemy05 = new Enemy("Ghoul", 22, 12, +1, +2, -2, claws);
        let pickEnemy = Math.floor(Math.random() * 5 + 1);
        switch (pickEnemy) {
            case 1:
                enemy = enemy01
                break;
            case 2:
                enemy = enemy02
                break;
            case 3:
                enemy = enemy03
                break;
            case 4:
                enemy = enemy04
                break;
            case 5:
                enemy = enemy05
                break;

        }
        alert("One " + enemy.classType + " appears to fight you!")
        let getEnemyInterface = document.getElementById("enemy");
        getEnemyInterface.innerHTML = `
        <div class="class2">
        <h3>${enemy.classType}</h3>
        <p id="enemy-health">Health: ${enemy.hp}</p>
        <p>Armor: ${enemy.armor}</p>
        <p>Strength: ${enemy.strength}</p>
        <p>Dexterity: ${enemy.dexterity}</p>
        <p>Intelligence: ${enemy.intelligence}</p>
        <p>Weapon: ${enemy.weapon.name}</p>
        <p> Damage: 1d${enemy.weapon.damage}</p>
        </div>
        <img class="avatarFight" src="imgs/enemy/${enemy.classType}.png">
        `;
        getActions.innerHTML = `<a href="#" class="btn" onclick="PlayerMoves.meeleAttack()">Attack!</a>  `
    }
};