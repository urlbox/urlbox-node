export type RenderOptions = UrlOptions | HtmlOptions;

type UrlOptions = CommonOptions & {
  url: string;
  html?: never;
};

type HtmlOptions = CommonOptions & {
  html: string;
  url?: never;
};

type CommonOptions = Partial<{
  full_page: boolean;

  format: (typeof formats)[number];
  pdf_page_size: (typeof pdfPageSize)[number];
  pdf_orientation: (typeof pdfOrientationEnum)[number];
  wait_until: (typeof waitUntil)[number];
  media: (typeof mediaOptionsEnum)[number];
  pdf_margin: (typeof pdfMarginEnum)[number];
  s3_storageclass: (typeof storageClasses)[number];
  color_profile: (typeof colorProfiles)[number];

  full_width: boolean;
  disable_animations: boolean;
  force: boolean;
  retina: boolean;
  disable_js: boolean;
  freeze_fixed: boolean;
  flash: boolean;
  pdf_background: boolean;
  transparent: boolean;
  hide_cookie_banners: boolean;
  block_ads: boolean;
  block_images: boolean;
  block_scripts: boolean;
  block_frames: boolean;
  block_fonts: boolean;
  block_medias: boolean;
  block_styles: boolean;
  block_fetch: boolean;
  block_xhr: boolean;
  block_sockets: boolean;
  block_manifests: boolean;
  block_other: boolean;
  block_pings: boolean;
  click_accept: boolean;
  accept_cookies: boolean;
  skip_scroll: boolean;
  fail_on_4xx: boolean;
  fail_on_5xx: boolean;
  fail_if_selector_missing: boolean;
  fail_if_selector_present: boolean;
  fail_if_captcha: boolean;
  save_html: boolean;
  metadata: boolean;
  save_metadata: boolean;
  save_markdown: boolean;
  kill_popups: boolean;
  lazyload: boolean;
  sharp_stitch: boolean;
  allow_infinite: boolean;
  detect_full_height: boolean;
  allow_coin: boolean;
  solve_captchas: boolean;
  show_sections: boolean;
  show_seams: boolean;
  watermark: boolean;
  pdf_fit_to_page: boolean;
  use_s3: boolean;
  s3_force_path_style: boolean;
  use_tailwind: boolean;
  use_chrome: boolean;
  use_chromium: boolean;
  no_upload: boolean;
  from_html: boolean;
  fix_full_height: boolean;
  skip_final_delay: boolean;
  turbo: boolean;
  full_html: boolean;
  save_mhtml: boolean;
  skip_webhooks: boolean;
  dark_mode: boolean;
  reduced_motion: boolean;
  gpu: boolean;
  json: boolean;
  lightweight: boolean;
  press_escape: boolean;
  fragment: boolean;
  display_p3: boolean;
  rec2020: boolean;
  scrgb_linear: boolean;
  hdr10: boolean;
  readable: boolean;
  retry_on_nav_error: boolean;
  continue_on_nav_error: boolean;
  s3_private_bucket: boolean;
  disable_web_security: boolean;

  unique: string;
  user_agent: string;
  wrap: string;
  bg_color: string;
  hide_selector: string;
  hide_selector_x: string;
  highlight: string;
  highlightfg: string;
  highlightbg: string;
  selector: string;
  css: string;
  js: string;
  s3_key: string;
  s3_secret: string;
  s3_bucket: string;
  s3_path: string;
  s3_region: string;
  s3_endpoint: string;
  s3_presigned_url: string;

  cdn_host: string;
  wait_for: string;
  wait_for_x: string;
  wait_to_leave: string;
  wait_to_leave_x: string;
  webhook_url: string;
  base_url: string;
  width_from: string;
  height_from: string;
  blend_mode: string;
  proxy: string;
  clip: string;
  tz: string;
  custom_data_variable: string;
  pdf_header: string;
  pdf_footer: string;
  pdf_page_range: string;
  img_pad: string;
  full_page_mode: (typeof fullPageMode)[number];

  quality: number;
  delay: number;
  timeout: number;
  scroll_delay: number;
  scroll_to: string | number;
  scroll_to_x: string | number;
  width: number;
  height: number;
  thumb_width: number;
  thumb_height: number;

  crop_width: number;
  max_height: number;
  max_width: number;
  max_section_height: number;
  max_section_width: number;
  max_sections: number;
  max_xsections: number;
  max_scroll_page_time: number;
  ttl: number;
  wait_timeout: number;
  redirect_after: number;
  scroll_increment: number;
  pdf_page_width: number;
  pdf_page_height: number;
  pdf_scale: number;
  pdf_dpi: number;
  pdf_margin_top: number;
  pdf_margin_bottom: number;
  pdf_margin_left: number;
  pdf_margin_right: number;
  longitude: number;
  latitude: number;
  accuracy: number;

  header: string | string[];
  cookie: string | string[];
  click: string | string[];
  click_all: string | string[];
  click_x: string | string[];
  click_all_x: string | string[];
  hover: string | string[];
  hover_x: string | string[];
  block_urls: string | string[];

  video_width: number;
  video_height: number;
  video_quality: number;
  video_preset: (typeof videoPresets)[number];
  video_bitrate: number;
  video_bits_per_second: number;
  video_time: number;
  video_aspect: number;
  video_fps: number;
  video_ease: (typeof easingFunctions)[number];
  video_ease_end: (typeof easingFunctions)[number];
  video_prescroll_duration: number;
  video_scroll_duration: number;
  video_rest_duration: number;
  video_scroll_back_duration: number;
  video_postscroll_duration: number;
  video_scroll_distance: number;
  video_scroll: boolean;
  video_chrome_height: number;
  video_crop_w: number;
  video_jitter: number;
}>;

const formats = [
  "png",
  "jpg",
  "jpeg",
  "pdf",
  "avif",
  "mp4",
  "webm",
  "webp",
  "html",
  "mhtml",
  "svg",
  "md",
] as const;

const pdfPageSize = [
  "a4",
  "a0",
  "a1",
  "a2",
  "a3",
  "a4",
  "a5",
  "a6",
  "legal",
  "ledger",
  "letter",
  "tabloid",
] as const;

const pdfOrientation = ["portrait", "landscape"] as const;

const storageClasses = [
  "standard",
  "reduced_redundancy",
  "standard_ia",
  "onezone_ia",
  "intelligent_tiering",
  "glacier",
  "deep_archive",
  "outposts",
] as const;

const colorProfiles = [
  "default",
  "srgb",
  "dp3",
  "rec2020",
  "scrgblinear",
  "hdr10",
  "colorspingamma24",
] as const;

const waitUntil = [
  "domloaded",
  "mostrequestsfinished",
  "requestsfinished",
  "loaded",
] as const;

const pdfOrientationEnum = ["portrait", "landscape"] as const;

const pdfMarginEnum = ["default", "none", "minimum"] as const;

const mediaOptionsEnum = ["print", "screen"] as const;
const fullPageMode = ["stitch", "native"] as const;
const videoPresets = [
  "ultrafast",
  "superfast",
  "veryfast",
  "faster",
  "fast",
  "medium",
  "slow",
  "slower",
  "veryslow",
] as const;

const easingFunctions = [
  "linear.none",
  "linear.in",
  "linear.out",
  "linear.inout",
  "quadratic.in",
  "quadratic.out",
  "quadratic.inout",
  "cubic.in",
  "cubic.out",
  "cubic.inout",
  "quartic.in",
  "quartic.out",
  "quartic.inout",
  "quintic.in",
  "quintic.out",
  "quintic.inout",
  "sinusoidal.in",
  "sinusoidal.out",
  "sinusoidal.inout",
  "exponential.in",
  "exponential.out",
  "exponential.inout",
  "circular.in",
  "circular.out",
  "circular.inout",
  "elastic.in",
  "elastic.out",
  "elastic.inout",
  "back.in",
  "back.out",
  "back.inout",
  "bounce.in",
  "bounce.out",
  "bounce.inout",
] as const;
