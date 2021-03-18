class EventsLocations {
    constructor(name, difficulty, description, actions) {
        this.name = name;
        this.difficulty = difficulty;
        this.description = description;
        this.actions = actions;
    }
    execute() {
        battleText.innerText = this.description;
        for (let btn in this.actions) {
            let newBtn = $(`<a>${this.actions[btn]}</a>`)
            $(newBtn).addClass("btn btn-dark btn-outline-success w-100 my-2");
            $("#midSec").append(
                newBtn
            );
            console.log(this.actions[btn])

        }

        btnEvent1.setAttribute("onClick", `winterDangers[${this.name}].choise()`)
        showButtons(true, btnEvent1, btnEvent2, btnEvent3)
    }
    reward() {
        console.log("reward")
    }

}


//Monsters groups
let winterMonsters = {
    wolf: "wolf",
    winterTroll: new Ice_Troll("Ice Troll"),
    snowDrake: "Snow Drak2",
};
let duniaMonsters = {
    dustWorm: "dust Worm"
}
//locations dangers
let duniaDangers = {
    eventPassed: 0,
    stormPassed: false
}

let winterDangers = {
    cold: new EventsLocations("cold",
        65,
        "Its getting colder", {
            "btn1": "Run",
            "btn2": "Find refugee",
            "btn3": "idk"
        }),
    cave: new EventsLocations("cave",
        80,
        "Deep footprints of a booted, humanoid are visible in the fresh snow. The footsteps lead deep into a cave; they do not return."),
    monster: new EventsLocations("monster",
        0,
        `there is something coming towards you but the thick ice fog prevents you from seeing`),
    storm: new EventsLocations("storm",
        90,
        `seems to be that a storm is aproaching from the north`)
}


/* {
cold() {
    battleText.innerText = "Its getting colder"
    console.log("cold")
    this.coldPassed = true;
    btnEvent1.innerText = "cold"
    showButtons(true, btnEvent1);
    btnEvent1.setAttribute("onClick", 'winterDangers.resultWinterEvent("cold")')
},
cave() {
    battleText.innerText = "Deep footprints of a booted, humanoid are visible in the fresh snow. The footsteps lead deep into a cave; they do not return."
    showButtons(true, btnEvent1);
    showButtons(true, btnEvent2);
    btnEvent1.innerText = "Examine the cave"
    btnEvent1.setAttribute("onClick", 'winterDangers.resultWinterEvent("examine")')
    btnEvent2.innerText = "Ignore and keep forward"
    btnEvent2.setAttribute("onClick", 'winterDangers.resultWinterEvent("ignore")')
    console.log("cueva")
},
monsters() {
    battleText.innerText = `you detect something coming towards you but the thick ice fog prevents you from seeing`
    locationBattle.randomFight()
},
storm() {
    console.log("tormenta")
    battleText.innerText = `seems to be that a storm is aproaching from the north`
    if ((player.health * 100 / player.maxHealth) >= 30) {
        showButtons(true, btnEvent1);
        showButtons(true, btnEvent2);
        btnEvent1.innerText = "Keep foward and try to pass the storm"
        btnEvent1.setAttribute("onClick", 'winterDangers.resultWinterEvent("advance")')
        btnEvent2.innerText = "Try to search for refuge"
        btnEvent2.setAttribute("onClick", 'winterDangers.resultWinterEvent("refuge")')
    } else {
        btnEvent1.innerText = "Keep foward and try to pass the storm (Health to low)"
        btnEvent1.className = "btn btn-dark btn-outline-danger my-2 w-100"
        showButtons(true, btnEvent2);
        showButtons(true, btnEvent3);
    }
},
 resultWinterEvent(pick) {
        showButtons(false, btnEvent1)
        showButtons(false, btnEvent2)
        showButtons(false, btnEvent3)
        let luckThrow = d100()
        luckThrow += player.luck;
        console.log(`Luck trow ${luckThrow}`)

        switch (pick) {
            case "advance":
                if (luckThrow >= 80) {
                    battleTextAdd(`${player.name} manages to go trought the storm without problems and gets inspired`);
                    player.status.inspired = true;
                } else if (luckThrow >= 70) {
                    battleTextAdd(`${player.name} barely escapes the storm and feels icy`)
                    player.status.cold = true;
                    player.health -= 15;
                } else {
                    battleText.innerText += `
                    ${player.name} almost get frozen in the storm`;
                    player.status.cold = true;
                    player.health -= 25;
                }
                this.stormPassed = true;
                setTimeout(() => {
                    locationBattle.eventRandom()
                }, 1000);
                break;

            case "refuge":
                let probRefuge = d100()
                if (probRefuge >= 70) {
                    battleText.innerText += `
                    ${player.name} finds a great place to stay and get warm`;
                    player.status.cold = false;
                } else {
                    battleText.innerText += `
                    ${player.name} almost get frozen in the storm`;
                    player.status.cold = true;
                    player.health -= 25;
                }
                this.stormPassed = true;
                setTimeout(() => {
                    locationBattle.eventRandom()
                }, 1000);
                break;

            case "examine":
                //CAMBIAR ESTO DESPUES DE TESTEAR
                if (luckThrow >= 200) {
                    battleText.innerText += `
                ${player.name} Finds a little treasure`;
                } else {
                    locationBattle.randomFight();
                }
                break;

            case "ignore":
                battleText.innerText += `
            ${player.name} decides to better past away`;
                break;
            case "cold":
                battleText.innerText += `
            ${player.name} ta bien codl`;
                this.coldPassed = true;
                setTimeout(() => {
                    locationBattle.eventRandom()
                }, 1000);
                break;
        }
        actStats(player);
    }
}, */


//locations images
let winterImgs = {
    bg: "linear-gradient(to right, #000428, #004e92)",
    reward: "",
    final: ""
}
let duniaImgs = {
    bg: "background: linear-gradient(to right, #cac531, #f3f9a7);"
}

let theDeepImgs = {

}

let neverWinterForestImgs = {


}
class locationMap {
    constructor(name, dangers, monsters, imgs) {
        this.name = name;
        this.dangers = dangers;
        this.monsters = monsters;
        this.imgs = imgs;
        this.eventList = Object.keys(this.dangers)
    }
    locationStart() {
        locationsImgs.remove();
        body.style.background = this.imgs.bg;
        battleText.classList.remove("d-none");
    }

    /*
    si en la lista de eventos no esta vacia entonces elige un numero aleatorio entre 0 y el num maximo del largo de la lista de eventos,almacena en eventSelected el nombre del metodo del evento
    para ejecutarlo y eliminarlo 
    */
    eventRandom() {
        if (this.eventList.length === 0) {
            console.log("especial evento")
        } else {
            let randomNum = Math.floor(Math.random() * this.eventList.length);
            randomNum = 0;
            let eventSelected = this.eventList[randomNum];
            console.log(eventSelected)
            this.dangers[eventSelected].execute();
            this.eventList = arrayRemoveElement(locationBattle.eventList, eventSelected)
        }
    }
    randomFight() {
        enemy = this.monsters.winterTroll;
        battleText.innerText = `${player.name} stands against ${enemy.name}`
        enemyName.innerText = `${enemy.name}`
        enemyAvatar.src = "imgs/enemy/claws of winter/ice troll.png"
        setTimeout(() => {
            Manager.fight();
        }, 1000);
    }

}