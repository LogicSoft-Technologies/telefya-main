"use client";

import { FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision";

export type BlurIntensity = "light" | "medium" | "strong";

export type VirtualBackground =
  | { type: "none" }
  | { type: "blur"; intensity?: BlurIntensity }
  | { type: "image"; url: string };

export type VirtualBackgroundFailureReason =
  | "unsupported"
  | "model-load-failed"
  | "image-load-failed"
  | "video-init-failed"
  | "runtime-failed"
  | "camera-ended";

export class VirtualBackgroundError extends Error {
  reason: VirtualBackgroundFailureReason;

  constructor(
    reason: VirtualBackgroundFailureReason,
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = "VirtualBackgroundError";
    this.reason = reason;

    if (cause) {
      this.cause = cause as Error;
    }
  }
}

export type VirtualBackgroundEngineStatus =
  | "idle"
  | "loading"
  | "active"
  | "error";

type ConfidenceMask = {
  width: number;
  height: number;
  getAsFloat32Array: () => Float32Array;
  close: () => void;
};

type SegmentResult = {
  confidenceMasks?: ConfidenceMask[];
};

export type VirtualBackgroundImageAdjustments = {

  brightness?: number;
  contrast?: number;
  saturate?: number;
};

const WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

const MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";

const TARGET_FPS = 15;
const MAX_CONSECUTIVE_FAILURES = 12;

const EDGE_LOW = 0.3;
const EDGE_HIGH = 0.6;

const TEMPORAL_BLEND = 0.35;

const BLUR_INTENSITY_PX: Record<BlurIntensity, number> = {
  light: 8,
  medium: 18,
  strong: 32,
};

const DEFAULT_IMAGE_ADJUSTMENTS: Required<VirtualBackgroundImageAdjustments> = {
  brightness: 1.08,
  contrast: 1.04,
  saturate: 1.05,
};

let segmenterPromise: Promise<ImageSegmenter> | null = null;

export function isVirtualBackgroundSupported() {
  if (typeof document === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");

    return Boolean(
      typeof canvas.captureStream === "function" &&
        canvas.getContext("2d") &&
        typeof WebAssembly !== "undefined",
    );
  } catch {
    return false;
  }
}

async function createSegmenter(delegate: "GPU" | "CPU") {
  const vision = await FilesetResolver.forVisionTasks(WASM_PATH);

  return ImageSegmenter.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_ASSET_PATH,
      delegate,
    },
    runningMode: "VIDEO",
    outputCategoryMask: false,
    outputConfidenceMasks: true,
  });
}

async function loadSegmenter() {
  try {
    return await createSegmenter("GPU");
  } catch {
    return createSegmenter("CPU");
  }
}

function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = loadSegmenter().catch((error) => {
      segmenterPromise = null;

      throw new VirtualBackgroundError(
        "model-load-failed",
        "Unable to load the virtual background model.",
        error,
      );
    });
  }

  return segmenterPromise;
}

export function disposeVirtualBackgroundModel() {
  void segmenterPromise?.then((segmenter) => segmenter.close());
  segmenterPromise = null;
}

function waitForVideo(video: HTMLVideoElement) {
  return new Promise<void>((resolve, reject) => {
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      resolve();
      return;
    }

    const cleanup = () => {
      video.removeEventListener("loadedmetadata", handleLoaded);
      video.removeEventListener("error", handleError);
    };

    const handleLoaded = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();

      reject(
        new VirtualBackgroundError(
          "video-init-failed",
          "Unable to prepare camera video.",
        ),
      );
    };

    video.addEventListener("loadedmetadata", handleLoaded, { once: true });
    video.addEventListener("error", handleError, { once: true });
  });
}

function segmentForVideo(
  segmenter: ImageSegmenter,
  video: HTMLVideoElement,
  timestampMs: number,
) {
  return new Promise<SegmentResult>((resolve) => {
    segmenter.segmentForVideo(video, timestampMs, (result) => {
      resolve(result as unknown as SegmentResult);
    });
  });
}

const imageCache = new Map<string, Promise<HTMLImageElement>>();

function loadBackgroundImage(url: string) {
  const cached = imageCache.get(url);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);

    image.onerror = (error) => {
      imageCache.delete(url);

      reject(
        new VirtualBackgroundError(
          "image-load-failed",
          "Unable to load this background image. The image host must allow CORS.",
          error,
        ),
      );
    };

    image.src = url;
  });

  imageCache.set(url, promise);
  return promise;
}

function drawCover(
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
) {
  const scale = Math.max(
    targetWidth / sourceWidth,
    targetHeight / sourceHeight,
  );

  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  const x = (targetWidth - width) / 2;
  const y = (targetHeight - height) / 2;

  context.drawImage(source, x, y, width, height);
}

function backgroundsEqual(a: VirtualBackground, b: VirtualBackground) {
  if (a.type !== b.type) return false;
  if (a.type === "image" && b.type === "image") return a.url === b.url;
  if (a.type === "blur" && b.type === "blur") {
    return (a.intensity ?? "medium") === (b.intensity ?? "medium");
  }
  return true;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export type VirtualBackgroundEngineOptions = {
  targetFps?: number;
  imageAdjustments?: VirtualBackgroundImageAdjustments;

  onStatusChange?: (status: VirtualBackgroundEngineStatus) => void;

  onFailure?: (error: VirtualBackgroundError) => void;
};

export class VirtualBackgroundEngine {
  private readonly sourceStream: MediaStream;
  private readonly options: VirtualBackgroundEngineOptions;
  private readonly targetFps: number;
  private readonly videoFilter: string;

  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private foregroundCanvas: HTMLCanvasElement | null = null;
  private maskCanvas: HTMLCanvasElement | null = null;
  private nativeMaskCanvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;

  private width = 640;
  private height = 480;

  private _outputStream: MediaStream | null = null;
  private _outputTrack: MediaStreamTrack | null = null;

  private background: VirtualBackground = { type: "none" };
  private backgroundImage: HTMLImageElement | null = null;
  private segmenter: ImageSegmenter | null = null;
  private segmenterLoading: Promise<void> | null = null;

  private previousAlpha: Float32Array | null = null;
  private hasPreviousAlpha = false;

  private backgroundGeneration = 0;
  private started = false;
  private running = false;
  private rendering = false;
  private animationFrame = 0;
  private failures = 0;
  private failureReported = false;
  private lastInferenceAt = 0;
  private lastTimestamp = -1;

  private status: VirtualBackgroundEngineStatus = "idle";

  constructor(sourceStream: MediaStream, options: VirtualBackgroundEngineOptions = {}) {
    this.sourceStream = sourceStream;
    this.options = options;
    this.targetFps = options.targetFps ?? TARGET_FPS;

    const adjustments = {
      ...DEFAULT_IMAGE_ADJUSTMENTS,
      ...options.imageAdjustments,
    };

    this.videoFilter = `brightness(${adjustments.brightness}) contrast(${adjustments.contrast}) saturate(${adjustments.saturate})`;
  }

  get outputStream() {
    return this._outputStream;
  }

  get outputTrack() {
    return this._outputTrack;
  }

  get currentBackground() {
    return this.background;
  }

  private setStatus(status: VirtualBackgroundEngineStatus) {
    if (this.status === status) return;
    this.status = status;
    this.options.onStatusChange?.(status);
  }

  private reportFailure(error: unknown) {
    if (this.failureReported) return;
    this.failureReported = true;

    const failure =
      error instanceof VirtualBackgroundError
        ? error
        : new VirtualBackgroundError(
            "runtime-failed",
            "Virtual background processing stopped unexpectedly.",
            error,
          );

    this.setStatus("error");
    this.options.onFailure?.(failure);
  }

  private resetTemporalSmoothing() {
    this.previousAlpha = null;
    this.hasPreviousAlpha = false;
  }

  async start(): Promise<MediaStream> {
    if (this.started) {
      if (!this._outputStream) {
        throw new VirtualBackgroundError(
          "runtime-failed",
          "Engine failed to initialize previously.",
        );
      }
      return this._outputStream;
    }

    this.started = true;

    if (!isVirtualBackgroundSupported()) {
      throw new VirtualBackgroundError(
        "unsupported",
        "Virtual backgrounds are not supported in this browser.",
      );
    }

    const sourceVideoTrack = this.sourceStream.getVideoTracks()[0];

    if (!sourceVideoTrack || sourceVideoTrack.readyState !== "live") {
      throw new VirtualBackgroundError(
        "video-init-failed",
        "No active camera video track is available.",
      );
    }

    const video = document.createElement("video");
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.disablePictureInPicture = true;
    video.srcObject = this.sourceStream;

    video.style.position = "fixed";
    video.style.left = "-10000px";
    video.style.top = "0";
    video.style.width = "1px";
    video.style.height = "1px";
    video.style.pointerEvents = "none";

    document.body.appendChild(video);
    this.video = video;

    try {
      await waitForVideo(video);
      await video.play();
    } catch (error) {
      this.teardownDom();

      throw error instanceof VirtualBackgroundError
        ? error
        : new VirtualBackgroundError(
            "video-init-failed",
            "Unable to start camera processing.",
            error,
          );
    }

    this.width = video.videoWidth || 640;
    this.height = video.videoHeight || 480;

    const canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;

    const context = canvas.getContext("2d");

    if (!context) {
      this.teardownDom();

      throw new VirtualBackgroundError(
        "runtime-failed",
        "Canvas rendering is unavailable in this browser.",
      );
    }

    this.canvas = canvas;
    this.context = context;
    this.foregroundCanvas = document.createElement("canvas");
    this.maskCanvas = document.createElement("canvas");
    this.nativeMaskCanvas = document.createElement("canvas");

    context.filter = this.videoFilter;
    context.drawImage(video, 0, 0, this.width, this.height);
    context.filter = "none";

    const outputVideoTrack = canvas
      .captureStream(this.targetFps)
      .getVideoTracks()[0];

    if (!outputVideoTrack) {
      this.teardownDom();

      throw new VirtualBackgroundError(
        "runtime-failed",
        "This browser cannot create a processed video stream.",
      );
    }

    this._outputTrack = outputVideoTrack;
    this._outputStream = new MediaStream([
      outputVideoTrack,
      ...this.sourceStream.getAudioTracks(),
    ]);

    sourceVideoTrack.addEventListener("ended", this.handleSourceEnded);

    this.running = true;
    this.animationFrame = requestAnimationFrame(this.renderLoop);
    this.setStatus("active");

    return this._outputStream;
  }

  async setBackground(background: VirtualBackground): Promise<void> {
    if (!this.started) {
      throw new VirtualBackgroundError(
        "runtime-failed",
        "Engine has not been started yet.",
      );
    }

    if (backgroundsEqual(background, this.background)) return;

    const generation = ++this.backgroundGeneration;
    this.failureReported = false;

    if (background.type === "none") {
      this.background = background;
      this.backgroundImage = null;
      this.resetTemporalSmoothing();
      this.setStatus("active");
      return;
    }

    const needsImage = background.type === "image";
    this.setStatus("loading");

    let nextImage: HTMLImageElement | null = null;

    try {
      if (needsImage) {
        nextImage = await loadBackgroundImage(
          (background as { type: "image"; url: string }).url,
        );
      }

      if (!this.segmenter) {
        await this.ensureSegmenter();
      }
    } catch (error) {
      if (generation === this.backgroundGeneration) {
        this.setStatus("error");
        this.options.onFailure?.(
          error instanceof VirtualBackgroundError
            ? error
            : new VirtualBackgroundError(
                "runtime-failed",
                "Unable to apply the selected background.",
                error,
              ),
        );
      }
      return;
    }

    if (generation !== this.backgroundGeneration) return;

    this.background = background;
    this.backgroundImage = nextImage;
    this.failures = 0;
    this.resetTemporalSmoothing();
    this.setStatus("active");
  }

  private async ensureSegmenter() {
    if (this.segmenter) return;

    if (!this.segmenterLoading) {
      this.segmenterLoading = getSegmenter().then((segmenter) => {
        this.segmenter = segmenter;
      });
    }

    await this.segmenterLoading;
  }

  private handleSourceEnded = () => {
    this.reportFailure(
      new VirtualBackgroundError("camera-ended", "Camera video ended."),
    );
  };

  private renderLoop = async () => {
    if (!this.running) return;

    const { video, context, canvas } = this;

    if (!video || !context || !canvas) {
      this.animationFrame = requestAnimationFrame(this.renderLoop);
      return;
    }

    const now = performance.now();

    if (
      this.rendering ||
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      now - this.lastInferenceAt < 1000 / this.targetFps
    ) {
      this.animationFrame = requestAnimationFrame(this.renderLoop);
      return;
    }

    this.rendering = true;
    this.lastInferenceAt = now;

    try {
      if (this.background.type === "none" || !this.segmenter) {

        context.clearRect(0, 0, this.width, this.height);
        context.filter = this.videoFilter;
        context.drawImage(video, 0, 0, this.width, this.height);
        context.filter = "none";
      } else {
        let timestamp = now;
        if (timestamp <= this.lastTimestamp) {
          timestamp = this.lastTimestamp + 1;
        }
        this.lastTimestamp = timestamp;

        const result = await segmentForVideo(this.segmenter, video, timestamp);
        const mask = result.confidenceMasks?.[0];

        if (!mask) {
          throw new VirtualBackgroundError(
            "runtime-failed",
            "The segmentation model did not return a mask.",
          );
        }

        const maskWidth = mask.width;
        const maskHeight = mask.height;
        const maskSize = maskWidth * maskHeight;

        let confidenceValues: Float32Array;
        try {
          confidenceValues = mask.getAsFloat32Array();
        } finally {
          mask.close();
        }

        if (!this.previousAlpha || this.previousAlpha.length !== maskSize) {
          this.previousAlpha = new Float32Array(maskSize);
          this.hasPreviousAlpha = false;
        }

        const alphaMask = new ImageData(maskWidth, maskHeight);
        const previousAlpha = this.previousAlpha;

        for (let index = 0; index < maskSize; index += 1) {
          let value = smoothstep(EDGE_LOW, EDGE_HIGH, confidenceValues[index]);

          if (this.hasPreviousAlpha) {
            value =
              previousAlpha[index] * TEMPORAL_BLEND +
              value * (1 - TEMPORAL_BLEND);
          }

          previousAlpha[index] = value;

          const offset = index * 4;
          alphaMask.data[offset] = 255;
          alphaMask.data[offset + 1] = 255;
          alphaMask.data[offset + 2] = 255;
          alphaMask.data[offset + 3] = Math.round(value * 255);
        }

        this.hasPreviousAlpha = true;

        context.clearRect(0, 0, this.width, this.height);

        if (this.background.type === "blur") {
          const blurPx = BLUR_INTENSITY_PX[this.background.intensity ?? "medium"];
          context.save();
          context.filter = `${this.videoFilter} blur(${blurPx}px)`;
          context.drawImage(video, 0, 0, this.width, this.height);
          context.restore();
        } else if (this.backgroundImage) {
          drawCover(
            context,
            this.backgroundImage,
            this.backgroundImage.naturalWidth,
            this.backgroundImage.naturalHeight,
            this.width,
            this.height,
          );
        }

        this.drawForeground(alphaMask);
      }

      this.failures = 0;
    } catch (error) {
      this.failures += 1;

      if (this.failures >= MAX_CONSECUTIVE_FAILURES) {

        this.background = { type: "none" };
        this.backgroundImage = null;
        this.failures = 0;
        this.resetTemporalSmoothing();
        this.reportFailure(error);
      }
    } finally {
      this.rendering = false;

      if (this.running) {
        this.animationFrame = requestAnimationFrame(this.renderLoop);
      }
    }
  };

  private drawForeground(alphaMask: ImageData) {
    const { video, context, foregroundCanvas, maskCanvas, nativeMaskCanvas } =
      this;

    if (!video || !context || !foregroundCanvas || !maskCanvas || !nativeMaskCanvas) {
      return;
    }

    const foregroundContext = foregroundCanvas.getContext("2d");
    const maskContext = maskCanvas.getContext("2d");
    const nativeMaskContext = nativeMaskCanvas.getContext("2d");

    if (!foregroundContext || !maskContext || !nativeMaskContext) {
      throw new VirtualBackgroundError(
        "runtime-failed",
        "Canvas rendering is unavailable in this browser.",
      );
    }

    foregroundCanvas.width = this.width;
    foregroundCanvas.height = this.height;
    maskCanvas.width = this.width;
    maskCanvas.height = this.height;

    nativeMaskCanvas.width = alphaMask.width;
    nativeMaskCanvas.height = alphaMask.height;

    nativeMaskContext.putImageData(alphaMask, 0, 0);

    maskContext.clearRect(0, 0, this.width, this.height);
    maskContext.save();
    maskContext.imageSmoothingEnabled = true;
    maskContext.imageSmoothingQuality = "high";
    maskContext.filter = "blur(1px)";
    maskContext.drawImage(nativeMaskCanvas, 0, 0, this.width, this.height);
    maskContext.restore();

    foregroundContext.clearRect(0, 0, this.width, this.height);
    foregroundContext.filter = this.videoFilter;
    foregroundContext.drawImage(video, 0, 0, this.width, this.height);
    foregroundContext.filter = "none";

    foregroundContext.globalCompositeOperation = "destination-in";
    foregroundContext.drawImage(maskCanvas, 0, 0, this.width, this.height);
    foregroundContext.globalCompositeOperation = "source-over";

    context.drawImage(foregroundCanvas, 0, 0, this.width, this.height);
  }

  private teardownDom() {
    this.video?.pause();
    if (this.video) this.video.srcObject = null;
    this.video?.remove();
    this.video = null;
    this.canvas = null;
    this.foregroundCanvas = null;
    this.maskCanvas = null;
    this.nativeMaskCanvas = null;
    this.context = null;
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.animationFrame);

    const sourceVideoTrack = this.sourceStream.getVideoTracks()[0];
    sourceVideoTrack?.removeEventListener("ended", this.handleSourceEnded);

    this._outputTrack?.stop();
    this._outputTrack = null;
    this._outputStream = null;

    this.resetTemporalSmoothing();
    this.teardownDom();
    this.started = false;
  }
}