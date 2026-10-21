import type {
  GeneratedRenderOptionFields,
  HtmlInput,
  UrlInput,
} from "./render-options.generated";

type LegacyEasing = "linear.in" | "linear.out" | "linear.inout";

/**
 * Options accepted by earlier releases of this package that the API's option
 * schema no longer lists. They are kept so existing code keeps compiling.
 */
interface LegacyRenderOptionFields {
  /** Passed through to the API as `custom_id`; echoed back on the result. */
  custom_id?: any;
  /** @deprecated No longer part of the render options schema. */
  disable_mql?: boolean;
  /** @deprecated No longer part of the render options schema. */
  disable_resize?: boolean;
  /** @deprecated No longer part of the render options schema. */
  disable_events?: string | string[];
  /** @deprecated No longer part of the render options schema. */
  optimise?: boolean;
  /** @deprecated No longer part of the render options schema. */
  skip_fonts?: boolean;
  /** @deprecated No longer part of the render options schema. */
  referer?: string;
  /** @deprecated No longer part of the render options schema. */
  referrer?: string;
  /** @deprecated No longer part of the render options schema. */
  accept_dialogs?: boolean;
  /** @deprecated No longer part of the render options schema. */
  renderer?: string;
  /** @deprecated No longer part of the render options schema. */
  skip_wait?: boolean | undefined;
  /** @deprecated No longer part of the render options schema. */
  skip_wait_for_modifications?: any;
  /** @deprecated No longer part of the render options schema. */
  skip_wait_for_images?: any;
  /** @deprecated No longer part of the render options schema. */
  watermark_url?: string;
  /** @deprecated No longer part of the render options schema. */
  watermark_width?: string;
  /** @deprecated No longer part of the render options schema. */
  watermark_height?: string;
  /** @deprecated No longer part of the render options schema. */
  watermark_bgcolor?: string;
  /** @deprecated No longer part of the render options schema. */
  watermark_opacity?: number;
  /** @deprecated No longer part of the render options schema. */
  watermark_blend?: string;
  /** @deprecated No longer part of the render options schema. */
  watermark_repeat?: string;
  /** @deprecated No longer part of the render options schema. */
  watermark_position?: string;
  /** @deprecated No longer part of the render options schema. */
  watermark_angle?: string;
  /** @deprecated No longer part of the render options schema. */
  watermark_style?: any;
  /** @deprecated No longer part of the render options schema. */
  srgb?: boolean;
  /** @deprecated No longer part of the render options schema. */
  rgb?: boolean;
  /** @deprecated No longer part of the render options schema. */
  gamma24?: boolean;
  /** @deprecated No longer part of the render options schema. */
  global_timeout?: number;
  video_ease?: GeneratedRenderOptionFields["video_ease"] | LegacyEasing;
  video_ease_end?: GeneratedRenderOptionFields["video_ease_end"] | LegacyEasing;
}

type CommonOptions = Omit<
  GeneratedRenderOptionFields,
  keyof LegacyRenderOptionFields
> &
  LegacyRenderOptionFields;

/** Render options: either `url` or `html` is required, plus any other option. */
export type RenderOptions =
  (CommonOptions & UrlInput) | (CommonOptions & HtmlInput);
