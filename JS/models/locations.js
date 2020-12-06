//Monsters
let wolf = "Asd";
let winterTroll = "asdasd";
let snowDrake = "asd";

//Monsters groups
let winterMonsters = {
    wolf,
    winterTroll,
    snowDrake
};

//locations dangers
let winterDangers = {
    storm() {
        console.log("storm")
    },
    cold() {
        console.log("cold")
    }
};

//locations images
let winterImgs = {
    bg: "url('imgs/locations/winterbg.jpg')"
}


class Location {
    constructor(name, dangers, monsters, imgs) {
        this.name = name;
        this.dangers = dangers;
        this.monsters = monsters;
        this.imgs = imgs;
    }
    eventRandom() {
        let body = document.getElementById("body");
        let span = document.getElementById("battleText");
        let textRecordSec = document.getElementById("textRecordSec");
        locationsImgs.remove();
        body.style.backgroundImage = LocationBattle.imgs.bg;
        span.classList.remove("d-none");

    }



}