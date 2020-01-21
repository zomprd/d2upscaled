import { Scene, Graphics, Container, GenericComponent, Message } from '..';
import { Ticker } from 'pixi.js';
import ChainComponent from '../components/chain-component';
import Builder from '../engine/builder';
import { Messages } from '../engine/constants';

const WIDTH = 600;
const HEIGHT = 600;
const TIME_STEP = 16.67;

abstract class BaseTest {

  protected isRunning = false;


  beforeTest(scene: Scene) {
    scene.clearScene({});
  }

  abstract executeTest(scene: Scene, ticker: Ticker, onFinish: Function);

  afterTest(scene: Scene) {
    this.stop();
    scene.clearScene({});
  }

  protected update(delta: number, absolute: number, scene: Scene, ticker: Ticker) {
    scene._update(delta, absolute);
    ticker.update(absolute);
  }

  protected loop(scene: Scene, ticker: Ticker) {
    this.isRunning = true;
    this.loopFunc(TIME_STEP, 0, scene, ticker);
  }

  protected loopFunc(delta: number, absolute: number, scene: Scene, ticker: Ticker) {
    this.update(delta, absolute, scene, ticker);
    if (this.isRunning) {
      requestAnimationFrame((time) => this.loopFunc(TIME_STEP, absolute + TIME_STEP, scene, ticker));
    }
  }

  protected stop() {
    this.isRunning = false;
  }
}

// ============================================================================================================
class RotationTest extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let gfx = new Graphics('');
    gfx.beginFill(0xFF0000);
    gfx.drawRect(0, 0, 200, 200);
    gfx.pivot.set(100, 100);
    gfx.position.set(300, 300);
    gfx.endFill();
    scene.stage.pixiObj.addChild(gfx);
    gfx.addComponent(new GenericComponent('').doOnUpdate((cmp, delta, absolute) => gfx.rotation += delta * 0.001));
    scene.invokeWithDelay(1500, () => {
      onFinish('Rotation test', 'OK', true);
    });
    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class FlagTest extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let obj = new Container();

    obj.setFlag(1);
    obj.setFlag(10);
    obj.setFlag(20);
    obj.setFlag(32);
    obj.setFlag(45);
    obj.setFlag(70);
    obj.setFlag(90);
    obj.setFlag(128);
    obj.resetFlag(1);
    obj.invertFlag(2);
    let flags = [...obj._proxy.getAllFlags()];
    let allFlags = [2, 10, 20, 32, 45, 70, 90, 128];
    let success = flags.length === allFlags.length && flags.filter(flag => allFlags.findIndex(it => it === flag) === -1).length === 0;
    onFinish('Flag manipulation', success ? 'OK' : 'FAILURE', success);
  }
}
// ============================================================================================================
class TagSearchTest extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    scene.clearScene({ tagsSearchEnabled: true });
    let obj = new Container();
    obj.addTag('A');
    obj.addTag('B');
    obj.addTag('C');
    scene.stage.pixiObj.addChild(obj);

    let obj2 = new Container();
    obj2.addTag('A');
    scene.stage.pixiObj.addChild(obj2);

    let obj3 = new Container();
    obj3.addTag('A');
    obj3.addTag('B');
    scene.stage.pixiObj.addChild(obj3);
    let success = scene.findObjectsByTag('A').length === 3 && scene.findObjectsByTag('B').length === 2 && scene.findObjectsByTag('C').length === 1;
    onFinish('Searching by tag', success ? 'OK' : 'FAILURE', success);
  }
}
// ============================================================================================================
class TagSearchTest2 extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    scene.clearScene({ tagsSearchEnabled: true });
    let obj = new Container();
    obj.addTag('A');
    obj.addTag('B');
    obj.addTag('C');
    scene.stage.pixiObj.addChild(obj);

    let obj2 = new Container();
    obj2.addTag('A');
    scene.stage.pixiObj.addChild(obj2);

    let obj3 = new Container();
    obj3.addTag('A');
    obj3.addTag('B');
    scene.stage.pixiObj.addChild(obj3);
    obj3.removeTag('A');
    obj3.removeTag('B');
    let success = scene.findObjectsByTag('A').length === 2 && scene.findObjectsByTag('B').length === 1 && scene.findObjectsByTag('C').length === 1;
    onFinish('Searching by tag 2', success ? 'OK' : 'FAILURE', success);
  }
}
// ============================================================================================================
class StateSearchTest extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    scene.clearScene({ statesSearchEnabled: true });
    let obj = new Container();
    obj.stateId = 15;
    scene.stage.pixiObj.addChild(obj);

    let obj2 = new Container();
    obj2.stateId = 15;
    scene.stage.pixiObj.addChild(obj2);

    let obj3 = new Container();
    obj3.stateId = 10;
    scene.stage.pixiObj.addChild(obj3);
    let success = scene.findObjectsByState(15).length === 2 && scene.findObjectsByState(10).length === 1 && scene.findObjectsByState(5).length === 0;
    onFinish('Searching by state', success ? 'OK' : 'FAILURE', success);
  }
}
// ============================================================================================================
class StateSearchTest2 extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    scene.clearScene({ statesSearchEnabled: true });
    let obj = new Container();
    obj.stateId = 15;
    scene.stage.pixiObj.addChild(obj);

    let obj2 = new Container();
    obj2.stateId = 15;
    scene.stage.pixiObj.addChild(obj2);
    obj.stateId = 200; // change the state
    let success = scene.findObjectsByState(15).length === 1 && scene.findObjectsByState(200).length === 1;
    onFinish('Searching by state 2', success ? 'OK' : 'FAILURE', success);
  }
}
// ============================================================================================================
class FlagSearchTest extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    scene.clearScene({ flagsSearchEnabled: true });
    let obj = new Container();
    obj.setFlag(12);
    scene.stage.pixiObj.addChild(obj);
    obj.setFlag(120);
    let obj2 = new Container();
    obj2.setFlag(12);
    scene.stage.pixiObj.addChild(obj2);
    obj.resetFlag(120);
    let success = scene.findObjectsByFlag(12).length === 2 && scene.findObjectsByFlag(120).length === 0;
    onFinish('Searching by flag', success ? 'OK' : 'FAILURE', success);
  }
}
// ============================================================================================================
class ComponentUpdateTest extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let gfx = new Graphics('');
    gfx.beginFill(0x0000FF);
    gfx.drawRect(0, 0, 50, 50);
    gfx.pivot.set(25, 25);
    gfx.position.set(300, 300);
    gfx.endFill();
    scene.stage.pixiObj.addChild(gfx);
    gfx.scale.x = 0;
    gfx.addComponent(new GenericComponent('').doOnUpdate((cmp, delta, absolute) => gfx.scale.x++).setFrequency(1)); // 1 per second
    scene.invokeWithDelay(3500, () => {
      let success = Math.floor(gfx.scale.x) === 3;
      onFinish('Component update once per second', success ? 'OK' : 'FAILURE, VAL: ' + gfx.scale.x, success);
    });
    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class ChainComponentTest extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let gfx = new Graphics('');
    gfx.beginFill(0x00FF00);
    gfx.drawRect(0, 0, 200, 200);
    gfx.pivot.set(100, 100);
    gfx.position.set(300, 300);
    gfx.endFill();
    scene.stage.pixiObj.addChild(gfx);
    let tokens = 0;
    gfx.addComponent(new GenericComponent('').doOnMessage('TOKEN', () => tokens++));
    gfx.addComponent(new ChainComponent()
      .beginRepeat(2)
      .addComponentAndWait(() => new GenericComponent('').doOnUpdate((cmp, delta, absolute) => gfx.rotation += 0.1 * delta).setTimeout(500))
      .addComponentAndWait(() => new GenericComponent('').doOnUpdate((cmp, delta, absolute) => gfx.rotation -= 0.1 * delta).setTimeout(500))
      .addComponent(() => new GenericComponent('').doOnUpdate((cmp, delta, absolute) => gfx.rotation += 0.01 * delta).setTimeout(1000).doOnFinish((cmp) => cmp.sendMessage('TOKEN')))
      .waitForMessage('TOKEN')
      .endRepeat()
      .execute((cmp) => {
        scene.invokeWithDelay(0, () => onFinish('Chain component repeat test', tokens === 2 ? 'OK' : 'FAILURE', tokens === 2));
      })
    );

    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class ChainComponentTest2 extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let tokens = 0;
    let whileTokens = 0;
    scene.addGlobalComponent(new ChainComponent()
      .beginIf(() => false)
      .execute(() => tokens = -10)
      .else()
      .execute(() => tokens++)
      .endIf()
      .beginIf(() => true)
      .execute(() => tokens++)
      .else()
      .execute(() => tokens = -10)
      .endIf()
      .beginWhile(() => whileTokens <= 10)
      .execute(() => whileTokens++)
      .endWhile()
      .execute((cmp) => {
        scene.invokeWithDelay(0, () => onFinish('Chain component repeat test 2', tokens === 2 ? 'OK' : 'FAILURE', tokens === 2));
      })
    );

    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class ChainComponentTest3 extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let finished = false;
    scene.addGlobalComponent(new ChainComponent()
      .waitForMessage('TOKEN')
      .execute((cmp) => {
        finished = true;
        scene.invokeWithDelay(0, () => onFinish('Chain component repeat test 3', 'OK', true));
      })
    );

    scene.invokeWithDelay(2000, () => {
      scene.sendMessage(new Message('TOKEN'));
      scene.invokeWithDelay(1000, () => {
        if(!finished) {
          onFinish('Chain component repeat test 3', 'TIMEOUT', false);
        }
      });
    });
    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class ChainComponentTest4 extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {

    let finished = false;
    let token = 0;

    let cmpGenerator = () => new GenericComponent('generic').doOnMessage('STOP', (cmp, msg) =>  {
      token++;
      cmp.finish();
    });

    scene.addGlobalComponent(new ChainComponent()
      .addComponentsAndWait([cmpGenerator(), cmpGenerator(), cmpGenerator()]) // add 3 components and wait when all of them finish
      .execute((cmp) => {
        finished = true;
        let success = token === 3;
        scene.invokeWithDelay(0, () => onFinish('Chain component wait for 3 components', success ? 'OK' : 'FAILURE, expected 3, got ' + token, success));
      })
    );

    scene.invokeWithDelay(500, () => {
      scene.sendMessage(new Message('STOP'));
      scene.invokeWithDelay(500, () => {
        if(!finished) {
          onFinish('Chain component wait for 3 components', 'TIMEOUT', false);
        }
      });
    });
    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class ChainComponentConditionalTest extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let finished = false;
    scene.stage.setFlag(12);
    scene.stage.stateId = 22;
    scene.addGlobalComponent(new ChainComponent()
      .waitForMessageConditional('TOKEN', { ownerState: 22, ownerFlag: 12 })
      .execute((cmp) => {
        finished = true;
        scene.invokeWithDelay(0, () => onFinish('Chain component conditional test', 'OK', true));
      })
    );

    scene.invokeWithDelay(200, () => {
      scene.stage.addComponent(new ChainComponent().execute((cmp) => cmp.sendMessage('TOKEN')));

      scene.invokeWithDelay(1000, () => {
        if(!finished) {
          scene.invokeWithDelay(0, () => onFinish('Chain component conditional test', 'TIMEOUT', false));
        }
      });
    });
    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class BuilderTest extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let builder = new Builder(scene);
    builder.withComponent(() => new GenericComponent('').doOnUpdate((cmp, delta, absolute) => cmp.owner.pixiObj.rotation += 0.0001 * delta * cmp.owner.id));
    builder.anchor(0.5, 0.5);

    let finishedComponents = 0;
    builder.withComponent(() => new GenericComponent('').setTimeout(Math.random() * 3000).doOnFinish(() => {
      finishedComponents++;
      if(finishedComponents === 100) {
        // we have all
        scene.invokeWithDelay(0, () => onFinish('Builder test', 'OK', true));
      }
    }));

    for(let i =0; i<100; i++) {
      builder.globalPos(Math.random() * WIDTH, Math.random() * HEIGHT);
      builder.asText('', 'Hello', new PIXI.TextStyle({
        fontSize: 35,
        fill: '#F00'
      })).withParent(scene.stage).build(false);
    }

    // safety check
    scene.invokeWithDelay(5000, () => {
      if(finishedComponents !== 100) {
        onFinish('Builder test', 'TIMEOUT', false);
      }
    });

    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class BuilderTest2 extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let builder = new Builder(scene);
    builder.withChild(
      new Builder(scene)
      .localPos(100, 100)
      .asText('text', 'CHILD1', new PIXI.TextStyle({fontSize: 35, fill: '#0F0'}))
    ).withChild(
      new Builder(scene)
      .localPos(-100, -100)
      .asText('text', 'CHILD2', new PIXI.TextStyle({fontSize: 35, fill: '#00F'}))
    );
    builder.asText('text', 'PARENT', new PIXI.TextStyle({fontSize: 80, fill: '#F00'}));
    builder.withComponent(() => new GenericComponent('').doOnUpdate((cmp, delta, absolute) => cmp.owner.pixiObj.rotation += 0.001*delta));
    builder.anchor(0.5, 0.5);
    builder.localPos(WIDTH/2, HEIGHT/2).withParent(scene.stage).build();

    scene.invokeWithDelay(2000, () => {
      let objects = scene.findObjectsByName('text');
      if(objects.length === 3 && objects.filter(obj => obj.pixiObj.parent.name === 'text').length === 2) {
        onFinish('Builder2 test', 'OK', true);
      } else {
        onFinish('Builder2 test', 'FAILURE', false);
      }
    });

    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class GenericComponentTest extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let token = 0;
    new Builder(scene)
    .localPos(300, 300)
    .anchor(0.5)
    .asText('text', 'GENERIC', new PIXI.TextStyle({fontSize: 35, fill: '#FFF'}))
    .withComponent(new GenericComponent('tint').doOnUpdate((cmp) => cmp.owner.asText().tint = 0xFFFF + Math.floor(Math.random() * 0xFF))) // animation, not important for the test
    .withComponent(new GenericComponent('gencmp').doOnMessage('msg_example', (cmp, msg) => token++))
    .withComponent(new ChainComponent().waitTime(1000).execute((cmp) => cmp.sendMessage('msg_example')).execute((cmp) => cmp.sendMessage('msg_example')))
    .withParent(scene.stage).build();

    // chain component will fire two messages that should be captured by GenericComponent and token var should be increased

    scene.invokeWithDelay(2000, () => {
      if(token === 2) {
        onFinish('Generic component message test', 'OK', true);
      } else {
        onFinish('Generic component message test', 'FAILURE, TOKEN MISMATCH', false);
      }
    });

    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class GenericComponentTest2 extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let token = 0;
    new Builder(scene)
    .localPos(300, 300)
    .anchor(0.5)
    .asText('text', 'GENERIC 2', new PIXI.TextStyle({fontSize: 35, fill: '#0FF'}))
    .withComponent(new GenericComponent('tint').doOnUpdate((cmp) => cmp.owner.asText().tint = 0x0000 + Math.floor(Math.random() * 0xFF))) // animation, not important for the test
    .withComponent(new GenericComponent('gencmp').doOnMessageOnce('msg_example', (cmp, msg) => token++))
    .withComponent(new ChainComponent().waitTime(1000).execute((cmp) => cmp.sendMessage('msg_example')).execute((cmp) => cmp.sendMessage('msg_example')))
    .withParent(scene.stage).build();

    // chain component will fire two messages that should be captured by GenericComponent only once

    scene.invokeWithDelay(2000, () => {
      if(token === 1) {
        onFinish('Generic component message test 2', 'OK', true);
      } else {
        onFinish('Generic component message test 2', 'FAILURE, TOKEN MISMATCH', false);
      }
    });

    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class GenericComponentConditionalTest extends BaseTest {

  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let token = 0;
    let tokenTag = 0;
    let tokenName = 0;
    let tokenState = 0;
    let tokenFlag = 0;
    new Builder(scene)
    .localPos(300, 300)
    .anchor(0.5)
    .asText('text', 'GENERIC CONDITIONAL', new PIXI.TextStyle({fontSize: 35, fill: '#0FF'}))
    .withComponent(new GenericComponent('tint').doOnUpdate((cmp) => cmp.owner.asText().tint = Math.floor(Math.random() * 0xFF) << 16 + 0xFFFF)) // animation, not important for the test
    .withComponent(new GenericComponent('gencmp')
    .doOnMessageConditional('msg_conditional', { }, (cmp, msg) => token++) // empty condition, should be invoked every time
    .doOnMessageConditional('msg_conditional', { ownerTag: 'test_tag' }, (cmp, msg) => tokenTag++) // increase only if the object has test_tag tag
    .doOnMessageConditional('msg_conditional', { ownerName: 'test_name' }, (cmp, msg) => tokenName++) // shouldn't be invoked
    .doOnMessageConditional('msg_conditional', { ownerName: 'text' }, (cmp, msg) => tokenName++) // increase only if the object has name == text
    .doOnMessageConditional('msg_conditional', { ownerState: 12 }, (cmp, msg) => tokenState++) // increase only if the object has state == 12
    .doOnMessageConditional('msg_conditional', { ownerFlag: 50 }, (cmp, msg) => tokenFlag++)) // increase only if the object has flag == 50
    .withComponent(new ChainComponent().waitTime(1000)
    .execute((cmp) => cmp.sendMessage('msg_example')) // shouldn't be captured at all
    .execute((cmp) => cmp.owner.addTag('test_tag'))
    .execute((cmp) => cmp.sendMessage('msg_conditional')) // should be captured by empty closure, name-closure and tag-closure
    .execute((cmp) => cmp.owner.removeTag('test_tag'))
    .execute((cmp) => cmp.owner.stateId = 12)
    .execute((cmp) => cmp.sendMessage('msg_conditional')) // should be captured by empty closure, name-closure and state-closure
    .execute((cmp) => cmp.owner.stateId = 13)
    .execute((cmp) => cmp.sendMessage('msg_conditional')) // should be captured by empty closure, name-closure
    .execute((cmp) => cmp.owner.setFlag(50))
    .execute((cmp) => cmp.sendMessage('msg_conditional'))) // should be captured by empty closure, name-closure and flag-closure
    .withParent(scene.stage).build();

    scene.invokeWithDelay(2000, () => {
      let success = token === 4 && tokenTag === 1 && tokenName === 4 && tokenState === 1 && tokenTag === 1;
      if(success) {
        onFinish('Generic component conditional test', 'OK', true);
      } else {
        onFinish('Generic component conditional test', 'FAILURE, TOKEN MISMATCH', false);
      }
    });

    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class FrequencyTest extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let gfx = new Graphics('');
    gfx.beginFill(0xFFF00);
    gfx.drawCircle(0, 0, 100);
    gfx.position.set(WIDTH/2, HEIGHT/2);
    gfx.endFill();
    scene.stage.pixiObj.addChild(gfx);
    gfx.addComponent(new GenericComponent('')
    .setFrequency(0.5) // 1x in 2 seconds
    .doOnUpdate((cmp, delta, absolute) => gfx.scale.x /= 2));
    scene.invokeWithDelay(2500, () => { // should run 1x
      if(Math.abs(gfx.scale.x - 0.5) <= 0.01) {
        onFinish('FrequencyTest', 'OK', true);
      } else {
        onFinish('FrequencyTest', 'FAILURE, expected 0.5, given ' + gfx.scale.x, false);
      }
    });
    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class FrequencyTest2 extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let gfx = new Graphics('');
    gfx.beginFill(0xFFFF00);
    gfx.drawCircle(0, 0, 100);
    gfx.position.set(WIDTH/2, HEIGHT/2);
    gfx.endFill();
    scene.stage.pixiObj.addChild(gfx);
    gfx.addComponent(new GenericComponent('')
    .setFrequency(2) // 2x per second
    .doOnUpdate((cmp, delta, absolute) => gfx.scale.x /= 2));
    scene.invokeWithDelay(1800, () => { // should run 3x: 500 1000 1500
      if(Math.abs(gfx.scale.x - 0.125) <= 0.01) {
        onFinish('FrequencyTest2', 'OK', true);
      } else {
        onFinish('FrequencyTest2', 'FAILURE, expected 0.125, given ' + gfx.scale.x, false);
      }
    });
    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class FrequencyTest3 extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let gfx = new Graphics('');
    gfx.beginFill(0xEFCD56);
    gfx.drawRect(0, 0, 200, 200);
    gfx.position.set(WIDTH/2, HEIGHT/2);
    gfx.endFill();
    scene.stage.pixiObj.addChild(gfx);
    gfx.addComponent(new GenericComponent('')
    .setFrequency(2) // 2x per second
    .doOnUpdate((cmp, delta, absolute) => {
        gfx.scale.x *= (delta/1000);
    })); // delta should be 500
    scene.invokeWithDelay(2200, () => { // should run 4x: 500 1000 1500, 2000
      if(Math.abs(gfx.scale.x - 0.0625) <= 0.01) {
        onFinish('FrequencyTest3', 'OK', true);
      } else {
        onFinish('FrequencyTest3', 'FAILURE, expected 0.0625, given ' + gfx.scale.x, false);
      }
    });
    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class MessageNotifyTest extends BaseTest {

  beforeTest(scene: Scene) {
    // enable everything
    scene.clearScene({
      notifyAttributeChanges: true,
      notifyFlagChanges: true,
      notifyStateChanges: true,
      notifyTagChanges: true
    });
  }

  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {

    let token = 0;
    // update token with every new message
    scene.addGlobalComponent(new GenericComponent('')
    .doOnMessage(Messages.ATTRIBUTE_ADDED, (cmp, msg) => token++)
    .doOnMessage(Messages.ATTRIBUTE_CHANGED, (cmp, msg) => token++)
    .doOnMessage(Messages.ATTRIBUTE_REMOVED, (cmp, msg) => token++)
    .doOnMessage(Messages.FLAG_CHANGED, (cmp, msg) => token++)
    .doOnMessage(Messages.TAG_ADDED, (cmp, msg) => token++)
    .doOnMessage(Messages.TAG_REMOVED, (cmp, msg) => token++)
    .doOnMessage(Messages.OBJECT_ADDED, (cmp, msg) => token++)
    .doOnMessage(Messages.OBJECT_REMOVED, (cmp, msg) => token++)
    .doOnMessage(Messages.STATE_CHANGED, (cmp, msg) => token++)
    .doOnMessage(Messages.COMPONENT_ADDED, (cmp, msg) => token++)
    .doOnMessage(Messages.COMPONENT_REMOVED, (cmp, msg) => token++)
    );
    // update scene so that the component will be added to the stage
    this.update(16, 16, scene, ticker);

    new Builder(scene)
    .withComponent(new GenericComponent('dummy'))
    .withAttribute('dummy_attr', 12345)
    .withFlag(123)
    .withParent(scene.stage)
    .withState(12).build();

    scene.invokeWithDelay(500, () => { // wait a few frames
      if(token === 1) { // we expect only one message: OBJECT_ADDED
        onFinish('MessageNotifyTest', 'OK', true);
      } else {
        onFinish('MessageNotifyTest', 'FAILURE, expected 1 message, given ' + token, false);
      }
    });
    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class MessageNotifyTest2 extends BaseTest {

  beforeTest(scene: Scene) {
    // enable everything
    scene.clearScene({
      notifyAttributeChanges: true,
      notifyFlagChanges: true,
      notifyStateChanges: true,
      notifyTagChanges: true
    });
  }

  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {

    let token = 0;
    scene.stage.assignAttribute('attr_1', 1);
    scene.stage.asContainer().addChild(new Graphics('CHILD'));
    scene.stage.addComponent(new GenericComponent('GENERIC1'));
    // update token with every new message
    scene.addGlobalComponent(new GenericComponent('')
    .doOnMessage(Messages.ATTRIBUTE_ADDED, (cmp, msg) => token++)
    .doOnMessage(Messages.ATTRIBUTE_CHANGED, (cmp, msg) => token++)
    .doOnMessage(Messages.ATTRIBUTE_REMOVED, (cmp, msg) => token++)
    .doOnMessage(Messages.FLAG_CHANGED, (cmp, msg) => token++)
    .doOnMessage(Messages.TAG_ADDED, (cmp, msg) => token++)
    .doOnMessage(Messages.TAG_REMOVED, (cmp, msg) => token++)
    .doOnMessage(Messages.OBJECT_ADDED, (cmp, msg) => token++)
    .doOnMessage(Messages.OBJECT_REMOVED, (cmp, msg) => token++)
    .doOnMessage(Messages.STATE_CHANGED, (cmp, msg) => token++)
    .doOnMessage(Messages.COMPONENT_ADDED, (cmp, msg) => token++)
    .doOnMessage(Messages.COMPONENT_REMOVED, (cmp, msg) => token++)
    );
    // update scene so that the component will be added to the stage
    this.update(16, 16, scene, ticker);

    // now we should receive message about every single update
    scene.stage.assignAttribute('attr_2', 1); // attribute added
    scene.stage.assignAttribute('attr_1', 1); // attribute changed
    scene.stage.removeAttribute('attr_1'); // attribute removed
    scene.stage.removeAttribute('attr_XYZ'); // doesn't exist, no message
    scene.stage.setFlag(12); // flag chnaged
    scene.stage.resetFlag(33); // flag changed
    scene.stage.addTag('tag1'); // tag added
    scene.stage.removeTag('tag1'); // tag removed
    scene.stage.removeTag('tag2'); // doesn't exist, no message
    scene.stage.asContainer().addChild(new Graphics('CHILD_2')); // object added
    scene.stage.asContainer().removeChild(scene.findObjectByName('CHILD').asContainer()); // object removed
    scene.stage.stateId = 12; // state changed
    scene.stage.addComponent(new GenericComponent('GENERIC2')); // component added
    scene.stage.removeComponent(scene.stage.findComponentByName('GENERIC1')); // component removed

    scene.invokeWithDelay(500, () => { // wait a few frames
      if(token === 12) { // we expect all 12 messages
        onFinish('MessageNotifyTest 2', 'OK', true);
      } else {
        onFinish('MessageNotifyTest 2', 'FAILURE, expected 12 messages, given ' + token, false);
      }
    });
    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class RecycleTest extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {

    let initToken = 0;
    let removeToken = 0;
    let finishToken = 0;
    let updateToken = 0;

    // component that will be reused by another object when removed from the first one
    let recyclableComponent = new GenericComponent('recyclable')
    .setFrequency(1) // 1x per second
    .doOnInit(() => initToken++)
    .doOnRemove(() => removeToken++)
    .doOnFinish(() => finishToken++)
    .doOnUpdate(() => updateToken++);

    // add object 1
    let gfx = new Graphics('');
    gfx.beginFill(0xFFFF00);
    gfx.drawCircle(0, 0, 100);
    gfx.position.set(WIDTH/2, HEIGHT/2);
    gfx.endFill();
    scene.stage.pixiObj.addChild(gfx);

    // add object 2
    let gfx2 = new Graphics('');
    gfx2.beginFill(0x0000FF);
    gfx2.drawRect(0, 0, 50, 50);
    gfx2.pivot.set(25, 25);
    gfx2.position.set(WIDTH/2, HEIGHT/2);
    gfx2.endFill();
    scene.stage.pixiObj.addChild(gfx2);

    gfx.addComponent(recyclableComponent);

    scene.invokeWithDelay(1200, () => {
      gfx.removeComponent(gfx.findComponentByName('recyclable'));
      gfx2.addComponent(recyclableComponent);

      scene.invokeWithDelay(1200, () => {
        let success = initToken === 2 && removeToken === 1 && finishToken === 1 && updateToken === 3;
        if(success) {
          onFinish('RecycleTest', 'OK', true);
        } else {
          onFinish('RecycleTest', 'FAILURE, wrong token value: ' + initToken + ':' + removeToken + ':' + finishToken + ':' + updateToken, false);
        }
      });
    });
    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class FinishedComponentMessageTest extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {

    let token = 0;

    // component that will be reused by another object when removed from the first one
    let recyclableComponent = new GenericComponent('recyclable')
    .doOnMessage('TOKEN_MSG', () => token++);

    // add object
    let container = new Container('');
    scene.stage.pixiObj.addChild(container);
    container.addComponent(recyclableComponent);

    scene.invokeWithDelay(100, () => { // wait 100s and send the first message
      scene.sendMessage(new Message('TOKEN_MSG'));
      recyclableComponent.removeWhenFinished = false;
      recyclableComponent.finish(); // finish the component but not remove from the game

      scene.invokeWithDelay(200, () => {
        scene.sendMessage(new Message('TOKEN_MSG')); // send another message -> should be captured and token should be increased
        let success = token === 2;
        if(success) {
          onFinish('Finished component test', 'OK', true);
        } else {
          onFinish('Finished component test', 'FAILURE, wrong token value: ' + token, false);
        }
      });
    });
    this.loop(scene, ticker);
  }
}

class ComponentTests {
  app: PIXI.Application = null;
  lastTime = 0;
  gameTime = 0;
  scene: Scene = null;
  ticker: PIXI.Ticker = null;
  infoTable: HTMLElement;

  tests = [
    new RotationTest(),
    new FlagTest(),
    new TagSearchTest(),
    new TagSearchTest2(),
    new StateSearchTest(),
    new StateSearchTest2(),
    new FlagSearchTest(),
    new ComponentUpdateTest(),
    new ChainComponentTest(),
    new ChainComponentTest2(),
    new ChainComponentTest3(),
    new ChainComponentTest4(),
    new ChainComponentConditionalTest(),
    new BuilderTest(),
    new BuilderTest2(),
    new GenericComponentTest(),
    new GenericComponentTest2(),
    new GenericComponentConditionalTest(),
    new FrequencyTest(),
    new FrequencyTest2(),
    new FrequencyTest3(),
    new MessageNotifyTest(),
    new MessageNotifyTest2(),
    new RecycleTest(),
    new FinishedComponentMessageTest()
  ];


  constructor() {
    this.app = new PIXI.Application({
      width: WIDTH,
      height: HEIGHT,
      view: (document.getElementsByTagName('canvas')[0] as HTMLCanvasElement),
    });

    this.infoTable = document.getElementById('info');
    if (!this.infoTable) {
      this.infoTable = document.createElement('table');
      let tr = document.createElement('tr');
      tr.innerHTML = '<th>TEST</<th><th>RESULT</th>';
      this.infoTable.appendChild(tr);
      document.getElementsByTagName('body')[0].appendChild(this.infoTable);
    }

    this.scene = new Scene('default', this.app);
    this.ticker = this.app.ticker;
    this.ticker.autoStart = false;
    this.ticker.stop();
    this.runTests(0);
  }

  private runTests(currentIndex: number) {
    let currentTest = this.tests[currentIndex];
    currentTest.beforeTest(this.scene);
    try {
      let currentIndexTemp = currentIndex;
      this.logPending(currentTest.constructor.name);
      currentTest.executeTest(this.scene, this.ticker, (test: string, result: string, success: boolean) => {
        if (currentIndexTemp !== currentIndex) {
          this.logResult(test, 'ERROR! CALLBACK INVOKED MORE THAN ONCE', false);
          return;
        }
        this.logResult(test, result, success);
        currentTest.afterTest(this.scene);
        if ((currentIndex + 1) < this.tests.length) {
          this.runTests(currentIndex + 1);
        } else {
          currentIndex = 0;
        }
      });
    } catch (error) {
      console.log(error.stack);
      this.logResult(currentTest.constructor.name, error, false);
      if ((currentIndex + 1) < this.tests.length) {
        this.runTests(currentIndex + 1);
      } else {
        currentIndex = 0;
      }
    }
  }

  private logPending(test: string) {
    let tr = document.createElement('tr');
    tr.innerHTML = `<td>${test}</td><td>PENDING</td>`;
    this.infoTable.appendChild(tr);
  }

  private logResult(test: string, result: string, success: boolean) {
    let tr = document.createElement('tr');
    tr.innerHTML = `<td>${test}</td><td class="${success ? 'success' : 'failure'}">${result}</td>`;
    this.infoTable.lastChild.remove();
    this.infoTable.appendChild(tr);
  }
}

export default new ComponentTests();