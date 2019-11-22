import ListenAndWriteGame from './listen-and-write-game.js';
import MentalArithmeticGame from './mental-arithmetic-game.js';
import Pages from './pages.js';
import Sound from './sound.js';
import GlobalSettings from './global-settings.js';

GlobalSettings.INSTANCE = new GlobalSettings();

let sound = new Sound();
let pages = new Pages();

new MentalArithmeticGame(sound, pages);
new ListenAndWriteGame(sound, pages);

// try to initialize sound early to prevent 
// a delayed, half, first utterance 
let soundWarmedUp = false;
document.addEventListener('hashchange', () =>{
	if(!soundWarmedUp){
		soundWarmedUp = true;
		sound.playWord(' ');
	}
});
