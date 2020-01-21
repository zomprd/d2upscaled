import * as ECSA from '../libs/pixi-component';

// TODO rename your game
class MyGame {
  engine: ECSA.GameLoop;

  constructor() {
    this.engine = new ECSA.GameLoop();
    let canvas = (document.getElementById('gameCanvas') as HTMLCanvasElement);

    // init the game loop
    this.engine.init(canvas, 800, 600, 1, // width, height, resolution
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

    this.engine.app.loader
      .reset()
      //.add(myFile, 'myFileUrl') load your assets here
      .load(() => this.onAssetsLoaded());
  }

  onAssetsLoaded() {
    // init the scene and run your game
    let scene = this.engine.scene;
    new ECSA.Builder(scene)
      .localPos(this.engine.app.screen.width / 2, this.engine.app.screen.height / 2)
      .anchor(0.5)
      .withParent(scene.stage)
      .withComponent(new ECSA.GenericComponent('rotation').doOnUpdate((cmp, delta, absolute) => cmp.owner.asText().rotation += 0.001 * delta))
      .asText('text', '\u0047\u004F\u004F\u0044 \u004C\u0055\u0043\u004B\u0021', new PIXI.TextStyle({ fill: '#FF0000', fontSize: 80, fontFamily: 'Courier New' }))
      .build();
  }
}

// this will create a new instance as soon as this file is loaded
export default new MyGame();