let daga = 4;
let baston = 4;
let espadon = 12;
let Manager = {
    setGameStart: function (classType) {
        this.resetPlayer(classType);
        this.setPrefight();
    },
    resetPlayer: function (classType) {
        switch (classType) {
            //(classType, hp, armor, strength, dexterity, intelligence, weapon) 
            case "fighter":
                player = new Player(classType, 12, 15, 3, -1, -1, espadon)
                break;
            case "mage":
                player = new Player(classType, 8, 10, 0, 3, 1, baston)
                break;
            case "rogue":
                player = new Player(classType, 10, 12, -1, 1, 3, daga)
                break;
        }


    },

    setPrefight: function () {

    }
};





/*var a = Math.floor(Math.random() * (10 - 1 + 1)) + 1;
let espada = 6;
let daga = 4;
let espadon = 12;

const Jugador = {
    bonos: {
        fue: 1,
        des: 1,
        cons: 1,
        int: 1,
        sab: 1,
        car: 1,
    },
    salud: 10,
    armor: 10,
    equipo: {
        arma: espada,
    },
    attack: function attack(bicho) {
        let attackScore = Math.floor(Math.random() * 20 + 1 + this.bonos.fue);
        if (attackScore >= bicho.armor) {
            console.log("Impacto con " + attackScore);
            bicho.salud -= dmgTotal(Jugador.equipo.arma);
            console.log("Salud restante " + bicho.salud);

        } else {
            console.log("Miss " + attackScore);
        }
        return attackScore;
    }
}

const Enemy = {
    salud: 100,
    armor: 9,
    attack: 3,


}

function dmgTotal(object) {
    let dmg = Math.floor(Math.random() * object + 1);
    console.log(dmg);
    return dmg;
}




personaje.Atacar(enemigo) {
     if(personaje.ataque > enemigo.defensa) {
          hacerDaño(enemigo, personaje.daño);
     }
}
 Entidad seria el enemigo, dado el ejemplo de arriba, y cantidad de daño, si es que queres,
  el daño que va hacer en algun numerito 
function hacerDaño(entidad, cantidadDaño) {
    // Podes meter el calculo que quieras, o cualquier ganzada
    entidad.vida = entidad.vida - cantidadDaño;
}
*/