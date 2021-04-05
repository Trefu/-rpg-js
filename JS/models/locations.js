import {
    enemy
} from "./Enemigo"
import {
    eventClicks
} from "../eventsClicks"
import {
    functions
} from "../functions"
class EventsLocations {
    constructor(name, difficulty, description, options, resolutions) {
        this.name = name;
        this.difficulty = difficulty;
        this.description = description;
        this.options = options;
        this.resolutions = resolutions;
    }
    execute() {
        console.log(this.resolutions)
        battleText.innerText = this.description;
        for (let btn in this.options) {
            console.log(btn)
            let newBtn = $(`<a>${this.options[btn]}</a>`)
            $(newBtn).attr('id', btn)
            $(newBtn).addClass("btn btn-dark btn-outline-success w-100 my-2 actBtns");
            $("#midSec").append(
                newBtn
            );
        }
        let midSecBtns = document.querySelectorAll(".actBtns");
        console.log(midSecBtns)
        midSecBtns.forEach((el, i) =>
            el.addEventListener("click", e => {
                console.log("asd", i)
                this.resolutions[i]()
            }))
    }
    reward() {
        console.log("reward")
    }

}


//Monsters groups
let winterMonsters = {
    wolf: "wolf",
    winterTroll: new enemy.Ice_Troll("Ice Troll"),
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
    cold: new EventsLocations(eventClicks.coldEvent.name,
        eventClicks.coldEvent.difficulty,
        eventClicks.coldEvent.description,
        eventClicks.coldEvent.options,
        eventClicks.coldEvent.resolutions
    ),
    cave: new EventsLocations("cave",
        80,
        "Deep footprints of a booted, humanoid are visible in the fresh snow. The footsteps lead deep into a cave; they do not return."),
    monster: new EventsLocations("monster",
        0,
        `there is something coming towards you but the thick ice fog prevents you from seeing`),
    storm: new EventsLocations("storm",
        90,
        `The air is extremely cold. Ice crystals form around the nose and mouth, as well as on the eyebrows. It's so cold in here, it takes your breath away `)
}


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
class LocationClass {
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
            this.eventList = functions.arrayRemoveElement(this.eventList, eventSelected)
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
export const LocationsMap = {
    LocationClass,
    EventsLocations,
    winterDangers,
    winterImgs,
    winterMonsters,
    duniaMonsters,
    duniaDangers,
    duniaImgs
}