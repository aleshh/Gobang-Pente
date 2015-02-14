// gobang
// alesh.com
//
// todo: promoting an unblocked 3-row to 4 should be rated higher than blocking opponent's 3-row
// todo: attack one of opponent's pairs instead of defending own pair?
// todo: steal opponent's pair instead of defending own pair? depends on stolen pairs?
// todo: adjust continue statement on line 57
// 
// todo: lil bit of piece animation (fade in/out)
// todo: make 'easy' easier without being retarded (e.g. adjust individual rule probablity?)
//
// 2015-01-30 fancied up win message, play again message; fixed game reset
// 2015-01-29 correctly reset the game to play again, display players' names
// 2015-01-25 more interface functionality: stolen pairs displayed graphically, menu displays play/resume, etc.
// 2015-01-21 popup with single-player, difficulty select
// 2014-12-19 modal dialog simple directions popup
// 2014-12-16 pretty darned good intelligence -- steals a pair to break up a 3-in-row if possible, etc.
// 2014-12-14 computer takes guesses to prevent basic mistakes
// 2014-12-13 computer takes guesses based on proximity of other pieces
// 2014-12-10 single player mode: computer takes random guesses
// 2014-12-09 win from either 5-in-row of 5 surrounded pairs
// 2014-12-08 detect surrounded pair, display surounded pairs count
// 2014-12-07 track moves, identify win from 5-in-row
// 2014-12-04 show current move, 4-digit cells
// 2014-12-03 board, click to place alternating black and white dots, assets
//

directions = ['north', 'northEast', 'east', 'southEast', 'south', 'southWest', 'west', 'northWest'];
function oppositeDirection(direction) {
  if (direction == "north") return "south";
  if (direction == "northEast") return "southWest";
  if (direction == "east") return "west";
  if (direction == "southEast") return "northWest";
  if (direction == "south") return "north";
  if (direction == "southWest") return "northEast";
  if (direction == "west") return "east";
  if (direction == "northWest") return "southEast";
}
function perpendicularDirections(direction) {
  var d = directions.indexOf(direction);
  if (d < 4 ) {
    return [directions[d+1], directions[d+2], directions[d+3]];
  } else {
    return [directions[d-1], directions[d-2], directions[d-3]];
  }
}

function brain() {
  var highestStrength = 0;
  var possibilities = []; // set of all the spots on the board we're considering

  if (model.won) {
    return null;
  }

  for (var i = 0; i < model.boardSize; i++) {
    for (var j = 0; j < model.boardSize; j++) {
      var possibility = model.coordString(i,j); // spot we're considering right now
      if (model.pieces[possibility]) {
        // console.log('[brain] just skipped considering spot ' + possibility + ' that already has a piece');
        continue;
      }
      var strength = 0;
      for (var k = 0; k < 8; k++) {
        var a = directions[k];

        // adjacent piece of either color
        if (model.getPiece(i, j, a, 1)) {
          strength += 1; 
        }

        if (strength == 0) continue;

        // pair that can be stolen (b1)
        if (model.getPiece(i, j, a, 1) == model.currentOpponentColor() && 
            model.getPiece(i, j, a, 2) == model.currentOpponentColor() && 
            model.getPiece(i, j, a, 3) == model.currentPlayerColor) {
          strength += 10;
          console.log('[brain] found pair to steal ' + model.coordString(i,j));

          for (var m = 1; m < 3; m++) { // once for each of the pieces in the pair to consider stealing...
            var x = model.coordinates(model.getCoordString(i, j, a, m))[0];
            var y = model.coordinates(model.getCoordString(i, j, a, m))[1];
            console.log('[brain, pair subroutine] looking at piece ' + model.coordString(i,j));
            var subDirections = perpendicularDirections(a);
            for (var l = 0; l < 3; l ++) { // once for each of three possible directions...
              if (
                  ( model.getPiece(x, y, subDirections[l], 1) == model.currentOpponentColor() &&
                    model.getPiece(x, y, oppositeDirection(subDirections[l]), 1) == model.currentOpponentColor()
                  ) || (
                    (
                    model.getPiece(x, y, subDirections[l], 1) == model.currentOpponentColor() &&
                    model.getPiece(x, y, subDirections[l], 2) == model.currentOpponentColor()
                    ) || (
                    model.getPiece(x, y, oppositeDirection(subDirections[l]), 1) == model.currentOpponentColor() &&
                    model.getPiece(x, y, oppositeDirection(subDirections[l]), 2) == model.currentOpponentColor()
                    )
                  )
                 ) {
                strength += 16;
                console.log('[brain, pair subroutine] boosting pair based on disrupting 3-in-row');
              }
            }
          }
        }

        // defend vulnerable pair (b2)
        if (model.getPiece(i, j, a, 1) == model.currentPlayerColor && 
            model.getPiece(i, j, a, 2) == model.currentPlayerColor && 
            model.getPiece(i, j, a, 3) == model.currentOpponentColor()) {
          strength += 10;
          console.log('[brain] found vulnerable pair ' + model.coordString(i,j));
        }

        // block 3-in-row (b3)
        if (model.getPiece(i, j, a, 1) == model.currentOpponentColor() && 
            model.getPiece(i, j, a, 2) == model.currentOpponentColor() && 
            model.getPiece(i, j, a, 3) == model.currentOpponentColor() &&
            model.getPiece(i, j, a, 4) != model.currentPlayerColor) {
          strength += 15;
          console.log('[brain] blocking 3-in-row ' + model.coordString(i,j));
        }

        // try to make a 3-in-row if pair exists (merge with b1?) (b4.a)
        if (model.getPiece(i, j, a, 1) == model.currentPlayerColor && 
            model.getPiece(i, j, a, 2) == model.currentPlayerColor && 
            !model.getPiece(i, j, a, 3)) {
          strength += 4;
          console.log('[brain] making 3-in-row ' + model.coordString(i,j));
        }

        // try to make a 3-in-row if two orphans exist (b4.b)
        if (model.getPiece(i, j, a, 1) == model.currentPlayerColor && 
            model.getPiece(i, j, a, 2) != model.currentOpponentColor() && 
            model.getPiece(i, j, oppositeDirection(a), 1) == model.currentPlayerColor &&
            model.getPiece(i, j, oppositeDirection(a), 2) != model.currentOpponentColor()
            ) {
          strength += 4;
          console.log('[brain] making 3-in-row with orphans (this should execute twice if at all (b4.b)');
        }

        // attack opponent's undefended pair (b5)
        if (model.getPiece(i, j, a, 1) == model.currentOpponentColor() && 
            model.getPiece(i, j, a, 2) == model.currentOpponentColor() && 
            !model.getPiece(i, j, a, 3)) {
          strength += 1;
          console.log('[brain] attacking undefended pair');
        }

        // don't set up a vulnerable pair (b6.a)
        if (model.getPiece(i, j, a, 1) == model.currentPlayerColor && 
            model.getPiece(i, j, a, 2) == model.currentOpponentColor() && 
            !model.getPiece(i, j, oppositeDirection(a), 1)) {
          strength -= 8;
          console.log('[brain] preventing setting up vulnerable pair (b6.a)');
        }

        // don't set up a vulnerable pair (b6.b)
        if (model.getPiece(i, j, a, 1) == model.currentPlayerColor && 
            model.getPiece(i, j, oppositeDirection(a), 1) == model.currentOpponentColor() && 
            !model.getPiece(i, j, a, 2)) {
          strength -= 8;
          console.log('[brain] preventing setting up vulnerable pair (b6.b)');
        }

        // prevent 4-in-a-row (b7.a)
        if (
            model.getPiece(i, j, a, 1) == model.currentOpponentColor() &&
            model.getPiece(i, j, a, 2) == model.currentOpponentColor() &&
            model.getPiece(i, j, oppositeDirection(a), 1) == model.currentOpponentColor() &&
            model.getPiece(i, j, oppositeDirection(a), 2) != model.currentPlayerColor && 
            model.getPiece(i, j, a, 3) != model.currentPlayerColor
           ) {
          strength += 10;
          console.log('[brain] preventing 4-in-a-row (b7.a)');
        }

        // prevent 4-in-a-row (b7.a)
        if (
            model.getPiece(i, j, a, 1) == model.currentOpponentColor() &&
            model.getPiece(i, j, a, 2) == model.currentOpponentColor() &&
            model.getPiece(i, j, a, 3) == model.currentOpponentColor() &&
            model.getPiece(i, j, a, 4) != model.currentPlayerColor
           ) {
          strength += 10;
          console.log('[brain] preventing 4-in-a-row (b7.b)');
        }

        // win (b8.a)
        if (
            model.getPiece(i, j, a, 1) == model.currentPlayerColor &&
            model.getPiece(i, j, a, 2) == model.currentPlayerColor &&
            model.getPiece(i, j, oppositeDirection(a), 1) == model.currentPlayerColor &&
            model.getPiece(i, j, oppositeDirection(a), 2) == model.currentPlayerColor
           ) {
          strength += 15;
          console.log('[brain] found 5-in-a-row (b8.a)');
        }

        // win (b8.b)
        if (
            model.getPiece(i, j, a, 1) == model.currentPlayerColor &&
            model.getPiece(i, j, a, 2) == model.currentPlayerColor &&
            model.getPiece(i, j, a, 3) == model.currentPlayerColor &&
            model.getPiece(i, j, oppositeDirection(a), 1) == model.currentPlayerColor
           ) {
          strength += 15;
          console.log('[brain] found 5-in-a-row (b8.b)');
        }

        // win (b8.c)
        if (
            model.getPiece(i, j, a, 1) == model.currentPlayerColor &&
            model.getPiece(i, j, a, 2) == model.currentPlayerColor &&
            model.getPiece(i, j, a, 3) == model.currentPlayerColor &&
            model.getPiece(i, j, a, 4) == model.currentPlayerColor
           ) {
          strength += 15;
          console.log('[brain] found 5-in-a-row (b8.c)');
        }
      }

      if (strength > 3) { // for promising spots, we're going to do a little extra work
        for (var l = 1; l < 4; l++) {
          if (model.getPiece(i, j, a, l) == model.currentPlayerColor) {
            strength += 4 - l; // adjacent pieces add 3, 
          }
          console.log('[brain] adding score for possible nearby pieces ' + model.coordString(i,j));
          if (model.getPiece(i, j, a, l) == model.currentOpponentColor()) break;
        }
      }

      switch(model.difficulty) {
        case "Easy":
          if (Object.keys(model.pieces).length < 5) {
            strength += Math.random() * 10;
          } else {
            strength += Math.random() * 20;
          }
          break;
        case "Medium":
          strength += Math.random() * 7;
          break;
        case "Hard":
          strength += Math.random() * 2;
          break;
        default:
          console.log("ERROR: difficulty not set correctly!");
      }
      
      if (strength >= highestStrength - 10 && strength > 1) {
        possibilities[Number(possibility)] = strength;
      }
      if (strength > highestStrength) {
        highestStrength = strength;
      }
    }
  }

  console.log('[brain] highestStrength: ' + highestStrength);
  console.log('[brain] possibilities: ');
  console.log(possibilities);

  // // for those that are left, 
  // // add points for nearby pieces of the same color

  // possibilities.forEach(function(e, i) {

  // });
  
  var move = possibilities.indexOf(highestStrength).toString();
  while (move.length < 4) {
    move = "0" + move;
  }

  console.log('[brain] move: ' + move + '-----------------------------------');
  return move;
}

var model = {
  twoPlayer: false,
  currentPlayerHuman: true,
  playerOneName: "",
  playerTwoName: "",
  difficulty: "Medium",
  boardSize: 19,
  currentPlayerColor: 'white',
  currentMoveX: null,
  currentMoveY: null,
  pairsStolen: [],
  won: null,
  whiteStolenPairs: 0,
  blackStolenPairs: 0,
  pieces: {}, // this was an array [] before ... makes no difference?!

  currentOpponentColor: function() {
    if (this.currentPlayerColor == 'white') {
      return 'black';
    } else {
      return 'white';
    }
  },

  currentPlayerName: function() {
    if (this.currentPlayerColor == "white") {
      return this.playerOneName;
    } else {
      return this.playerTwoName;
    }
  },

  coordinates: function(spot) { // takes 4-digit string, returns array with [x, y]
    // console.log('[coordinates] input: ' + spot);
    // console.log('[coordinates] output: ' + [Number(spot.substring(0,2)), Number(spot.substring(2))]);
    return [Number(spot.substring(0,2)), Number(spot.substring(2))];
  },
  coordString: function(x, y) { // takes two coordinates, returns 4-digit string
    // console.log('[coordString] incoming: ' + x + ', ' + y);
    var column = x.toString();
    var roww = y.toString();
    if (column.length < 2) {
      column = "0" + column;
    }
    if (roww.length < 2) {
      roww = "0" + roww;
    }
    // console.log ('[coordString] returning: ' + column + roww);
    return column + roww;
  },

  getPieceRelative: function(direction, distance) {
    if (direction == "north") return this.pieces[this.coordString(this.currentMoveX, this.currentMoveY - distance)];
    if (direction == "south") return this.pieces[this.coordString(this.currentMoveX, this.currentMoveY + distance)];
    if (direction == "east") return this.pieces[this.coordString(this.currentMoveX + distance, this.currentMoveY)];
    if (direction == "west") return this.pieces[this.coordString(this.currentMoveX - distance, this.currentMoveY)];
    if (direction == "northEast") return this.pieces[this.coordString(this.currentMoveX + distance, this.currentMoveY - distance)];
    if (direction == "southEast") return this.pieces[this.coordString(this.currentMoveX + distance, this.currentMoveY + distance)];
    if (direction == "southWest") return this.pieces[this.coordString(this.currentMoveX - distance, this.currentMoveY + distance)];
    if (direction == "northWest") return this.pieces[this.coordString(this.currentMoveX - distance, this.currentMoveY - distance)];
  },

  getPiece: function(x, y, direction, distance) {
    if (direction == "north") return this.pieces[this.coordString(x, y - distance)];
    if (direction == "south") return this.pieces[this.coordString(x, y + distance)];
    if (direction == "east") return this.pieces[this.coordString(x + distance, y)];
    if (direction == "west") return this.pieces[this.coordString(x - distance, y)];
    if (direction == "northEast") return this.pieces[this.coordString(x + distance, y - distance)];
    if (direction == "southEast") return this.pieces[this.coordString(x + distance, y + distance)];
    if (direction == "southWest") return this.pieces[this.coordString(x - distance, y + distance)];
    if (direction == "northWest") return this.pieces[this.coordString(x - distance, y - distance)];
  },

  getCoordString: function(x, y, direction, distance) {
    if (direction == "north") return this.coordString(x, y - distance);
    if (direction == "south") return this.coordString(x, y + distance);
    if (direction == "east") return this.coordString(x + distance, y);
    if (direction == "west") return this.coordString(x - distance, y);
    if (direction == "northEast") return this.coordString(x + distance, y - distance);
    if (direction == "southEast") return this.coordString(x + distance, y + distance);
    if (direction == "southWest") return this.coordString(x - distance, y + distance);
    if (direction == "northWest") return this.coordString(x - distance, y - distance);
  },

  getCoordStringRelative: function(direction, distance) {
    if (direction == "north") return this.coordString(this.currentMoveX, this.currentMoveY - distance);
    if (direction == "south") return this.coordString(this.currentMoveX, this.currentMoveY + distance);
    if (direction == "east") return this.coordString(this.currentMoveX + distance, this.currentMoveY);
    if (direction == "west") return this.coordString(this.currentMoveX - distance, this.currentMoveY);
    if (direction == "northEast") return this.coordString(this.currentMoveX + distance, this.currentMoveY - distance);
    if (direction == "southEast") return this.coordString(this.currentMoveX + distance, this.currentMoveY + distance);
    if (direction == "southWest") return this.coordString(this.currentMoveX - distance, this.currentMoveY + distance);
    if (direction == "northWest") return this.coordString(this.currentMoveX - distance, this.currentMoveY - distance);
  },

  playPiece: function(move) {

    if (this.won) {
      return null;
    }

    // console.log('[playPiece] input:' + move);
    if (!this.pieces[move]) { // if the move is unoccupied, it's a legal move

      this.pieces[move] = this.currentPlayerColor;
      // if (debug) console.log (this.pieces);
      view.placeStone(move, this.currentPlayerColor);

      // if (debug) console.log ('coordinates ' + this.coordinates(move));
      // console.log('[playPiece] this.coordinates(move): ' + this.coordinates(move));
      var moveCoordinates = this.coordinates(move);
      // console.log('[playPiece] movecoordinates: ' + moveCoordinates);
      var coordX = moveCoordinates[0]; // remove()
      var coordY = moveCoordinates[1]; // remove
      this.currentMoveX = moveCoordinates[0];
      this.currentMoveY = moveCoordinates[1];
      var north = 0;
      var south = 0;
      var east = 0;
      var west = 0;
      var northEast = 0;
      var northWest = 0;
      var southEast = 0;
      var southWest = 0;

      // Count the number of pieces in each direction
      for (var i = 1; i < 5; i ++) {
        if (this.getPieceRelative("north", i) == this.currentPlayerColor) {
          north++;
        } else {
          break;
        }
      }
      for (var i = 1; i < 5; i ++) {
        if (this.getPieceRelative("south", i) == this.currentPlayerColor) {
          south++;
        } else {
          break;
        }
      }
      for (var i = 1; i < 5; i ++) {
        if (this.getPieceRelative("east", i) == this.currentPlayerColor) {
          east++;
        } else {
          break;
        }
      }
      for (var i = 1; i < 5; i ++) {
        if (this.getPieceRelative("west", i) == this.currentPlayerColor) {
          west++;
        } else {
          break;
        }
      }
      for (var i = 1; i < 5; i ++) {
        if (this.getPieceRelative("northWest", i) == this.currentPlayerColor) {
          northWest++;
        } else {
          break;
        }
      }
      for (var i = 1; i < 5; i ++) {
        if (this.getPieceRelative("southWest", i) == this.currentPlayerColor) {
          southWest++;
        } else {
          break;
        }
      }
      for (var i = 1; i < 5; i ++) {
        if (this.getPieceRelative("northEast", i) == this.currentPlayerColor) {
          northEast++;
        } else {
          break;
        }
      }
      for (var i = 1; i < 5; i ++) {
        if (this.getPieceRelative("southEast", i) == this.currentPlayerColor) {
          southEast++;
        } else {
          break;
        }
      }

      // now we look for surrounded pairs

      for (var i = 0; i < directions.length; i ++) {
        var a = directions[i];
        // console.log('[stolen pair?] direction: ' + a + ' piece: ' + this.getPieceRelative(a, 2));
        if (this.getPieceRelative(a, 1) == this.currentOpponentColor() && 
            this.getPieceRelative(a, 2) == this.currentOpponentColor() &&
            this.getPieceRelative(a, 3) == this.currentPlayerColor) {
          console.log('Pair stolen!');
          delete this.pieces[this.getCoordStringRelative(a, 1)];
          delete this.pieces[this.getCoordStringRelative(a, 2)];
          // if (debug) console.log (this.pieces);
          view.removeStone(this.getCoordStringRelative(a, 1));
          view.removeStone(this.getCoordStringRelative(a, 2));
          if (this.currentPlayerColor == 'white') this.blackStolenPairs++;
          if (this.currentPlayerColor == 'black') this.whiteStolenPairs++;
          if (this.blackStolenPairs == 5 || this. whiteStolenPairs == 5) {
            this.won = this.currentPlayerColor;
          }
          console.log('blackStolenPairs: ' + this.blackStolenPairs + ', whiteStolenPairs: ' + this.whiteStolenPairs);
          view.displayStolenPairs();
        }
      }

      // Determine win

      if (north + south >= 4 || east + west >= 4 || 
          northEast + southWest >= 4 || northWest + southEast >= 4) { // player wins
        this.won = this.currentPlayerColor;
      }

      if (this.won) {
        console.log(this.currentPlayerColor + ' wins');
        // view.displayMsg('Game over: ' + this.currentPlayerColor + ' wins.');
        view.displayWin();
      }

      if (!this.won) {
        this.currentPlayerColor = this.currentOpponentColor();
        view.updateMoveMsg();
      }
    } else {
      if (debug) console.log('Spot already taken');
    }
  },

  resetGame: function() {
    this.pieces = {};
    this.won = "";
    this.currentPlayerColor = "white";
    this.whiteStolenPairs = 0;
    this.blackStolenPairs = 0;
    this.currentPlayerHuman = true;
    this.won = null;
    this.pieces = {};
    this.pairsStolen = [];
    view.initializeBoard();
  }

}

var view = {

  initializeBoard: function() {
    var boardTarget = document.getElementById('gameBoard');
    boardTarget.innerHTML = "";
    for (var i = 0; i < model.boardSize; i ++) {
      var row = document.createElement('tr');
      for (var j = 0; j < model.boardSize; j ++) {
        var cell = document.createElement('td');
        var column = i.toString();
        var roww = j.toString();
        if (column.length < 2) {
          column = "0" + column;
        }
        if (roww.length < 2) {
          roww = "0" + roww;
        }
        var cellId = roww + column;
        cell.setAttribute('id', cellId);
        row.appendChild(cell);
      }
      boardTarget.appendChild(row);
    }
    var dots = ["0909", "0303", "0315", "1503", "1515","0903", "0309", "1503", "1509", "0915"];
    for (var i = 0; i < dots.length; i ++) {
      document.getElementById(dots[i]).className = 'dot';
    }
    this.resizeBoard();
    if (debug) console.log('Board initialized. First move: ' + model.currentPlayerColor);
    document.getElementById('stolenWhite').innerHTML = "";
    document.getElementById('stolenBlack').innerHTML = "";
    document.getElementById('options').innerHTML = "Options";
    this.displayMsg('');
    // this.displayMsg('Current move: ' + model.currentPlayerColor);
  },

  resizeBoard: function() {
    var $cells = $('#gameBoard td');
    $cells.height($cells.width());
  },

  placeStone: function(position, color) {
    position = document.getElementById(position);
    position.className = color;
  },

  removeStone: function(position) {
    position = document.getElementById(position); // 'cause now 'position' is returning the coordinates, not the acutal element
    position.className = '';
    console.log('removing ' + position);
  },

  displayMsg: function(message) {
    document.getElementById('msgArea').innerHTML = message;
  },

  updateMoveMsg: function() {
    console.log('updateMoveMsg');
    if (model.twoPlayer) {
      view.displayMsg('Current move: ' + model.currentPlayerName() + ' (' +  model.currentPlayerColor + ')');
    } else {
      view.displayMsg('Current move: ' + model.currentPlayerColor);
    }
  },

  // displayAuxMsg: function(message) {
  //   document.getElementById('auxMessageArea').innerHTML = message;
  // },

  displayStolenPairs: function() {
    console.log('processing stolen pairs images')
    var whiteString = "";
    var blackString = "";
    for (i = 0; i < model.whiteStolenPairs; i ++) {
      whiteString += '<img src="images/stolen-white.png" alt="Stolen White Pair">';
    }
    for (i = 0; i < model.blackStolenPairs; i ++) {
      blackString += '<img src="images/stolen-black.png" alt="Stolen White Pair">';
    }
    console.log(whiteString);
    console.log(blackString);
    document.getElementById('stolenWhite').innerHTML = whiteString;
    document.getElementById('stolenBlack').innerHTML = blackString;
  },

  displayWin: function() {
    var winString = 'Gamer over: ';
    if (model.twoPlayer) {
      winString += model.currentPlayerName() + ' (' +  model.currentPlayerColor + ') wins.';
    } else {
      if (model.currentPlayerHuman) {
        winString += 'You win. (' + model.currentPlayerColor + ')';
      } else {
        winString += 'Computer wins. (' + model.currentPlayerColor + ')';
      }
  }
  console.log('winString: ' + winString);
    $('#msgArea').html(winString).hide().fadeIn('fast').fadeOut('fast').fadeIn('fast').fadeOut('fast').fadeIn('fast');
    $('#options').fadeOut('slow').text('Play Again?').fadeIn('slow');
    // this.displayMsg('Game over: ' + model.currentPlayerColor + ' wins.');

  },

  displaySettings: function() {
    var $overlay = $("#overlay");
    var $popup = $("#popup");
    var $difficulty = $("#difficulty");
    var $players = $("#players");
    var $submit = $(".submit");

    if (model.won) {
      model.resetGame();
    }

    $overlay.fadeIn("slow");
    $popup.fadeIn("slow");

    // $(".default").prop("checked", true);
    // $difficulty.show();
    // $players.hide();

    if (model.twoPlayer) {
      $('[value="Two-player"]').prop('checked', true);
      $players.show();
    } else {
      $('[value="Single-player"]').prop('checked', true);
      $difficulty.show();
    }

    $('[value=' + model.difficulty + ']').prop('checked', true);

    if ($.isEmptyObject(model.pieces) || model.won) {
      $('#newGame, #resume').hide();
      $('#play').show();
    } else {
      $('#play').hide();
      $('#newGame, #resume').show();
    }

    $("input[name='singlePlayer']").change(function() {
      if ($("input[name='singlePlayer']:checked").val() === "Single-player") {
        $difficulty.fadeIn("slow");
        $players.fadeOut("slow");
      } else {
        $difficulty.fadeOut("slow");
        $players.fadeIn("slow");
      }
    });

    $submit.css("cursor", "pointer").click(function(e) {
      if ($("input[name='singlePlayer']:checked").val() === "Single-player") {
        model.twoPlayer = false;
      } else {
        model.twoPlayer = true;
      }

      model.difficulty = $("input[name=difficulty]:checked").val();

      model.playerOneName = $("#playerOne").val();
      model.playerTwoName = $("#playerTwo").val();
      if (model.playerOneName == "") {
        model.playerOneName = "Player 1";
      }
      if (model.playerTwoName == "") {
        model.playerTwoName = "Player 2";
      }

      if (e.target.id === 'newGame') {
        model.resetGame();
        // model.pieces = {};
        // model.won = "";
        // model.currentPlayerColor = 'white';
        // view.initializeBoard();
      }

      $overlay.fadeOut("slow");
      $popup.fadeOut("slow");
      view.updateMoveMsg();

    });
  }

}

var controller = {

  click: function(e) {
    model.currentPlayerHuman = true;
    var move = e.target.id;
    if (!model.pieces[move] && !model.won) {
      model.playPiece(move); 
      if (!model.twoPlayer) {
        model.currentPlayerHuman = false;
        setTimeout(function() {model.playPiece(brain());}, 500);
      }
    }
  }
}

debug = true;

window.onload = function() {
  view.initializeBoard();
  view.displaySettings();

  // document.getElementById('options').onclick = view.displaySettings();

  $("#options").click(view.displaySettings);

  // model.playPiece('0304'); // white
  // model.playPiece('0204');
  // model.playPiece('0405'); // white
  // model.playPiece('0305');
  // model.playPiece('0404'); // white
  // model.playPiece('0103');

  $(window).resize(view.resizeBoard);


  var el = document.getElementById('gameBoard');
  el.onclick = controller.click; // see http://stackoverflow.com/questions/27295052/why-is-my-method-not-seeing-this-property
}