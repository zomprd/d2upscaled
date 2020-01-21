import { ObjectDataParser } from './object-data-parser';
import { TimelineType, BinaryOffset, AnimationBlendType } from '../core/dragonbones';
import { TimelineData, AnimationData, AnimationTimelineData } from '../model/animation-data';
import { BaseObject } from '../core/base-object';
import { DataParser } from './data-parser';
import { GeometryData, WeightData } from '../model/display-data';
import { DragonBonesData } from '../model/dragonbones-data';

/**
 * @private
 */
export class BinaryDataParser extends ObjectDataParser {
  /**
   * - Deprecated, please refer to {@link dragonBones.BaseFactory#parseDragonBonesData()}.
   * @deprecated
   * @language en_US
   */
  /**
   * - 已废弃，请参考 {@link dragonBones.BaseFactory#parseDragonBonesData()}。
   * @deprecated
   * @language zh_CN
   */
  public static getInstance(): BinaryDataParser {
    if (BinaryDataParser._binaryDataParserInstance === null) {
      BinaryDataParser._binaryDataParserInstance = new BinaryDataParser();
    }

    return BinaryDataParser._binaryDataParserInstance;
  }

  private static _binaryDataParserInstance: BinaryDataParser | null = null;
  private _binaryOffset: number;
  private _binary: ArrayBuffer;
  private _intArrayBuffer: Uint16Array;
  private _frameArrayBuffer: Int16Array;
  private _timelineArrayBuffer: Uint16Array;

  public parseDragonBonesData(rawData: any, scale: number = 1): DragonBonesData | null {
    console.assert(rawData !== null && rawData !== undefined && rawData instanceof ArrayBuffer, 'Data error.');

    const tag = new Uint8Array(rawData, 0, 8);
    if (
      tag[0] !== 'D'.charCodeAt(0) ||
      tag[1] !== 'B'.charCodeAt(0) ||
      tag[2] !== 'D'.charCodeAt(0) ||
      tag[3] !== 'T'.charCodeAt(0)
    ) {
      console.assert(false, 'Nonsupport data.');
      return null;
    }

    const headerLength = new Uint32Array(rawData, 8, 1)[0];
    const headerBytes = new Uint8Array(rawData, 8 + 4, headerLength);
    const headerString = this._decodeUTF8(headerBytes);
    const header = JSON.parse(headerString);
    //
    this._binaryOffset = 8 + 4 + headerLength;
    this._binary = rawData;

    return super.parseDragonBonesData(header, scale);
  }

  protected _parseAnimation(rawData: any): AnimationData {
    const animation = BaseObject.borrowObject(AnimationData);
    animation.blendType = DataParser._getAnimationBlendType(ObjectDataParser._getString(rawData, DataParser.BLEND_TYPE, ''));
    animation.frameCount = ObjectDataParser._getNumber(rawData, DataParser.DURATION, 0);
    animation.playTimes = ObjectDataParser._getNumber(rawData, DataParser.PLAY_TIMES, 1);
    animation.duration = animation.frameCount / this._armature.frameRate; // float
    animation.fadeInTime = ObjectDataParser._getNumber(rawData, DataParser.FADE_IN_TIME, 0.0);
    animation.scale = ObjectDataParser._getNumber(rawData, DataParser.SCALE, 1.0);
    animation.name = ObjectDataParser._getString(rawData, DataParser.NAME, DataParser.DEFAULT_NAME);
    if (animation.name.length === 0) {
      animation.name = DataParser.DEFAULT_NAME;
    }

    // Offsets.
    const offsets = rawData[DataParser.OFFSET] as Array<number>;
    animation.frameIntOffset = offsets[0];
    animation.frameFloatOffset = offsets[1];
    animation.frameOffset = offsets[2];

    this._animation = animation;

    if (DataParser.ACTION in rawData) {
      animation.actionTimeline = this._parseBinaryTimeline(TimelineType.Action, rawData[DataParser.ACTION]);
    }

    if (DataParser.Z_ORDER in rawData) {
      animation.zOrderTimeline = this._parseBinaryTimeline(TimelineType.ZOrder, rawData[DataParser.Z_ORDER]);
    }

    if (DataParser.BONE in rawData) {
      const rawTimeliness = rawData[DataParser.BONE];
      for (let k of Object.keys(rawTimeliness)) {
        const rawTimelines = rawTimeliness[k] as Array<number>;
        const bone = this._armature.getBone(k);
        if (bone === null) {
          continue;
        }

        for (let i = 0, l = rawTimelines.length; i < l; i += 2) {
          const timelineType = rawTimelines[i];
          const timelineOffset = rawTimelines[i + 1];
          const timeline = this._parseBinaryTimeline(timelineType, timelineOffset);
          this._animation.addBoneTimeline(bone.name, timeline);
        }
      }
    }

    if (DataParser.SLOT in rawData) {
      const rawTimeliness = rawData[DataParser.SLOT];
      for (let k of Object.keys(rawTimeliness)) {
        const rawTimelines = rawTimeliness[k] as Array<number>;
        const slot = this._armature.getSlot(k);
        if (slot === null) {
          continue;
        }

        for (let i = 0, l = rawTimelines.length; i < l; i += 2) {
          const timelineType = rawTimelines[i];
          const timelineOffset = rawTimelines[i + 1];
          const timeline = this._parseBinaryTimeline(timelineType, timelineOffset);
          this._animation.addSlotTimeline(slot.name, timeline);
        }
      }
    }

    if (DataParser.CONSTRAINT in rawData) {
      const rawTimeliness = rawData[DataParser.CONSTRAINT];
      for (let k of Object.keys(rawTimeliness)) {
        const rawTimelines = rawTimeliness[k] as Array<number>;
        const constraint = this._armature.getConstraint(k);
        if (constraint === null) {
          continue;
        }

        for (let i = 0, l = rawTimelines.length; i < l; i += 2) {
          const timelineType = rawTimelines[i];
          const timelineOffset = rawTimelines[i + 1];
          const timeline = this._parseBinaryTimeline(timelineType, timelineOffset);
          this._animation.addConstraintTimeline(constraint.name, timeline);
        }
      }
    }

    if (DataParser.TIMELINE in rawData) {
      const rawTimelines = rawData[DataParser.TIMELINE] as Array<any>;
      for (const rawTimeline of rawTimelines) {
        const timelineOffset = ObjectDataParser._getNumber(rawTimeline, DataParser.OFFSET, 0);
        if (timelineOffset >= 0) {
          const timelineType = ObjectDataParser._getNumber(rawTimeline, DataParser.TYPE, TimelineType.Action);
          const timelineName = ObjectDataParser._getString(rawTimeline, DataParser.NAME, '');
          let timeline: TimelineData | null = null;

          if (timelineType === TimelineType.AnimationProgress && animation.blendType !== AnimationBlendType.None) {
            timeline = BaseObject.borrowObject(AnimationTimelineData);
            const animaitonTimeline = timeline as AnimationTimelineData;
            animaitonTimeline.x = ObjectDataParser._getNumber(rawTimeline, DataParser.X, 0.0);
            animaitonTimeline.y = ObjectDataParser._getNumber(rawTimeline, DataParser.Y, 0.0);
          }

          timeline = this._parseBinaryTimeline(timelineType, timelineOffset, timeline);

          switch (timelineType) {
            case TimelineType.Action:
              // TODO
              break;

            case TimelineType.ZOrder:
              // TODO
              break;

            case TimelineType.BoneTranslate:
            case TimelineType.BoneRotate:
            case TimelineType.BoneScale:
            case TimelineType.Surface:
            case TimelineType.BoneAlpha:
              this._animation.addBoneTimeline(timelineName, timeline);
              break;

            case TimelineType.SlotDisplay:
            case TimelineType.SlotColor:
            case TimelineType.SlotDeform:
            case TimelineType.SlotZIndex:
            case TimelineType.SlotAlpha:
              this._animation.addSlotTimeline(timelineName, timeline);
              break;

            case TimelineType.IKConstraint:
              this._animation.addConstraintTimeline(timelineName, timeline);
              break;

            case TimelineType.AnimationProgress:
            case TimelineType.AnimationWeight:
            case TimelineType.AnimationParameter:
              this._animation.addAnimationTimeline(timelineName, timeline);
              break;
          }
        }
      }
    }

    this._animation = null as any;

    return animation;
  }

  protected _parseGeometry(rawData: any, geometry: GeometryData): void {
    geometry.offset = rawData[DataParser.OFFSET];
    geometry.data = this._data;

    const weightOffset = this._intArrayBuffer[geometry.offset + BinaryOffset.GeometryWeightOffset];
    if (weightOffset >= 0) {
      const weight = BaseObject.borrowObject(WeightData);
      const vertexCount = this._intArrayBuffer[geometry.offset + BinaryOffset.GeometryVertexCount];
      const boneCount = this._intArrayBuffer[weightOffset + BinaryOffset.WeigthBoneCount];
      weight.offset = weightOffset;

      for (let i = 0; i < boneCount; ++i) {
        const boneIndex = this._intArrayBuffer[weightOffset + BinaryOffset.WeigthBoneIndices + i];
        weight.addBone(this._rawBones[boneIndex]);
      }

      let boneIndicesOffset = weightOffset + BinaryOffset.WeigthBoneIndices + boneCount;
      let weightCount = 0;
      for (let i = 0, l = vertexCount; i < l; ++i) {
        const vertexBoneCount = this._intArrayBuffer[boneIndicesOffset++];
        weightCount += vertexBoneCount;
        boneIndicesOffset += vertexBoneCount;
      }

      weight.count = weightCount;
      geometry.weight = weight;
    }
  }

  protected _parseArray(rawData: any): void {
    const offsets = rawData[DataParser.OFFSET] as Array<number>;
    const l1 = offsets[1];
    const l2 = offsets[3];
    const l3 = offsets[5];
    const l4 = offsets[7];
    const l5 = offsets[9];
    const l6 = offsets[11];
    const l7 = offsets.length > 12 ? offsets[13] : 0; // Color.
    const intArray = new Uint16Array(this._binary, this._binaryOffset + offsets[0], l1 / Uint16Array.BYTES_PER_ELEMENT);
    const floatArray = new Float32Array(this._binary, this._binaryOffset + offsets[2], l2 / Float32Array.BYTES_PER_ELEMENT);
    const frameIntArray = new Int16Array(this._binary, this._binaryOffset + offsets[4], l3 / Int16Array.BYTES_PER_ELEMENT);
    const frameFloatArray = new Float32Array(this._binary, this._binaryOffset + offsets[6], l4 / Float32Array.BYTES_PER_ELEMENT);
    const frameArray = new Int16Array(this._binary, this._binaryOffset + offsets[8], l5 / Int16Array.BYTES_PER_ELEMENT);
    const timelineArray = new Uint16Array(this._binary, this._binaryOffset + offsets[10], l6 / Uint16Array.BYTES_PER_ELEMENT);
    const colorArray = l7 > 0 ? new Uint16Array(this._binary, this._binaryOffset + offsets[12], l7 / Uint16Array.BYTES_PER_ELEMENT) : intArray; // Color.

    this._data.binary = this._binary;
    this._data.intArray = this._intArrayBuffer = intArray;
    this._data.floatArray = floatArray;
    this._data.frameIntArray = frameIntArray;
    this._data.frameFloatArray = frameFloatArray;
    this._data.frameArray = this._frameArrayBuffer = frameArray;
    this._data.timelineArray = this._timelineArrayBuffer = timelineArray;
    this._data.colorArray = colorArray;
  }

  private _inRange(a: number, min: number, max: number): boolean {
    return min <= a && a <= max;
  }

  private _decodeUTF8(data: Uint8Array): string {
    const EOF_BYTE = -1;
    const EOF_CODE_POINT = -1;
    const FATAL_POINT = 0xFFFD;

    let pos = 0;
    let result = '';
    let codePoint;
    let utf8CodePoint = 0;
    let utf8BytesNeeded = 0;
    let utf8BytesSeen = 0;
    let utf8LowerBoundary = 0;

    while (data.length > pos) {

      let _byte = data[pos++];

      if (_byte === EOF_BYTE) {
        if (utf8BytesNeeded !== 0) {
          codePoint = FATAL_POINT;
        } else {
          codePoint = EOF_CODE_POINT;
        }
      } else {
        if (utf8BytesNeeded === 0) {
          if (this._inRange(_byte, 0x00, 0x7F)) {
            codePoint = _byte;
          } else {
            if (this._inRange(_byte, 0xC2, 0xDF)) {
              utf8BytesNeeded = 1;
              utf8LowerBoundary = 0x80;
              utf8CodePoint = _byte - 0xC0;
            } else if (this._inRange(_byte, 0xE0, 0xEF)) {
              utf8BytesNeeded = 2;
              utf8LowerBoundary = 0x800;
              utf8CodePoint = _byte - 0xE0;
            } else if (this._inRange(_byte, 0xF0, 0xF4)) {
              utf8BytesNeeded = 3;
              utf8LowerBoundary = 0x10000;
              utf8CodePoint = _byte - 0xF0;
            } else {

            }
            utf8CodePoint = utf8CodePoint * Math.pow(64, utf8BytesNeeded);
            codePoint = null;
          }
        } else if (!this._inRange(_byte, 0x80, 0xBF)) {
          utf8CodePoint = 0;
          utf8BytesNeeded = 0;
          utf8BytesSeen = 0;
          utf8LowerBoundary = 0;
          pos--;
          codePoint = _byte;
        } else {

          utf8BytesSeen += 1;
          utf8CodePoint = utf8CodePoint + (_byte - 0x80) * Math.pow(64, utf8BytesNeeded - utf8BytesSeen);

          if (utf8BytesSeen !== utf8BytesNeeded) {
            codePoint = null;
          } else {

            let cp = utf8CodePoint;
            let lowerBoundary = utf8LowerBoundary;
            utf8CodePoint = 0;
            utf8BytesNeeded = 0;
            utf8BytesSeen = 0;
            utf8LowerBoundary = 0;
            if (this._inRange(cp, lowerBoundary, 0x10FFFF) && !this._inRange(cp, 0xD800, 0xDFFF)) {
              codePoint = cp;
            } else {
              codePoint = _byte;
            }
          }

        }
      }
      //Decode string
      if (codePoint !== null && codePoint !== EOF_CODE_POINT) {
        if (codePoint <= 0xFFFF) {
          if (codePoint > 0) { result += String.fromCharCode(codePoint); }
        } else {
          codePoint -= 0x10000;
          result += String.fromCharCode(0xD800 + ((codePoint >> 10) & 0x3ff));
          result += String.fromCharCode(0xDC00 + (codePoint & 0x3ff));
        }
      }
    }

    return result;
  }

  private _parseBinaryTimeline(type: TimelineType, offset: number, timelineData: TimelineData | null = null): TimelineData {
    const timeline = timelineData !== null ? timelineData : BaseObject.borrowObject(TimelineData);
    timeline.type = type;
    timeline.offset = offset;

    this._timeline = timeline;

    const keyFrameCount = this._timelineArrayBuffer[timeline.offset + BinaryOffset.TimelineKeyFrameCount];
    if (keyFrameCount === 1) {
      timeline.frameIndicesOffset = -1;
    } else {
      let frameIndicesOffset = 0;
      const totalFrameCount = this._animation.frameCount + 1; // One more frame than animation.
      const frameIndices = this._data.frameIndices;
      frameIndicesOffset = frameIndices.length;
      frameIndices.length += totalFrameCount;
      timeline.frameIndicesOffset = frameIndicesOffset;

      for (
        let i = 0, iK = 0, frameStart = 0, frameCount = 0;
        i < totalFrameCount;
        ++i
      ) {
        if (frameStart + frameCount <= i && iK < keyFrameCount) {
          frameStart = this._frameArrayBuffer[this._animation.frameOffset + this._timelineArrayBuffer[timeline.offset + BinaryOffset.TimelineFrameOffset + iK]];
          if (iK === keyFrameCount - 1) {
            frameCount = this._animation.frameCount - frameStart;
          } else {
            frameCount = this._frameArrayBuffer[this._animation.frameOffset + this._timelineArrayBuffer[timeline.offset + BinaryOffset.TimelineFrameOffset + iK + 1]] - frameStart;
          }

          iK++;
        }

        frameIndices[frameIndicesOffset + i] = iK - 1;
      }
    }

    this._timeline = null as any; //

    return timeline;
  }
}