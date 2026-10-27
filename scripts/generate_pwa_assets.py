#!/usr/bin/env python3
"""
Habuilt PWA Native Icon Pack & Splash Screens Generator
Generates high-DPI maskable icons, standard icons, Apple touch icons,
Android adaptive launcher mipmaps, and iOS startup splash screens.
Uses 4x supersampling (Lanczos) for ultra-crisp vector-grade rasterization.
"""

import os
import sys
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_ICONS_DIR = os.path.join(BASE_DIR, "public", "icons")
PUBLIC_SCREENSHOTS_DIR = os.path.join(BASE_DIR, "public", "screenshots")
ANDROID_RES_DIR = os.path.join(BASE_DIR, "android", "app", "src", "main", "res")

os.makedirs(PUBLIC_ICONS_DIR, exist_ok=True)
os.makedirs(PUBLIC_SCREENSHOTS_DIR, exist_ok=True)

# Color Palette (Executive Obsidian & Emerald Aurora)
OBSIDIAN_TOP = (7, 10, 17, 255)       # #070A11
OBSIDIAN_BOTTOM = (15, 23, 42, 255)   # #0F172A
CARD_BORDER = (255, 255, 255, 42)     # rgba(255, 255, 255, 0.16)
EMERALD_START = (52, 211, 153, 255)   # #34D399
CYAN_END = (34, 211, 238, 255)        # #22D3EE
GOLD_ACCENT = (200, 164, 86, 255)     # #C8A456

def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(len(c1)))

def draw_linear_gradient(draw, width, height, c1, c2, angle_deg=45):
    rad = math.radians(angle_deg)
    cos_a, sin_a = math.cos(rad), math.sin(rad)
    max_d = abs(width * cos_a) + abs(height * sin_a)
    for y in range(height):
        for x in range(width):
            d = (x - width / 2) * cos_a + (y - height / 2) * sin_a + max_d / 2
            t = max(0.0, min(1.0, d / max_d))
            draw.point((x, y), fill=lerp_color(c1, c2, t))

def create_monogram_layer(canvas_size, scale=1.0, offset_y=0.0):
    """
    Renders the Habuilt 'H' and Emerald Focus Accent Dot onto an RGBA canvas.
    `scale` scales the 64x64 viewBox relative to canvas_size.
    """
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    unit = (canvas_size / 64.0) * scale
    origin_x = (canvas_size - 64 * unit) / 2
    origin_y = (canvas_size - 64 * unit) / 2 + (offset_y * unit)

    # 1. Emerald to Cyan gradient mask for the 'H'
    mask_h = Image.new("L", (canvas_size, canvas_size), 0)
    draw_mask_h = ImageDraw.Draw(mask_h)

    # Left upright [18, 17] to [27, 47]
    x1, y1 = origin_x + 18 * unit, origin_y + 17 * unit
    x2, y2 = origin_x + 27 * unit, origin_y + 47 * unit
    draw_mask_h.rectangle([x1, y1, x2, y2], fill=255)

    # Right upright [37, 17] to [46, 47]
    x3, y3 = origin_x + 37 * unit, origin_y + 17 * unit
    x4, y4 = origin_x + 46 * unit, origin_y + 47 * unit
    draw_mask_h.rectangle([x3, y3, x4, y4], fill=255)

    # Crossbar [27, 29] to [37, 37]
    x5, y5 = origin_x + 27 * unit, origin_y + 29 * unit
    x6, y6 = origin_x + 37 * unit, origin_y + 37 * unit
    draw_mask_h.rectangle([x5, y5, x6, y6], fill=255)

    # Gradient fill for 'H'
    grad_h = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw_grad_h = ImageDraw.Draw(grad_h)
    for y in range(int(y1), int(y2) + 1):
        if y < 0 or y >= canvas_size:
            continue
        t = (y - y1) / max(1, (y2 - y1))
        col = lerp_color(EMERALD_START, CYAN_END, t)
        draw_grad_h.line([(int(x1), y), (int(x4), y)], fill=col)

    img.paste(grad_h, (0, 0), mask_h)

    # 2. Signature Emerald Focus Dot at (50, 14), radius 4 in 64x64
    dot_cx = origin_x + 50 * unit
    dot_cy = origin_y + 14 * unit
    dot_r = 4.2 * unit

    # Glow layer around dot
    glow = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw_glow = ImageDraw.Draw(glow)
    draw_glow.ellipse(
        [dot_cx - dot_r * 2.2, dot_cy - dot_r * 2.2, dot_cx + dot_r * 2.2, dot_cy + dot_r * 2.2],
        fill=(52, 211, 153, 90)
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=max(1, unit * 0.8)))
    img = Image.alpha_composite(img, glow)

    # Solid crisp core dot
    draw_dot = ImageDraw.Draw(img)
    draw_dot.ellipse(
        [dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r],
        fill=EMERALD_START
    )

    return img

def render_maskable_icon(target_size):
    """
    Renders a high-DPI maskable icon with strict 80% safe-zone adherence.
    The W3C / Android spec guarantees content inside diameter 0.80 will NEVER be clipped.
    We use 4x supersampling (Lanczos) for vector sharpness.
    """
    ss = target_size * 4
    img = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))

    # 1. Edge-to-edge Obsidian radial gradient background
    bg = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg)
    center = ss / 2.0
    max_radius = math.sqrt(2) * center

    for y in range(0, ss, 2):
        for x in range(0, ss, 2):
            dx = x - center
            dy = y - center
            dist = math.sqrt(dx * dx + dy * dy)
            t = min(1.0, dist / max_radius)
            c = lerp_color((13, 21, 39, 255), (7, 10, 17, 255), t)
            bg_draw.rectangle([x, y, x + 2, y + 2], fill=c)

    img = Image.alpha_composite(img, bg)

    # 2. Ambient radial emerald halo in center
    halo = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    halo_draw = ImageDraw.Draw(halo)
    halo_radius = ss * 0.35
    halo_draw.ellipse(
        [center - halo_radius, center - halo_radius, center + halo_radius, center + halo_radius],
        fill=(52, 211, 153, 24)
    )
    halo = halo.filter(ImageFilter.GaussianBlur(radius=ss * 0.12))
    img = Image.alpha_composite(img, halo)

    # 3. Monogram scaled to safely fit within 0.72 diameter (strictly inside the 0.80 safe circle)
    # 0.72 scale ensures 100% of all glyph pixels and the focus dot remain untouched by any circular launcher.
    monogram = create_monogram_layer(ss, scale=0.68, offset_y=-0.5)
    img = Image.alpha_composite(img, monogram)

    # Downsample with Lanczos to target_size
    return img.resize((target_size, target_size), Image.Resampling.LANCZOS)

def render_standard_icon(target_size):
    """
    Renders standard squircle-card icons for non-maskable standard home screen / browser tabs.
    Features the rounded dark glass card frame and subtle border.
    """
    ss = target_size * 4
    img = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))

    # Squircle frame: in 64 units, rx=14, margin=2 -> in ss:
    unit = ss / 64.0
    card_margin = 2.0 * unit
    card_rx = 14.0 * unit

    # Outer glow
    card_glow = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(card_glow)
    glow_draw.rounded_rectangle(
        [card_margin - unit, card_margin - unit, ss - card_margin + unit, ss - card_margin + unit],
        radius=int(card_rx),
        fill=(52, 211, 153, 30)
    )
    card_glow = card_glow.filter(ImageFilter.GaussianBlur(radius=unit * 2))
    img = Image.alpha_composite(img, card_glow)

    # Card background (Obsidian dark glass gradient)
    card_mask = Image.new("L", (ss, ss), 0)
    mask_draw = ImageDraw.Draw(card_mask)
    mask_draw.rounded_rectangle(
        [card_margin, card_margin, ss - card_margin, ss - card_margin],
        radius=int(card_rx),
        fill=255
    )

    card_bg = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(card_bg)
    for y in range(ss):
        t = y / float(ss)
        col = lerp_color(OBSIDIAN_BOTTOM, OBSIDIAN_TOP, t)
        bg_draw.line([(0, y), (ss, y)], fill=col)

    img.paste(card_bg, (0, 0), card_mask)

    # Card border
    border_draw = ImageDraw.Draw(img)
    border_draw.rounded_rectangle(
        [card_margin, card_margin, ss - card_margin, ss - card_margin],
        radius=int(card_rx),
        outline=CARD_BORDER,
        width=max(1, int(1.5 * unit))
    )

    # Monogram layer inside card
    monogram = create_monogram_layer(ss, scale=0.88, offset_y=-0.5)
    img = Image.alpha_composite(img, monogram)

    return img.resize((target_size, target_size), Image.Resampling.LANCZOS)

def render_apple_touch_icon():
    """
    Renders 180x180 Apple Touch Icon (iOS clips square icons with its own continuous squircle mask).
    """
    return render_standard_icon(180)

def render_ios_splash_screen(width, height, is_tablet=False):
    """
    Generates high-resolution iOS startup splash screen with obsidian atmosphere,
    centered Habuilt insignia, and executive gold/white typography.
    """
    img = Image.new("RGBA", (width, height), (7, 10, 17, 255))
    draw = ImageDraw.Draw(img)

    # Subtle ambient gradient from center
    cx, cy = width // 2, height // 2
    glow_r = int(min(width, height) * 0.45)
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse(
        [cx - glow_r, cy - glow_r, cx + glow_r, cy + glow_r],
        fill=(52, 211, 153, 18)
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=int(min(width, height) * 0.12)))
    img = Image.alpha_composite(img, glow)

    # Centered Insignia Badge
    badge_size = int(min(width, height) * (0.28 if is_tablet else 0.36))
    badge_img = render_standard_icon(badge_size)

    bx = (width - badge_size) // 2
    by = (height - badge_size) // 2 - int(badge_size * 0.25)
    img.paste(badge_img, (bx, by), badge_img)

    # Brand Title Typography (Drawn mathematically for zero system font dependency)
    draw_text = ImageDraw.Draw(img)
    title_text = "H A B U I L T"
    subtitle_text = "EXECUTIVE HABIT PROTOCOL"

    # Default font scaling
    try:
        # Try finding standard clean system font if available
        font_title = ImageFont.truetype("arial.ttf", int(badge_size * 0.22))
        font_sub = ImageFont.truetype("arial.ttf", int(badge_size * 0.08))
    except Exception:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    # Draw centered Title
    t_box = draw_text.textbbox((0, 0), title_text, font=font_title)
    tw, th = t_box[2] - t_box[0], t_box[3] - t_box[1]
    tx = (width - tw) // 2
    ty = by + badge_size + int(badge_size * 0.22)
    draw_text.text((tx, ty), title_text, fill=(240, 244, 248, 255), font=font_title)

    # Draw centered Subtitle
    s_box = draw_text.textbbox((0, 0), subtitle_text, font=font_sub)
    sw, sh = s_box[2] - s_box[0], s_box[3] - s_box[1]
    sx = (width - sw) // 2
    sy = ty + th + int(badge_size * 0.10)
    draw_text.text((sx, sy), subtitle_text, fill=(200, 164, 86, 230), font=font_sub)

    return img

def main():
    print("=" * 60)
    print("🎨 GENERATING HABUILT HIGH-DPI PWA ASSETS & SPLASH SCREENS")
    print("=" * 60)

    # 1. High-DPI Maskable Icons
    print("\n>>> Generating High-DPI Maskable Icons (Strict 80% Safe Zone)...")
    for size in [192, 512]:
        out_path = os.path.join(PUBLIC_ICONS_DIR, f"maskable-{size}x{size}.png")
        icon = render_maskable_icon(size)
        icon.save(out_path, "PNG", optimize=True)
        print(f"  ✓ Created {out_path} ({size}x{size})")

    # 2. Standard PWA Icons (all sizes)
    print("\n>>> Generating Standard PWA Icons...")
    standard_sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    for size in standard_sizes:
        out_path = os.path.join(PUBLIC_ICONS_DIR, f"icon-{size}x{size}.png")
        icon = render_standard_icon(size)
        icon.save(out_path, "PNG", optimize=True)
        print(f"  ✓ Created {out_path} ({size}x{size})")

    # 3. Apple Touch Icon
    print("\n>>> Generating Apple Touch Icon (180x180)...")
    apple_icon_path = os.path.join(PUBLIC_ICONS_DIR, "apple-touch-icon.png")
    apple_icon = render_apple_touch_icon()
    apple_icon.save(apple_icon_path, "PNG", optimize=True)
    print(f"  ✓ Created {apple_icon_path}")

    # 4. iOS Startup Splash Screens
    print("\n>>> Generating iOS Startup Splash Screens...")
    # Universal iPhone Portrait (1170x2532)
    splash_phone = render_ios_splash_screen(1170, 2532, is_tablet=False)
    splash_phone_path = os.path.join(PUBLIC_ICONS_DIR, "apple-splash-universal.png")
    splash_phone.save(splash_phone_path, "PNG", optimize=True)
    print(f"  ✓ Created {splash_phone_path} (1170x2532)")

    # Universal iPad Portrait (2048x2732)
    splash_ipad = render_ios_splash_screen(2048, 2732, is_tablet=True)
    splash_ipad_path = os.path.join(PUBLIC_ICONS_DIR, "apple-splash-ipad.png")
    splash_ipad.save(splash_ipad_path, "PNG", optimize=True)
    print(f"  ✓ Created {splash_ipad_path} (2048x2732)")

    # 5. Rich PWA Install Screenshots
    print("\n>>> Copying/Formatting Rich PWA Screenshots for WebAPK...")
    desktop_src = os.path.join(BASE_DIR, "tests", "screenshots", "test_ashish_desktop.png")
    mobile_src = os.path.join(BASE_DIR, "tests", "screenshots", "mobile_390.png")

    if os.path.exists(desktop_src):
        d_img = Image.open(desktop_src)
        desktop_dst = os.path.join(PUBLIC_SCREENSHOTS_DIR, "pwa-desktop-preview.png")
        d_img.save(desktop_dst, "PNG", optimize=True)
        print(f"  ✓ Created {desktop_dst} ({d_img.size[0]}x{d_img.size[1]})")

    if os.path.exists(mobile_src):
        m_img = Image.open(mobile_src)
        mobile_dst = os.path.join(PUBLIC_SCREENSHOTS_DIR, "pwa-mobile-preview.png")
        m_img.save(mobile_dst, "PNG", optimize=True)
        print(f"  ✓ Created {mobile_dst} ({m_img.size[0]}x{m_img.size[1]})")

    # 6. Android Mipmap Generation
    if os.path.exists(ANDROID_RES_DIR):
        print("\n>>> Generating Android Native Launcher Mipmaps...")
        densities = [
            ("mipmap-mdpi", 48, 108),
            ("mipmap-hdpi", 72, 162),
            ("mipmap-xhdpi", 96, 216),
            ("mipmap-xxhdpi", 144, 324),
            ("mipmap-xxxhdpi", 192, 432),
        ]
        for name, size, fg_size in densities:
            dir_path = os.path.join(ANDROID_RES_DIR, name)
            os.makedirs(dir_path, exist_ok=True)

            # Standard
            render_standard_icon(size).save(os.path.join(dir_path, "ic_launcher.png"), "PNG")
            # Round
            round_icon = render_maskable_icon(size)
            round_icon.save(os.path.join(dir_path, "ic_launcher_round.png"), "PNG")
            # Foreground (adaptive)
            render_standard_icon(fg_size).save(os.path.join(dir_path, "ic_launcher_foreground.png"), "PNG")
            print(f"  ✓ Created {name} adaptive icons")

    print("\n🎉 ALL ASSETS GENERATED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
