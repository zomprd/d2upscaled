import * as ECSA from '../libs/pixi-component';
import EncampmentBackground from './encampment-background';
import Player from './player';
import PIXISound from 'pixi-sound';
import ForegroundUpscaleComponent from './foreground-upscale-component';
import ScaleButton from './scale-button';
import KeyboardInputComponent from './keyboard-input-component';
import { MessageActions, Scale, Character, Resolution } from './game-enums-and-constants';
import EncampmentAnimatedObject from './encampment-animated-object';
import ShowInventoryComponent from './show-inventory-component';
import CharacterInventory from './character-inventory';

class Diablo2Upscaled {
  engine: ECSA.GameLoop;

  constructor() {
    this.engine = new ECSA.GameLoop({ transparent: true });
    let canvas = (document.getElementById('gameCanvas') as HTMLCanvasElement);

    // init the game loop
    this.engine.init(canvas, Resolution.width, Resolution.height, 1, // width, height, resolution
      {
        flagsSearchEnabled: false, // searching by flags feature
        statesSearchEnabled: false, // searching by states feature
        tagsSearchEnabled: false, // searching by tags feature
        namesSearchEnabled: true, // searching by names feature
        notifyAttributeChanges: false, // will send message if attributes change
        notifyStateChanges: false, // will send message if states change
        notifyFlagChanges: false, // will send message if flags change
        notifyTagChanges: false, // will send message if tags change
        debugEnabled: false // debugging window
      }, true); // resize to screen

    let toLoad = [];

    for (let i = 0; i < 22; i++) {
      const baseName = 'encampment-' + i;
      toLoad.push([baseName, './assets/encampment/' + baseName + '.json']);
    }
    for (let i = 0; i < 8; i++) {
      const baseName = 'encampment-original-' + i;
      toLoad.push([baseName, './assets/encampment/' + baseName + '.json']);
    }
    for (let i = 0; i < 3; i++) {
      const baseName = 'asn-fartface-' + i;
      toLoad.push([baseName, './assets/' + baseName + '.json']);
    }
    for (let i = 0; i < 3; i++) {
      const baseName = 'asn-fatality-' + i;
      toLoad.push([baseName, './assets/' + baseName + '.json']);
    }
    toLoad.push(['asn-original', './assets/asn-original.json']);
    toLoad.push(['encampment-song', './assets/rogue-encampment.ogg']);
    toLoad.push(['step-sound', './assets/step.wav']);

    const qualities = ['original', 'upscaled'];
    qualities.forEach(quality => {
      for (let character in Character) {
        toLoad.push(['inv-' + Character[character] + '-' + quality, './assets/inv-' + Character[character] + '-' + quality + '.png']);
      }
    })
    toLoad.push(['bottom-panel-original', './assets/d2-spodni-panel-original.png']);
    toLoad.push(['bottom-panel-upscaled', './assets/d2-spodni-panel-upscaled.png']);
    toLoad.push(['encampment-animations-upscaled-0', './assets/encobjs-0.json']);
    toLoad.push(['encampment-animations-upscaled-1', './assets/encobjs-1.json']);


    let progressBar = document.getElementById('progress') as HTMLProgressElement;
    progressBar.value = 0;
    progressBar.max = toLoad.length;
    let loader = this.engine.app.loader.reset();
    loader.onLoad.add(() => progressBar.value++);

    toLoad.forEach((assetToLoad) => loader.add(assetToLoad[0], assetToLoad[1]));
    loader.load(() => this.onAssetsLoaded(progressBar));
  }



  onAssetsLoaded(progressBar) {

    let scene = this.engine.scene;
    PIXISound.play('encampment-song');
    scene.addGlobalComponent(new ECSA.KeyInputComponent());
    scene.addGlobalComponent(new ECSA.PointerInputComponent(true, true, true, true));
    let root = new ECSA.Container('root') as any;
    root.x = -5760;
    root.y = -2060 - 43;
    scene.stage.addChild(root);

    let encampmentBackground = new EncampmentBackground();
    root.addChild(encampmentBackground);

    let middleground = new ECSA.Container();
    root.addChild(middleground);

    //waypoint
    middleground.addChild(new EncampmentAnimatedObject(4010 * 2, 1355 * 2, '3PON', 20));
    //stash
    middleground.addChild(new EncampmentAnimatedObject(3205 * 2, 1260 * 2, 'B6NU', 1));
    //fire
    middleground.addChild(new EncampmentAnimatedObject(3140 * 2, 1410 * 2, 'RBON', 20));
    //charsi
    const charsi = new EncampmentAnimatedObject(2965 * 2, 880 * 2, 'CINU', 13);
    middleground.addChild(charsi);
    charsi.addComponent(new ShowInventoryComponent('player'));
    charsi.addComponent(new ShowInventoryComponent('charsi'));
    //chicken
    middleground.addChild(new EncampmentAnimatedObject(3430 * 2, 1040 * 2, 'CKNU', 6));
    middleground.addChild(new EncampmentAnimatedObject(2055 * 2, 1075 * 2, 'CKNU', 6));
    middleground.addChild(new EncampmentAnimatedObject(3333 * 2, 2115 * 2, 'CKNU', 6));
    middleground.addChild(new EncampmentAnimatedObject(4790 * 2, 1900 * 2, 'CKNU', 6));
    middleground.addChild(new EncampmentAnimatedObject(4775 * 2, 2280 * 2, 'CKNU', 6));
    //cows
    middleground.addChild(new EncampmentAnimatedObject(2945 * 2, 2105 * 2, 'CWNU', 10));
    middleground.addChild(new EncampmentAnimatedObject(4970 * 2, 1710 * 2, 'CWNU', 10));
    //cain
    middleground.addChild(new EncampmentAnimatedObject(3315 * 2, 1465 * 2, 'DCNU', 15));
    //gheed
    const gheed = new EncampmentAnimatedObject(1940 * 2, 1450 * 2, 'GHNU', 8);
    middleground.addChild(gheed);
    gheed.addComponent(new ShowInventoryComponent('player'));
    gheed.addComponent(new ShowInventoryComponent('gheed'));
    //flag 1
    middleground.addChild(new EncampmentAnimatedObject(2420 * 2, 1435 * 2, 'N1NU', 10));
    //flag 2
    middleground.addChild(new EncampmentAnimatedObject(3505 * 2, 1090 * 2, 'N2NU', 10));
    //akara
    const akara = new EncampmentAnimatedObject(4610 * 2, 1600 * 2, 'PSNU', 13)
    middleground.addChild(akara);
    akara.addComponent(new ShowInventoryComponent('player'));
    akara.addComponent(new ShowInventoryComponent('akara'));
    //kashya
    middleground.addChild(new EncampmentAnimatedObject(3625 * 2, 1505 * 2, 'RCNU', 12));
    //warriv
    const warriv = new EncampmentAnimatedObject(3285 * 2, 1285 * 2, 'WANU', 16);
    middleground.addChild(warriv);
    warriv.addComponent(new ShowInventoryComponent('player'));
    //torches
    middleground.addChild(new EncampmentAnimatedObject(2980 * 2, 1145 * 2, 'TOON', 20));
    middleground.addChild(new EncampmentAnimatedObject(3660 * 2, 1280 * 2, 'TOON', 20));
    middleground.addChild(new EncampmentAnimatedObject(2690 * 2, 835 * 2, 'TOON', 20));
    middleground.addChild(new EncampmentAnimatedObject(3125 * 2, 835 * 2, 'TOON', 20));
    middleground.addChild(new EncampmentAnimatedObject(2435 * 2, 1025 * 2, 'TOON', 20));
    middleground.addChild(new EncampmentAnimatedObject(1765 * 2, 1350 * 2, 'TOON', 20));
    middleground.addChild(new EncampmentAnimatedObject(2150 * 2, 1280 * 2, 'TOON', 20));
    middleground.addChild(new EncampmentAnimatedObject(2590 * 2, 1610 * 2, 'TOON', 20));
    middleground.addChild(new EncampmentAnimatedObject(2870 * 2, 1870 * 2, 'TOON', 20));
    middleground.addChild(new EncampmentAnimatedObject(3400 * 2, 2300 * 2, 'TOON', 20));
    middleground.addChild(new EncampmentAnimatedObject(3510 * 2, 1580 * 2, 'TOON', 20));
    middleground.addChild(new EncampmentAnimatedObject(4060 * 2, 1160 * 2, 'TOON', 20));
    middleground.addChild(new EncampmentAnimatedObject(4250 * 2, 1400 * 2, 'TOON', 20));
    middleground.addChild(new EncampmentAnimatedObject(4210 * 2, 1660 * 2, 'TOON', 20));
    middleground.addChild(new EncampmentAnimatedObject(4470 * 2, 1510 * 2, 'TOON', 20));
    middleground.addChild(new EncampmentAnimatedObject(4820 * 2, 1550 * 2, 'TOON', 20));
    middleground.addChild(new EncampmentAnimatedObject(4480 * 2, 1920 * 2, 'TOON', 20));
    middleground.addChild(new EncampmentAnimatedObject(4290 * 2, 2140 * 2, 'TOON', 20));
    //rogues
    middleground.addChild(new EncampmentAnimatedObject(2530 * 2, 1080 * 2, 'RGNU', 24));
    middleground.addChild(new EncampmentAnimatedObject(2480 * 2, 1610 * 2, 'RGNU', 24));
    middleground.addChild(new EncampmentAnimatedObject(3580 * 2, 1910 * 2, 'RGNU', 24));
    middleground.addChild(new EncampmentAnimatedObject(4070 * 2, 1610 * 2, 'RGNU', 24));
    middleground.addChild(new EncampmentAnimatedObject(4230 * 2, 1980 * 2, 'RGNU', 24));
    middleground.addChild(new EncampmentAnimatedObject(4000 * 2, 2230 * 2, 'RGNU', 24));


    let player = new Player();
    middleground.addChild(player);

    let foreground = new ECSA.Container('foreground');
    foreground.addComponent(new ForegroundUpscaleComponent());
    scene.stage.addChild(foreground);

    for (let character in Character) {
      foreground.addChild(new CharacterInventory(Character[character]));
    }

    foreground.addChild(new ScaleButton(Scale.Down));
    foreground.addChild(new ScaleButton(Scale.Up));

    scene.addGlobalComponent(new KeyboardInputComponent());
    scene.sendMessage(new ECSA.Message(MessageActions.Upscale));

    let state = play;

    this.engine.app.ticker.add(delta => gameLoop(delta));
    progressBar.remove();

    function gameLoop(delta) {
      state(delta);
    }

    function play(delta) {

    }
  }

}

export default new Diablo2Upscaled();