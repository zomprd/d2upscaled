import { TextureAtlasData, TextureData } from './model/texture-atlas-data';
import { BaseObject } from './core/base-object';

/**
 * @internal
 */
export class PixiTextureData extends TextureData {
  public static toString(): string {
    return '[class dragonBones.PixiTextureData]';
  }

  public renderTexture: PIXI.Texture | null = null; // Initial value.

  protected _onClear(): void {
    super._onClear();

    if (this.renderTexture !== null) {
      this.renderTexture.destroy(false);
    }

    this.renderTexture = null;
  }
}

/**
 * - The PixiJS texture atlas data.
 * @version DragonBones 3.0
 * @language en_US
 */
/**
 * - PixiJS 贴图集数据。
 * @version DragonBones 3.0
 * @language zh_CN
 */
export class PixiTextureAtlasData extends TextureAtlasData {
  public static toString(): string {
    return '[class dragonBones.PixiTextureAtlasData]';
  }
  /**
   * - The PixiJS texture.
   * @version DragonBones 3.0
   * @language en_US
   */
  /**
   * - PixiJS 贴图。
   * @version DragonBones 3.0
   * @language zh_CN
   */
  public get renderTexture(): PIXI.BaseTexture | null {
    return this._renderTexture;
  }
  public set renderTexture(value: PIXI.BaseTexture | null) {
    if (this._renderTexture === value) {
      return;
    }

    this._renderTexture = value;

    if (this._renderTexture !== null) {
      for (let k of Object.keys(this.textures)) {
        const textureData = this.textures[k] as PixiTextureData;

        textureData.renderTexture = new PIXI.Texture(
          this._renderTexture,
          new PIXI.Rectangle(textureData.region.x, textureData.region.y, textureData.region.width, textureData.region.height),
          new PIXI.Rectangle(textureData.region.x, textureData.region.y, textureData.region.width, textureData.region.height),
          new PIXI.Rectangle(0, 0, textureData.region.width, textureData.region.height),
          textureData.rotated as any // .d.ts bug
        );
      }
    } else {
      for (let k of Object.keys(this.textures)) {
        const textureData = this.textures[k] as PixiTextureData;
        textureData.renderTexture = null;
      }
    }
  }

  private _renderTexture: PIXI.BaseTexture | null = null; // Initial value.
  /**
   * @inheritDoc
   */
  public createTexture(): TextureData {
    return BaseObject.borrowObject(PixiTextureData);
  }

  protected _onClear(): void {
    super._onClear();

    if (this._renderTexture !== null) {
      // this._renderTexture.dispose();
    }

    this._renderTexture = null;
  }
}