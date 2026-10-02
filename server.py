#!/usr/bin/env python3

import base64
import binascii
import html
import json
import re
import threading
import webbrowser
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote, urlparse


HOST = "127.0.0.1"
PORT = 8766
SITE_ASSET_VERSION = 115
PROJECT_DIR = Path(__file__).resolve().parent
BUILDER_VERSION = 168
MAX_REQUEST_SIZE = 75 * 1024 * 1024
MAX_IMAGE_SIZE = 2 * 1024 * 1024
MAX_GALLERY_IMAGES = 24
MAX_OFFERINGS = 30
MAX_REVIEWS = 12
COMPANY_NAME_MAX_LENGTH = 60
TAGLINE_MAX_LENGTH = 180
DESCRIPTION_MAX_LENGTH = 1000
ABOUT_MAX_LENGTH = 500
YEAR_STARTED_MIN = 1800
PAGE_OPACITY_MIN = 10
PAGE_OPACITY_MAX = 100
ALLOWED_IMAGES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MIME_BY_EXTENSION = {
    extension: mime_type for mime_type, extension in ALLOWED_IMAGES.items()
}
TEMPLATES = {"logo-left", "logo-right", "centered"}
FONTS = {
    "modern": {
        "url": "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@700;800&display=swap",
        "body": '"DM Sans", sans-serif',
        "heading": '"Manrope", sans-serif',
    },
    "clean": {
        "url": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        "body": '"Inter", sans-serif',
        "heading": '"Inter", sans-serif',
    },
    "classic": {
        "url": "https://fonts.googleapis.com/css2?family=Lora:wght@600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap",
        "body": '"Source Sans 3", sans-serif',
        "heading": '"Lora", serif',
    },
}


def clean_text(value, field, required=False, max_length=5000):
    if not isinstance(value, str):
        raise ValueError(f"{field} must be text.")
    value = value.strip()
    if required and not value:
        raise ValueError(f"{field} is required.")
    if len(value) > max_length:
        raise ValueError(f"{field} is too long.")
    return value


def validate_url(value, field, required=False):
    value = clean_text(value, field, required, 2000)
    if not value:
        return ""
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError(f"{field} must be a complete HTTP or HTTPS URL.")
    return value


def is_web3forms_endpoint(value):
    if not value:
        return False
    parsed = urlparse(value)
    return (
        parsed.scheme == "https"
        and parsed.netloc.lower() == "api.web3forms.com"
        and parsed.path.rstrip("/") == "/submit"
    )


def validate_calendly_url(value, required=False):
    value = validate_url(value, "Calendly scheduling URL", required)
    if not value:
        return ""
    host = urlparse(value).netloc.lower().split(":", 1)[0]
    if host not in {"calendly.com", "www.calendly.com"}:
        raise ValueError("Calendly scheduling URL must use calendly.com.")
    return value


def validate_color(value):
    if not isinstance(value, str) or not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
        raise ValueError("Brand color must be a six-digit hex color.")
    return value.lower()


def validate_year(value):
    if value in {None, ""}:
        return ""
    try:
        year = int(value)
    except (TypeError, ValueError) as error:
        raise ValueError("Year started must be a valid year.") from error
    current_year = datetime.now().year
    if year < YEAR_STARTED_MIN or year > current_year:
        raise ValueError(
            f"Year started must be between {YEAR_STARTED_MIN} and {current_year}."
        )
    return year


def adjust_color(hex_color, amount):
    channels = [
        max(0, min(255, int(hex_color[index : index + 2], 16) + amount))
        for index in (1, 3, 5)
    ]
    return "#" + "".join(f"{channel:02x}" for channel in channels)


def contrast_color(hex_color):
    red, green, blue = [
        int(hex_color[index : index + 2], 16) for index in (1, 3, 5)
    ]
    luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255
    return "#172238" if luminance > 0.62 else "#ffffff"


def validate_percentage(value, field):
    try:
        percentage = int(value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"{field} must be a number.") from error
    if percentage < PAGE_OPACITY_MIN or percentage > PAGE_OPACITY_MAX:
        raise ValueError(
            f"{field} must be between {PAGE_OPACITY_MIN} and {PAGE_OPACITY_MAX}."
        )
    return percentage


def rgba_color(hex_color, opacity):
    red, green, blue = [
        int(hex_color[index : index + 2], 16) for index in (1, 3, 5)
    ]
    return f"rgba({red}, {green}, {blue}, {opacity / 100:.2f})"


def blend_colors(foreground, background, opacity):
    foreground_channels = [
        int(foreground[index : index + 2], 16) for index in (1, 3, 5)
    ]
    background_channels = [
        int(background[index : index + 2], 16) for index in (1, 3, 5)
    ]
    ratio = opacity / 100
    channels = [
        round(front * ratio + back * (1 - ratio))
        for front, back in zip(foreground_channels, background_channels)
    ]
    return "#" + "".join(f"{channel:02x}" for channel in channels)


def split_entries(value, field, limit):
    entries = []
    for line_number, line in enumerate(value.splitlines(), start=1):
        line = line.strip()
        if not line:
            continue
        parts = [part.strip() for part in line.split("|", 1)]
        if len(parts) != 2 or not all(parts):
            raise ValueError(
                f'{field} line {line_number} must use "Title | Description".'
            )
        entries.append(tuple(parts))
    if len(entries) > limit:
        raise ValueError(f"{field} supports at most {limit} entries.")
    return entries


def parse_reviews(value, limit=MAX_REVIEWS):
    if isinstance(value, list):
        if len(value) > limit:
            raise ValueError(f"Reviews supports at most {limit} entries.")
        entries = []
        for index, item in enumerate(value, start=1):
            if not isinstance(item, dict):
                raise ValueError(f"Review {index} must be an object.")
            review = clean_text(
                item.get("review", ""), f"Review {index} text", False, 3000
            )
            if not review:
                continue
            date = clean_text(item.get("date", ""), f"Review {index} date", False, 10)
            if date:
                try:
                    datetime.strptime(date, "%Y-%m-%d")
                except ValueError:
                    date = ""
            stars = item.get("stars")
            if stars not in {None, ""}:
                try:
                    stars = int(stars)
                except (TypeError, ValueError):
                    stars = None
                if stars is not None and not 1 <= stars <= 5:
                    stars = None
            else:
                stars = None
            entries.append(
                {
                    "name": clean_text(
                        item.get("name", "") or "Customer",
                        f"Review {index} name",
                        False,
                        180,
                    ),
                    "review": review,
                    "date": date,
                    "stars": stars,
                }
            )
        return entries

    if not isinstance(value, str):
        raise ValueError("Reviews must be a list.")

    entries = []
    for line_number, line in enumerate(value.splitlines(), start=1):
        line = line.strip()
        if not line:
            continue
        parts = [part.strip() for part in line.split("|", 3)]
        if len(parts) == 1:
            name = "Customer"
            review = parts[0]
        else:
            name = parts[0] or "Customer"
            review = parts[1]
        if not review:
            continue
        date = ""
        stars = None
        if len(parts) >= 3 and parts[2]:
            try:
                datetime.strptime(parts[2], "%Y-%m-%d")
                date = parts[2]
            except ValueError:
                date = ""
        if len(parts) == 4 and parts[3]:
            try:
                stars = int(parts[3])
            except ValueError:
                stars = None
            if stars is not None and not 1 <= stars <= 5:
                stars = None
        entries.append(
            {
                "name": clean_text(name, f"Reviews line {line_number} name", False, 180),
                "review": clean_text(
                    review, f"Reviews line {line_number} review", False, 3000
                ),
                "date": date,
                "stars": stars,
            }
        )
    if len(entries) > limit:
        raise ValueError(f"Reviews supports at most {limit} entries.")
    return entries


def render_review_card(review):
    stars = ""
    if review["stars"]:
        rating = review["stars"]
        stars = (
            f'<div class="review-stars" aria-label="{rating} out of 5 stars">'
            f'{"★" * rating}<span aria-hidden="true">{"★" * (5 - rating)}</span></div>'
        )
    date = ""
    if review["date"]:
        display_date = datetime.strptime(review["date"], "%Y-%m-%d").strftime(
            "%b %d, %Y"
        )
        date = (
            f'<time datetime="{html.escape(review["date"], quote=True)}">'
            f"{html.escape(display_date)}</time>"
        )
    return f"""
        <blockquote>
          {stars}
          <span class="quote-mark">“</span>
          <p>{html.escape(review["review"])}</p>
          <footer>
            <strong>{html.escape(review["name"])}</strong>
            {date}
          </footer>
        </blockquote>"""


def build_web3forms_fields(endpoint, access_key, captcha_id):
    return (
        f"""
          <input type="hidden" name="access_key" value="{html.escape(access_key, quote=True)}" data-form-access-key />
          <input class="spam-trap" type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" aria-hidden="true" />
          <div class="captcha-field">
            <div class="h-captcha" id="{html.escape(captcha_id, quote=True)}" data-captcha="true"></div>
          </div>"""
        if is_web3forms_endpoint(endpoint)
        else ""
    )


def build_review_form(data, allow_unconfigured=False):
    endpoint = data["reviewFormEndpoint"] or data["formEndpoint"]
    access_key = data["reviewAccessKey"] or data["contactAccessKey"]
    if not allow_unconfigured and (
        not endpoint or (is_web3forms_endpoint(endpoint) and not access_key)
    ):
        return ""
    endpoint = endpoint or "https://api.web3forms.com/submit"
    hidden = " hidden" if allow_unconfigured else ""
    web3forms_fields = build_web3forms_fields(
        endpoint, access_key, "review-captcha"
    )
    company = html.escape(data["companyName"])
    subject = f"New customer review for {data['companyName']}"
    escaped_subject = html.escape(subject, quote=True)
    return f"""
      <section class="review-submission-section" data-form-container="review"{hidden}>
        <div class="review-submission-copy">
          <p class="eyebrow">Share your experience</p>
          <h2>Write a review</h2>
        </div>
        <form class="contact-form review-form" id="review-submission-form" action="{html.escape(endpoint, quote=True)}" method="post" data-review-form data-form-kind="review" data-company="{html.escape(data["companyName"], quote=True)}">
          <input type="hidden" name="subject" value="{escaped_subject}" data-review-subject data-company-subject="review" />
          <input type="hidden" name="_subject" value="{escaped_subject}" data-review-subject data-company-subject="review" />
          {web3forms_fields}
          <label>Your name<input name="name" autocomplete="name" required /></label>
          <label>Email<input name="email" type="email" autocomplete="email" required /></label>
          <fieldset class="star-rating">
            <legend>Your rating</legend>
            <div class="star-rating-options">
              <input id="review-star-5" name="stars" type="radio" value="5" />
              <label for="review-star-5" title="5 stars"><span class="sr-only">5 stars</span>★</label>
              <input id="review-star-4" name="stars" type="radio" value="4" />
              <label for="review-star-4" title="4 stars"><span class="sr-only">4 stars</span>★</label>
              <input id="review-star-3" name="stars" type="radio" value="3" />
              <label for="review-star-3" title="3 stars"><span class="sr-only">3 stars</span>★</label>
              <input id="review-star-2" name="stars" type="radio" value="2" />
              <label for="review-star-2" title="2 stars"><span class="sr-only">2 stars</span>★</label>
              <input id="review-star-1" name="stars" type="radio" value="1" />
              <label for="review-star-1" title="1 star"><span class="sr-only">1 star</span>★</label>
            </div>
          </fieldset>
          <label>Your review<textarea name="review" rows="5" required></textarea></label>
          <button type="submit">Submit review <span aria-hidden="true">→</span></button>
        </form>
      </section>"""


def build_contact_form(data, allow_unconfigured=False):
    endpoint = data["formEndpoint"] or "https://api.web3forms.com/submit"
    access_key = data["contactAccessKey"]
    if not allow_unconfigured and (
        not endpoint or (is_web3forms_endpoint(endpoint) and not access_key)
    ):
        return ""
    hidden = " hidden" if allow_unconfigured else ""
    return f"""
      <form class="contact-form" id="contact-submission-form" action="{html.escape(endpoint)}" method="post" data-form-kind="contact"{hidden}>
        {build_web3forms_fields(endpoint, access_key, "contact-captcha")}
        <input type="hidden" name="subject" value="New contact request for {html.escape(data["companyName"], quote=True)}" data-company-subject="contact" />
        <label>Name<input name="name" autocomplete="name" required /></label>
        <label>Email<input name="email" type="email" autocomplete="email" required /></label>
        <label>Phone<input name="phone" type="tel" autocomplete="tel" /></label>
        <label>How can we help?<textarea name="message" rows="5" required></textarea></label>
        <button type="submit">Send message <span aria-hidden="true">→</span></button>
      </form>"""


def parse_services(value, limit=MAX_OFFERINGS):
    if isinstance(value, list):
        if len(value) > limit:
            raise ValueError(f"Services supports at most {limit} entries.")
        services = []
        for index, item in enumerate(value, start=1):
            if not isinstance(item, dict):
                raise ValueError(f"Service {index} must be an object.")
            title = clean_text(
                item.get("title", ""), f"Service {index} title", False, 180
            )
            description = clean_text(
                item.get("description", ""),
                f"Service {index} description",
                False,
                3000,
            )
            price = clean_text(
                item.get("price", ""), f"Service {index} price", False, 120
            )
            link = validate_url(
                item.get("link", ""), f"Service {index} link", False
            )
            payment_link = validate_url(
                item.get("paymentLink", ""),
                f"Service {index} payment link",
                False,
            )
            image = item.get("image")
            if image is not None and not isinstance(image, dict):
                raise ValueError(f"Service {index} image must be an image object.")
            video = validate_url(
                item.get("video", ""),
                f"Service {index} video",
                False,
            )
            services.append(
                {
                    "title": title,
                    "description": description,
                    "price": price,
                    "link": link,
                    "paymentLink": payment_link,
                    "image": image,
                    "image_id": media_id(image, "service"),
                    "image_thumbnail": media_thumbnail(image),
                    "video": video,
                }
            )
        return services
    raise ValueError("Services must be a list of service objects.")


def youtube_embed_url(url):
    parsed = urlparse(url)
    host = parsed.netloc.lower().removeprefix("www.")
    video_id = ""
    if host == "youtu.be":
        video_id = parsed.path.strip("/").split("/")[0]
    elif host in {"youtube.com", "m.youtube.com"}:
        if parsed.path == "/watch":
            match = re.search(r"(?:^|&)v=([^&]+)", parsed.query)
            video_id = match.group(1) if match else ""
        elif parsed.path.startswith(("/embed/", "/shorts/")):
            video_id = parsed.path.strip("/").split("/")[1]
    if re.fullmatch(r"[A-Za-z0-9_-]{6,20}", video_id):
        return f"https://www.youtube-nocookie.com/embed/{video_id}"
    return ""


def render_service_media(service):
    video = service["video"]
    youtube_url = youtube_embed_url(video) if video else ""
    if youtube_url:
        return f"""
          <div class="service-media service-video">
            <iframe src="{html.escape(youtube_url, quote=True)}" title="{html.escape(service["title"], quote=True)} video" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>"""
    host = urlparse(video).netloc.lower() if video else ""
    if video and (host.endswith("facebook.com") or host.endswith("fb.watch")):
        embed_url = (
            "https://www.facebook.com/plugins/video.php?href="
            + quote(video, safe="")
            + "&show_text=false"
        )
        return f"""
          <div class="service-media service-video">
            <iframe src="{html.escape(embed_url, quote=True)}" title="{html.escape(service["title"], quote=True)} video" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
          </div>"""
    if video:
        video_path = urlparse(video).path.lower()
        if video_path.endswith((".mp4", ".webm", ".ogg", ".mov", ".m4v")):
            return f"""
          <div class="service-media service-video">
            <video src="{html.escape(video, quote=True)}" controls preload="metadata" playsinline title="{html.escape(service["title"], quote=True)} video"></video>
          </div>"""
        return f"""
          <div class="service-media service-video">
            <iframe src="{html.escape(video, quote=True)}" title="{html.escape(service["title"], quote=True)} video" loading="lazy" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>
          </div>"""
    if service["image"]:
        return f"""
          <div class="service-media">
            <img src="{html.escape(service["image"], quote=True)}" alt="{html.escape(service["title"], quote=True)}" loading="lazy" />
          </div>"""
    return ""


def render_service_card(service, index):
    title_only = bool(service["title"]) and not any(
        service[field]
        for field in (
            "description",
            "price",
            "link",
            "paymentLink",
            "image",
            "video",
        )
    )
    card_class = "service-card compact-service-card" if title_only else "service-card"
    description = (
        f'<p>{html.escape(service["description"])}</p>'
        if service["description"]
        else ""
    )
    price = (
        f'<strong class="service-price">{html.escape(service["price"])}</strong>'
        if service["price"]
        else ""
    )
    link = (
        f'<a class="service-link" href="{html.escape(service["link"], quote=True)}" target="_blank" rel="noopener noreferrer">View offering <span aria-hidden="true">↗</span></a>'
        if service["link"]
        else ""
    )
    payment_link = (
        f'<a class="service-payment-link" href="{html.escape(service["paymentLink"], quote=True)}" target="_blank" rel="noopener noreferrer">Pay now <span aria-hidden="true">↗</span></a>'
        if service["paymentLink"]
        else ""
    )
    actions = (
        f'<div class="service-card-actions">{link}{payment_link}</div>'
        if link or payment_link
        else ""
    )
    footer = (
        f'<div class="service-card-footer">{price}{actions}</div>'
        if price or actions
        else ""
    )
    return f"""
        <article class="{card_class}">
          {render_service_media(service)}
          <div class="service-card-content">
            <span class="service-number">{index:02d}</span>
            <h3>{html.escape(service["title"])}</h3>
            {description}
            {footer}
          </div>
        </article>"""


def initials(company_name):
    words = re.findall(r"[A-Za-z0-9]+", company_name)
    return "".join(word[0].upper() for word in words[:2]) or "CO"


def decode_image(image, field):
    if not isinstance(image, dict):
        raise ValueError(f"{field} image data is invalid.")
    mime_type = image.get("type")
    data_url = image.get("dataUrl")
    if (
        (not isinstance(data_url, str) or not data_url.startswith("data:"))
        and isinstance(image.get("thumbnail"), str)
        and image["thumbnail"].startswith("data:image/")
    ):
        data_url = image["thumbnail"]
        mime_type = data_url.split(";", 1)[0].removeprefix("data:")
    if mime_type not in ALLOWED_IMAGES:
        raise ValueError(f"{field} must be a PNG, JPG, WebP, or GIF image.")
    if not isinstance(data_url, str):
        raise ValueError(f"{field} image data is missing.")

    match = re.fullmatch(r"data:([^;,]+);base64,(.+)", data_url, re.DOTALL)
    if not match or match.group(1) != mime_type:
        raise ValueError(f"{field} image data is invalid.")
    try:
        raw = base64.b64decode(match.group(2), validate=True)
    except (binascii.Error, ValueError) as error:
        raise ValueError(f"{field} image data is invalid.") from error
    if not raw or len(raw) > MAX_IMAGE_SIZE:
        raise ValueError(f"{field} image must be between 1 byte and 2 MB.")
    return raw, ALLOWED_IMAGES[mime_type]


def media_id(image, prefix):
    if not image:
        return ""
    if not isinstance(image, dict):
        raise ValueError(f"{prefix.capitalize()} image data is invalid.")
    value = image.get("id") or image.get("image_id") or ""
    value = re.sub(r"[^a-zA-Z0-9_-]+", "-", str(value)).strip("-").lower()
    if value:
        return value[:120]
    raise ValueError(f"{prefix.capitalize()} image ID is missing.")


def media_thumbnail(image):
    if not isinstance(image, dict):
        return ""
    value = image.get("thumbnail") or image.get("image_thumbnail") or ""
    return value if isinstance(value, str) and value.startswith("data:image/") else ""


def section_heading(kicker, title, text=""):
    supporting_text = f"<p>{html.escape(text)}</p>" if text else ""
    return f"""
      <div class="section-heading">
        <div>
          <p class="eyebrow">{html.escape(kicker)}</p>
          <h2>{html.escape(title)}</h2>
        </div>
        {supporting_text}
      </div>"""


def build_social_strip(
    data, location="top", include_contact_actions=True, always_render=False
):
    icons = {
        "instagram": '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1"></circle></svg>',
        "facebook": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3c-3.3 0-5 2-5 5v2H6v4h3v7h4v-7h3.3l.7-4H13V9c0-.7.3-1 1-1Z"></path></svg>',
        "linkedin": '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="9" width="4" height="12"></rect><circle cx="5" cy="5" r="2"></circle><path d="M11 9h4v1.8c1-1.4 2.3-2.2 4.2-2.2 3 0 4.8 2 4.8 5.8V21h-4v-6c0-1.8-.6-3-2.3-3-1.8 0-2.7 1.2-2.7 3.4V21h-4V9Z"></path></svg>',
        "twitter": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h4.7l4.1 5.8L17.8 3H20l-6.2 7.3L21 21h-4.7l-4.7-6.7L5.9 21H3.7l6.9-8.2L4 3Zm3.5 2 10 14h2L9.5 5h-2Z"></path></svg>',
        "youtube": '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4"></rect><path d="m10 9 5 3-5 3V9Z"></path></svg>',
        "applePodcast": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="2"></circle><path d="M8.5 17.5a5 5 0 1 1 7 0M6 19.5a8 8 0 1 1 12 0M10 14h4l-1 7h-2l-1-7Z"></path></svg>',
        "spotify": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M7 9.5c3.6-1 7.4-.6 10.5 1M7.8 13c3-.8 6.2-.5 8.8.8M8.6 16.2c2.3-.6 4.8-.4 6.8.6"></path></svg>',
        "phone": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.7 3.5 9.5 8l-2 2c1.2 2.8 3.7 5.3 6.5 6.5l2-2 4.5 2.8c.4.2.6.7.5 1.1L20.4 22c-.1.6-.7 1-1.3 1C9.1 22.4 1.6 14.9 1 4.9c0-.6.4-1.2 1-1.3L5.6 3c.4-.1.9.1 1.1.5Z"></path></svg>',
        "email": '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m3 6 9 7 9-7"></path></svg>',
    }
    actions = []
    has_visible_actions = False
    for key, label in (
        ("instagram", "Instagram"),
        ("facebook", "Facebook"),
        ("linkedin", "LinkedIn"),
        ("twitter", "Twitter / X"),
        ("youtube", "YouTube"),
        ("applePodcast", "Apple Podcasts"),
        ("spotify", "Spotify"),
    ):
        if data[key] or always_render:
            hidden = "" if data[key] else " hidden"
            has_visible_actions = has_visible_actions or bool(data[key])
            actions.append(
                f'<a class="social-icon-link" data-social-platform="{key}" href="{html.escape(data[key] or "#", quote=True)}" target="_blank" rel="noopener noreferrer" aria-label="{label}" title="{label}"{hidden}>{icons[key]}<span class="sr-only">{label}</span></a>'
            )

    if include_contact_actions and (
        (data["showCall"] and data["phone"]) or always_render
    ):
        call_details_id = f"call-details-{location}"
        phone_link = re.sub(r"[^+\d]", "", data["phone"])
        hidden = "" if data["showCall"] and data["phone"] else " hidden"
        has_visible_actions = has_visible_actions or bool(
            data["showCall"] and data["phone"]
        )
        actions.append(
            f"""
        <div class="contact-action" data-contact-action-container="call"{hidden}>
          <button class="social-icon-link" type="button" data-contact-action="call" data-contact-value="{html.escape(data["phone"], quote=True)}" data-contact-href="tel:{html.escape(phone_link)}" aria-expanded="false" aria-controls="{call_details_id}" aria-label="Call us" title="Call us">
            {icons["phone"]}<span class="sr-only">Call us</span>
          </button>
          <div class="contact-action-details" id="{call_details_id}" hidden>
            <a href="tel:{html.escape(phone_link)}">{html.escape(data["phone"])}</a>
            <button type="button" data-copy-value="{html.escape(data["phone"], quote=True)}">Copy</button>
          </div>
        </div>"""
        )

    if include_contact_actions and (
        (data["showEmail"] and data["email"]) or always_render
    ):
        email_details_id = f"email-details-{location}"
        hidden = "" if data["showEmail"] and data["email"] else " hidden"
        has_visible_actions = has_visible_actions or bool(
            data["showEmail"] and data["email"]
        )
        actions.append(
            f"""
        <div class="contact-action" data-contact-action-container="email"{hidden}>
          <button class="social-icon-link" type="button" data-contact-action="email" aria-expanded="false" aria-controls="{email_details_id}" aria-label="Email us" title="Email us">
            {icons["email"]}<span class="sr-only">Email us</span>
          </button>
          <div class="contact-action-details" id="{email_details_id}" hidden>
            <a href="mailto:{html.escape(data["email"])}">{html.escape(data["email"])}</a>
            <button type="button" data-copy-value="{html.escape(data["email"], quote=True)}">Copy</button>
          </div>
        </div>"""
        )

    if not actions and not always_render:
        return ""
    hidden = " hidden" if not has_visible_actions else ""
    return f"""
    <aside class="social-strip{" footer-social-strip" if location == "footer" else ""}" data-social-location="{location}" aria-label="Company links"{hidden}>
      <p class="follow-heading">Follow</p>
      <div class="social-strip-track">{"".join(actions)}</div>
    </aside>"""


def build_preview_site(data, asset_paths):
    company = data["companyName"]
    escaped_company = html.escape(company)
    enabled = data["sections"]
    navigation = []
    sections = []

    if enabled["about"]:
        navigation.append(("about", "About"))
        sections.append(
            f"""
    <section class="content-section about-section" id="about">
      {section_heading("About us", f"About {company}")}
      <div class="about-card">
        <p>{html.escape(data["about"])}</p>
      </div>
    </section>"""
        )

    if enabled["services"]:
        navigation.append(("services", "What we offer"))
        services = data["services"]
        service_cards = "".join(
            render_service_card(service, index)
            for index, service in enumerate(services, start=1)
        )
        if data["servicesLayout"] == "horizontal":
            services_content = f"""
      <div class="carousel-shell" data-carousel>
        <button class="carousel-arrow previous" type="button" data-carousel-direction="-1" aria-label="Previous services">←</button>
        <div class="service-grid horizontal-services" data-carousel-track>{service_cards}</div>
        <button class="carousel-arrow next" type="button" data-carousel-direction="1" aria-label="Next services">→</button>
      </div>"""
        else:
            services_content = (
                f'<div class="service-grid vertical-services">{service_cards}</div>'
            )
        sections.append(
            f"""
    <section class="content-section" id="services">
      {section_heading("Our work", data["servicesHeading"])}
      {services_content}
    </section>"""
        )

    if enabled["gallery"]:
        navigation.append(("gallery", "Gallery"))
        gallery_items = "".join(
            f"""
        <figure>
          <button class="gallery-lightbox-trigger" type="button" data-gallery-open data-gallery-src="{html.escape(path, quote=True)}" aria-label="View gallery image {index}">
            <img src="{html.escape(path)}" alt="{escaped_company} gallery image {index}" loading="lazy" />
          </button>
        </figure>"""
            for index, path in enumerate(asset_paths["gallery"], start=1)
        )
        sections.append(
            f"""
    <section class="content-section" id="gallery">
      {section_heading("Gallery", "Our work")}
      <div class="carousel-shell" data-carousel>
        <button class="carousel-arrow previous" type="button" data-carousel-direction="-1" aria-label="Previous gallery images">←</button>
        <div class="gallery-grid" data-carousel-track>{gallery_items}</div>
        <button class="carousel-arrow next" type="button" data-carousel-direction="1" aria-label="Next gallery images">→</button>
      </div>
    </section>"""
        )

    if enabled["reviews"]:
        navigation.append(("reviews", "Reviews"))
        reviews = data["reviews"]
        review_cards = "".join(render_review_card(review) for review in reviews)
        published_reviews = (
            f"""
      <div class="carousel-shell" data-carousel>
        <button class="carousel-arrow previous" type="button" data-carousel-direction="-1" aria-label="Previous reviews">←</button>
        <div class="review-grid" data-carousel-track>{review_cards}</div>
        <button class="carousel-arrow next" type="button" data-carousel-direction="1" aria-label="Next reviews">→</button>
      </div>"""
            if review_cards
            else '<div class="data-status">No reviews.</div>'
        )
        sections.append(
            f"""
    <section class="content-section reviews-section" id="reviews">
      {section_heading("Reviews", "Customer reviews")}
      {published_reviews}
      {build_review_form(data)}
    </section>"""
        )

    if enabled["contact"]:
        navigation.append(("contact", "Contact"))
        contact_form = build_contact_form(data)
        contact_heading = "Send us a message" if contact_form else "Contact us"
        contact_copy = (
            "Tell us what you need and we will get back to you with the next steps."
            if contact_form
            else "Use the contact details below to get in touch."
        )
        contact_bits = []
        if data["email"]:
            contact_bits.append(
                f'<a href="mailto:{html.escape(data["email"])}">{html.escape(data["email"])}</a>'
            )
        if data["phone"]:
            phone_link = re.sub(r"[^+\d]", "", data["phone"])
            contact_bits.append(
                f'<a href="tel:{html.escape(phone_link)}">{html.escape(data["phone"])}</a>'
            )
        if data["address"]:
            contact_bits.append(f"<span>{html.escape(data['address'])}</span>")
        details = "".join(f"<li>{item}</li>" for item in contact_bits)
        sections.append(
            f"""
    <section class="content-section contact-section" id="contact">
      <div class="contact-copy">
        <p class="eyebrow">Start a conversation</p>
        <h2 data-contact-heading>{contact_heading}</h2>
        <p data-contact-copy>{contact_copy}</p>
        <ul class="contact-details" data-contact-details{" hidden" if not details else ""}>{details}</ul>
      </div>
      {contact_form}
    </section>"""
        )

    if enabled["reviews"] and enabled["contact"]:
        navigation[-2], navigation[-1] = navigation[-1], navigation[-2]
        sections[-2], sections[-1] = sections[-1], sections[-2]

    if enabled["appointment"]:
        navigation.append(("appointment", "Appointment"))
        sections.append(
            f"""
    <section class="content-section appointment-section" id="appointment">
      {section_heading("Book a time", "Schedule an appointment")}
      <div class="appointment-card">
        <iframe
          class="appointment-frame"
          src="{html.escape(data["appointmentUrl"], quote=True)}"
          title="Schedule an appointment with {escaped_company}"
          loading="lazy"
        ></iframe>
      </div>
    </section>"""
        )

    nav_links = "".join(
        f'<a href="#{section_id}">{html.escape(label)}</a>'
        for section_id, label in navigation
    )
    mobile_links = nav_links
    logo = (
        f'<img src="{html.escape(asset_paths["logo"])}" alt="{escaped_company} logo" />'
        if asset_paths["logo"]
        else f'<span class="brand-mark" aria-hidden="true">{html.escape(initials(company))}</span>'
    )
    hero_logo = (
        f"""
        <div class="hero-image-wrap">
          <img src="{html.escape(asset_paths["logo"])}" alt="{escaped_company} logo" />
        </div>"""
        if asset_paths["logo"]
        else f"""
        <div class="hero-monogram" aria-hidden="true">
          <span>{html.escape(initials(company))}</span>
        </div>"""
    )
    quote_button = (
        '<a class="primary-button" href="#contact">Send a message <span aria-hidden="true">→</span></a>'
        if enabled["contact"]
        else ""
    )
    first_section = navigation[0][0] if navigation else ""
    learn_more = (
        f'<a class="secondary-link" href="#{first_section}">Learn more <span aria-hidden="true">↓</span></a>'
        if first_section
        else ""
    )

    index_html = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="{html.escape(data["description"], quote=True)}" />
    <title>{escaped_company}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="{html.escape(FONTS[data["font"]]["url"], quote=True)}" rel="stylesheet" />
    <link rel="stylesheet" href="styles.css?v={SITE_ASSET_VERSION}" />
    <script src="script.js?v={SITE_ASSET_VERSION}" defer></script>
  </head>
  <body data-template="{html.escape(data["template"], quote=True)}" data-header-text="{html.escape(data["headerTextColor"], quote=True)}" data-header-image="{"true" if asset_paths.get("backgroundImage") else "false"}" data-logo-display="{"image" if asset_paths.get("logo") else "text"}">
    <header class="site-header">
      <nav class="nav-shell" aria-label="Main navigation">
        <a class="brand" href="#top" aria-label="{escaped_company} home">
          {logo}
          <strong>{escaped_company}</strong>
        </a>
        <div class="desktop-nav">{nav_links}</div>
        <button class="menu-button" type="button" aria-expanded="false" aria-controls="mobile-menu">
          <span></span><span></span><span></span>
          <span class="sr-only">Open navigation</span>
        </button>
      </nav>
      <div class="mobile-nav" id="mobile-menu" hidden>{mobile_links}</div>
      <div class="hero" id="top">
        <div class="hero-copy">
          <p class="eyebrow">Welcome to {escaped_company}</p>
          <h1>{html.escape(data["tagline"])}</h1>
          <p class="hero-description">{html.escape(data["description"])}</p>
          <div class="hero-actions">{quote_button}{learn_more}</div>
        </div>
        <div class="hero-art">{hero_logo}<strong class="hero-text-logo">{escaped_company}</strong></div>
      </div>
    </header>
    {build_social_strip(data)}
    <main>{"".join(sections)}
    </main>
    {build_social_strip(data, "footer", False)}
    <footer class="site-footer">
      <a class="brand footer-brand" href="#top">
        {logo}
        <strong>{escaped_company}</strong>
      </a>
      <div class="footer-meta">
        <small>© <span id="copyright-years" data-start-year="{data["yearStarted"]}"></span> {escaped_company}. All rights reserved.</small>
        <small class="gudispace-attribution">Built using <a href="https://gudispace.com/" target="_blank" rel="noopener noreferrer">GudiSpace.com</a></small>
      </div>
    </footer>
  </body>
</html>
"""

    brand_dark = adjust_color(data["brandColor"], -45)
    brand_light = adjust_color(data["brandColor"], 95)
    secondary_dark = adjust_color(data["secondaryColor"], -35)
    secondary_light = adjust_color(data["secondaryColor"], 80)
    styles_css = SITE_CSS.replace("__BRAND__", data["brandColor"])
    styles_css = styles_css.replace("__BRAND_DARK__", brand_dark)
    styles_css = styles_css.replace("__BRAND_LIGHT__", brand_light)
    styles_css = styles_css.replace("__SECONDARY__", data["secondaryColor"])
    styles_css = styles_css.replace("__SECONDARY_DARK__", secondary_dark)
    styles_css = styles_css.replace("__SECONDARY_LIGHT__", secondary_light)
    header_text_color = (
        "#111827"
        if asset_paths.get("backgroundImage")
        else contrast_color(data["secondaryColor"])
    )
    styles_css = styles_css.replace("__ON_SECONDARY__", header_text_color)
    styles_css = styles_css.replace("__ON_BRAND__", contrast_color(data["brandColor"]))
    default_page_color = "#fbfaf7"
    if not data["usePageColor"]:
        page_css_color = default_page_color
        contrast_page_color = default_page_color
    elif data["transparentPageColor"]:
        page_css_color = rgba_color(data["pageColor"], data["pageColorOpacity"])
        gradient_midpoint = blend_colors(
            data["brandColor"], data["secondaryColor"], 50
        )
        contrast_page_color = blend_colors(
            data["pageColor"], gradient_midpoint, data["pageColorOpacity"]
        )
    else:
        page_css_color = data["pageColor"]
        contrast_page_color = data["pageColor"]
    if data["usePageColor"] and data["transparentPageColor"]:
        body_background = (
            "radial-gradient(circle at 12% 28%, "
            "color-mix(in srgb, var(--brand) 48%, transparent), transparent 30rem), "
            "radial-gradient(circle at 88% 72%, "
            "color-mix(in srgb, var(--secondary-light) 45%, transparent), transparent 34rem), "
            "linear-gradient(135deg, var(--secondary-dark), var(--secondary), var(--brand-dark))"
        )
    else:
        body_background = page_css_color
    hero_background = (
        "radial-gradient(circle at 82% 42%, "
        "color-mix(in srgb, var(--brand) 28%, transparent), transparent 26rem), "
        "linear-gradient(135deg, var(--secondary-dark), "
        "var(--secondary) 58%, var(--secondary-dark))"
    )
    if asset_paths.get("backgroundImage"):
        background_url = asset_paths["backgroundImage"].replace('"', '\\"')
        hero_background = f'url("{background_url}") center center / cover no-repeat'
    styles_css = styles_css.replace("__PAGE__", page_css_color)
    styles_css = styles_css.replace(
        "__ON_PAGE__", contrast_color(contrast_page_color)
    )
    styles_css = styles_css.replace(
        "__PAGE_BLUR__",
        "18px"
        if data["usePageColor"] and data["transparentPageColor"]
        else "0px",
    )
    styles_css = styles_css.replace("__BODY_BACKGROUND__", body_background)
    styles_css = styles_css.replace("__HERO_BACKGROUND__", hero_background)
    styles_css = styles_css.replace("__BODY_FONT__", FONTS[data["font"]]["body"])
    styles_css = styles_css.replace(
        "__HEADING_FONT_VALUE__", FONTS[data["font"]]["heading"]
    )
    styles_css += "".join(LAYOUT_OVERRIDES.values())
    return index_html, styles_css, SITE_JS


SITE_JS = """const menuButton = document.querySelector(".menu-button");
const mobileMenu = document.querySelector("#mobile-menu");

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) {
      return;
    }
    event.preventDefault();
    document.body.dataset.navigationTarget = target.id;
    window.clearTimeout(window.navigationTargetTimer);
    window.navigationTargetTimer = window.setTimeout(() => {
      if (document.body.dataset.navigationTarget === target.id) {
        delete document.body.dataset.navigationTarget;
        window.dispatchEvent(new Event("scroll"));
      }
    }, 1500);
    document
      .querySelectorAll(".desktop-nav a, .mobile-nav a")
      .forEach((item) => {
        item.classList.toggle(
          "active",
          item.getAttribute("href") === link.getAttribute("href"),
        );
      });
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

function updateCarouselControls(carousel) {
  const track = carousel.querySelector("[data-carousel-track]");
  const previous = carousel.querySelector('[data-carousel-direction="-1"]');
  const next = carousel.querySelector('[data-carousel-direction="1"]');
  if (!track || !previous || !next) return;
  const maximumScroll = Math.max(0, track.scrollWidth - track.clientWidth);
  previous.disabled = track.scrollLeft <= 2;
  next.disabled = track.scrollLeft >= maximumScroll - 2;
}

function initializeCarousels() {
  document.querySelectorAll("[data-carousel]").forEach(updateCarouselControls);
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-carousel-direction]");
  if (button && !button.disabled) {
    const carousel = button.closest("[data-carousel]");
    const track = carousel.querySelector("[data-carousel-track]");
    const firstItem = track.firstElementChild;
    const gap = Number.parseFloat(getComputedStyle(track).gap) || 0;
    const distance = (firstItem?.getBoundingClientRect().width || track.clientWidth) + gap;
    const maximumScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const target = Math.max(
      0,
      Math.min(
        maximumScroll,
        track.scrollLeft +
          distance * Number(button.dataset.carouselDirection),
      ),
    );
    track.scrollTo({
      left: target,
      behavior: "smooth",
    });
    window.setTimeout(() => updateCarouselControls(carousel), 350);
  }
});

document.addEventListener(
  "scroll",
  (event) => {
    if (event.target.matches?.("[data-carousel-track]")) {
      updateCarouselControls(event.target.closest("[data-carousel]"));
    }
  },
  true,
);

window.addEventListener("resize", initializeCarousels);

function closeGalleryLightbox() {
  document.querySelector("#gallery-lightbox")?.remove();
  document.body.classList.remove("lightbox-open");
}

function openGalleryLightbox(source, alt) {
  const imageUrl = String(source || "").trim();
  if (!imageUrl) return;
  closeGalleryLightbox();
  const lightbox = document.createElement("div");
  lightbox.id = "gallery-lightbox";
  lightbox.className = "gallery-lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Gallery image preview");

  const closeButton = document.createElement("button");
  closeButton.className = "gallery-lightbox-close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close image preview");
  closeButton.textContent = "×";

  const image = document.createElement("img");
  image.src = imageUrl;
  image.alt = alt || "Gallery image";
  lightbox.append(closeButton, image);
  document.body.append(lightbox);
  document.body.classList.add("lightbox-open");
  closeButton.focus();
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-gallery-open]");
  if (trigger) {
    const image = trigger.querySelector("img");
    openGalleryLightbox(trigger.dataset.gallerySrc || image?.src, image?.alt);
    return;
  }
  if (
    event.target.matches("#gallery-lightbox, .gallery-lightbox-close")
  ) {
    closeGalleryLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeGalleryLightbox();
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-contact-action]");
  if (button) {
    if (
      button.dataset.contactAction === "call" &&
      window.matchMedia("(hover: none) and (pointer: coarse)").matches
    ) {
      window.location.href = button.dataset.contactHref;
      return;
    }

    const details = document.querySelector(
      `#${button.getAttribute("aria-controls")}`,
    );
    const willOpen = details.hidden;
    document.querySelectorAll(".contact-action-details").forEach((item) => {
      item.hidden = true;
    });
    document.querySelectorAll("[data-contact-action]").forEach((item) => {
      item.setAttribute("aria-expanded", "false");
    });
    details.hidden = !willOpen;
    button.setAttribute("aria-expanded", String(willOpen));
    return;
  }

  const copyButton = event.target.closest("[data-copy-value]");
  if (copyButton) {
    const value = copyButton.dataset.copyValue;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const field = document.createElement("textarea");
      field.value = value;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    const originalText = copyButton.textContent;
    copyButton.textContent = "Copied";
    window.setTimeout(() => {
      copyButton.textContent = originalText;
    }, 1400);
  }
});

if (menuButton && mobileMenu) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    mobileMenu.hidden = isOpen;
  });

  mobileMenu.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      menuButton.setAttribute("aria-expanded", "false");
      mobileMenu.hidden = true;
    }
  });
}

function initializeReviewForms() {
  document.querySelectorAll("[data-review-form]").forEach((form) => {
    if (form.dataset.reviewReady === "true") return;
    form.dataset.reviewReady = "true";
    const subjectFields = form.querySelectorAll("[data-review-subject]");
    form.querySelectorAll('input[name="stars"]').forEach((field) => {
      field.addEventListener("change", () => {
        const subject = `New ${field.value}-star customer review for ${form.dataset.company}`;
        subjectFields.forEach((subjectField) => {
          subjectField.value = subject;
        });
      });
    });
  });
}

const web3FormsCaptchaSiteKey = "50b2fe65-b00b-4b9e-ad62-3ba471098be2";
const captchaWidgetIds = new WeakMap();

function loadWeb3FormsCaptcha() {
  if (!document.querySelector(".h-captcha")) return Promise.resolve();
  const existing = document.querySelector(
    'script[src*="js.hcaptcha.com/1/api.js"]',
  );
  if (existing) {
    return existing.dataset.loaded === "true"
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
          existing.addEventListener("load", resolve, { once: true });
          existing.addEventListener("error", reject, { once: true });
        });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://js.hcaptcha.com/1/api.js?recaptchacompat=off&render=explicit";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    });
    script.addEventListener("error", () => {
      reject(new Error("Could not load the CAPTCHA service."));
    });
    document.head.append(script);
  });
}

function initializeCaptchaForms() {
  document.querySelectorAll(".h-captcha").forEach((captcha) => {
    const form = captcha.closest("form");
    if (!form || form.dataset.captchaReady === "true") return;
    const widgetId = window.hcaptcha.render(captcha, {
      sitekey: web3FormsCaptchaSiteKey,
    });
    captchaWidgetIds.set(captcha, widgetId);
    form.dataset.captchaReady = "true";
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (
        form.dataset.formKind === "review" &&
        !form.querySelector('input[name="stars"]:checked')
      ) {
        showFormToast("Please select a star rating before submitting.", true);
        return;
      }
      const response = form.querySelector(
        'textarea[name="h-captcha-response"]',
      );
      if (!response?.value) {
        showFormToast("Please complete the CAPTCHA before submitting.", true);
        return;
      }
      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton?.textContent;
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Submitting…";
      }
      let submissionAttempted = false;
      try {
        submissionAttempted = true;
        const result = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        const responseText = await result.text();
        let responseData = {};
        if (responseText) {
          try {
            responseData = JSON.parse(responseText);
          } catch {
            responseData = {};
          }
        }
        if (!result.ok || responseData.success === false) {
          throw new Error(
            responseData.message || "The form could not be submitted.",
          );
        }
        form.reset();
        showFormToast("Thank you. Your submission was sent successfully.");
      } catch (error) {
        showFormToast(error.message || "The form could not be submitted.", true);
      } finally {
        if (submissionAttempted) {
          try {
            window.hcaptcha.reset(captchaWidgetIds.get(captcha));
          } catch (resetError) {
            console.error("Could not reset CAPTCHA.", resetError);
          }
        }
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      }
    });
  });
}

function showFormToast(message, isError = false) {
  let toast = document.querySelector("#form-status-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "form-status-toast";
    toast.className = "form-status-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("visible");
  window.clearTimeout(window.formToastTimer);
  window.formToastTimer = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 4200);
}

async function initializeWeb3FormsCaptcha() {
  try {
    await loadWeb3FormsCaptcha();
    initializeCaptchaForms();
  } catch (error) {
    document.querySelectorAll(".captcha-field").forEach((field) => {
      field.textContent = error.message;
      field.classList.add("data-status", "error");
    });
  }
}

function updateCopyrightYears() {
  const copyrightYears = document.querySelector("#copyright-years");
  if (!copyrightYears) return;
  const currentYear = new Date().getFullYear();
  const startYear = Number(copyrightYears.dataset.startYear);
  copyrightYears.textContent =
    startYear < currentYear ? `${startYear}–${currentYear}` : String(currentYear);
}

updateCopyrightYears();
initializeCarousels();
initializeReviewForms();
initializeWeb3FormsCaptcha();
"""


SITE_CSS = """:root {
  --ink: #182033;
  --muted: #697184;
  --paper: __PAGE__;
  --white: #ffffff;
  --navy: __SECONDARY__;
  --brand: __BRAND__;
  --brand-dark: __BRAND_DARK__;
  --brand-light: __BRAND_LIGHT__;
  --secondary: __SECONDARY__;
  --secondary-dark: __SECONDARY_DARK__;
  --secondary-light: __SECONDARY_LIGHT__;
  --on-secondary: __ON_SECONDARY__;
  --on-brand: __ON_BRAND__;
  --on-page: __ON_PAGE__;
  --page-blur: __PAGE_BLUR__;
  --header-primary-surface: color-mix(in srgb, var(--brand) 6%, rgb(255 255 255 / 40%));
  --header-secondary-surface: color-mix(in srgb, var(--secondary) 6%, rgb(255 255 255 / 40%));
  --hero-background: __HERO_BACKGROUND__;
  --border: #e3e3df;
  --shadow: 0 20px 55px rgba(23, 34, 56, 0.12);
  --heading-font: __HEADING_FONT_VALUE__;
}

* {
  box-sizing: border-box;
}

[hidden] {
  display: none !important;
}

html {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

body {
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin: 0;
  overflow-x: hidden;
  color: var(--on-page);
  background: __BODY_BACKGROUND__;
  background-attachment: fixed;
  font-family: __BODY_FONT__;
  line-height: 1.6;
}

body > main {
  background: var(--paper);
  backdrop-filter: blur(var(--page-blur));
  -webkit-backdrop-filter: blur(var(--page-blur));
}

body,
button,
input,
textarea {
  font: inherit;
}

img {
  display: block;
  max-width: 100%;
}

.company-logo-slot {
  display: contents;
}

a {
  color: inherit;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.site-header {
  min-height: clamp(640px, 60vw, 820px);
  padding-top: 76px;
  overflow: hidden;
  color: var(--on-secondary);
  background: var(--hero-background);
  background-position: center;
  background-size: cover;
}

.nav-shell,
.hero,
.content-section,
.site-footer {
  width: min(1160px, calc(100% - 40px));
  margin-inline: auto;
}

.nav-shell {
  position: fixed;
  z-index: 20;
  top: 0;
  left: 50%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 76px;
  padding: 0 16px;
  background: color-mix(in srgb, var(--secondary-dark) 90%, transparent);
  border: 1px solid color-mix(in srgb, var(--on-secondary) 13%, transparent);
  border-top: 0;
  border-radius: 0 0 14px 14px;
  backdrop-filter: blur(14px);
  transform: translateX(-50%);
}

body[data-header-image="true"] .nav-shell,
body[data-header-image="true"] .mobile-nav {
  background: var(--header-secondary-surface);
  border-color: color-mix(in srgb, var(--secondary) 24%, transparent);
}

.brand {
  display: inline-flex;
  gap: 11px;
  align-items: center;
  font-family: var(--heading-font);
  text-decoration: none;
}

.brand img,
.brand-mark {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border: 1px solid color-mix(in srgb, var(--on-secondary) 25%, transparent);
  border-radius: 50%;
}

body[data-logo-display="image"] .brand > strong,
body[data-logo-display="text"] .brand > .company-logo-slot,
body:not([data-logo-display="text"]) .hero-text-logo {
  display: none;
}

body[data-logo-display="text"] .hero-art > .company-logo-slot {
  display: none;
}

.hero-text-logo {
  max-width: 100%;
  color: var(--on-secondary);
  font-family: var(--heading-font);
  font-size: clamp(42px, 7vw, 86px);
  line-height: 1;
  overflow-wrap: anywhere;
  text-align: center;
}

.brand-mark {
  display: grid;
  color: color-mix(in srgb, var(--brand-light) 75%, var(--on-secondary));
  font-size: 13px;
  background: var(--secondary-dark);
  place-items: center;
}

.desktop-nav {
  display: flex;
  gap: 4px;
}

.desktop-nav a,
.mobile-nav a {
  padding: 9px 13px;
  color: color-mix(in srgb, var(--on-secondary) 76%, transparent);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  border-radius: 8px;
}

.desktop-nav a:hover {
  color: var(--on-secondary);
  background: transparent;
}

.desktop-nav a.active,
.mobile-nav a.active {
  color: var(--on-secondary);
  font-weight: 800;
  text-decoration: underline;
  text-decoration-color: var(--brand);
  text-decoration-thickness: 3px;
  text-underline-offset: 8px;
  background: transparent;
  box-shadow: none;
}

.menu-button,
.mobile-nav {
  display: none;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.9fr);
  gap: 60px;
  align-items: center;
  min-height: calc(clamp(640px, 60vw, 820px) - 76px);
}

.hero-copy {
  max-width: 680px;
  padding: 60px 0;
}

body[data-header-image="true"] .hero-copy {
  padding: 32px;
  background: var(--header-primary-surface);
  border: 1px solid color-mix(in srgb, var(--brand) 24%, transparent);
  border-radius: 22px;
  box-shadow: 0 20px 50px rgb(0 0 0 / 18%);
  backdrop-filter: blur(4px);
}

.eyebrow {
  margin: 0 0 12px;
  color: var(--brand);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
}

.hero .eyebrow {
  color: color-mix(in srgb, var(--brand-light) 75%, var(--on-secondary));
}

body[data-header-image="true"] .hero .eyebrow {
  color: var(--brand-dark);
}

h1,
h2,
h3 {
  margin-top: 0;
  font-family: var(--heading-font);
  line-height: 1.12;
  letter-spacing: -1.2px;
}

h1 {
  margin-bottom: 20px;
  font-size: clamp(36px, 5vw, 58px);
}

h2 {
  margin-bottom: 0;
  font-size: clamp(34px, 5vw, 52px);
}

h3 {
  font-size: 21px;
}

.hero-description {
  max-width: 620px;
  margin: 0 0 28px;
  color: color-mix(in srgb, var(--on-secondary) 72%, transparent);
  font-size: 18px;
}

.hero-actions {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.primary-button,
.contact-form button {
  display: inline-flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  padding: 13px 20px;
  color: var(--on-brand);
  font-weight: 700;
  text-decoration: none;
  background: var(--brand);
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  transition: 180ms ease;
}

.primary-button:hover,
.contact-form button:hover {
  background: var(--brand-dark);
  transform: translateY(-2px);
}

.secondary-link {
  color: color-mix(in srgb, var(--on-secondary) 84%, transparent);
  font-weight: 600;
  text-decoration-color: color-mix(in srgb, var(--brand-light) 60%, transparent);
  text-underline-offset: 5px;
}

.hero-art {
  position: relative;
  display: grid;
  min-height: 340px;
  place-items: center;
}

.hero-image-wrap,
.hero-monogram {
  position: relative;
  width: min(100%, 310px);
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--secondary-dark);
  border: 1px solid color-mix(in srgb, var(--on-secondary) 18%, transparent);
  border-radius: 30px;
  box-shadow: 0 35px 90px rgba(0, 0, 0, 0.4);
}

.hero-image-wrap::before,
.hero-monogram::before {
  position: absolute;
  z-index: 0;
  inset: -20%;
  content: "";
  background: radial-gradient(circle, color-mix(in srgb, var(--brand) 38%, transparent), transparent 65%);
}

.hero-image-wrap img {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.hero-monogram {
  display: grid;
  place-items: center;
}

.hero-monogram span {
  position: relative;
  z-index: 1;
  color: var(--brand-light);
  font-family: var(--heading-font);
  font-size: clamp(80px, 13vw, 150px);
}

.content-section {
  padding: 88px 0;
  scroll-margin-top: 100px;
}

.content-section + .content-section {
  border-top: 1px solid var(--border);
  background: var(--paper);
  backdrop-filter: blur(var(--page-blur));
  -webkit-backdrop-filter: blur(var(--page-blur));
}

.section-heading {
  display: flex;
  gap: 50px;
  align-items: end;
  justify-content: space-between;
  margin-bottom: 44px;
}

.section-heading > p {
  max-width: 430px;
  margin: 0;
  color: color-mix(in srgb, var(--on-page) 72%, transparent);
}

.about-card {
  padding: 46px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 22px;
  box-shadow: 0 8px 28px rgba(23, 34, 56, 0.05);
  color: var(--ink);
}

.about-card > p {
  margin: 0;
  color: var(--muted);
  font-size: 19px;
}

.carousel-shell {
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.service-grid,
.review-grid,
.gallery-grid {
  display: flex;
  gap: 20px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  padding: 4px 2px 16px;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.service-grid::-webkit-scrollbar,
.review-grid::-webkit-scrollbar,
.gallery-grid::-webkit-scrollbar {
  display: none;
}

.carousel-arrow {
  position: absolute;
  z-index: 3;
  top: 50%;
  display: grid;
  width: 42px;
  height: 42px;
  padding: 0;
  color: var(--on-brand);
  background: var(--brand);
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  place-items: center;
  transform: translateY(-50%);
  box-shadow: 0 8px 24px rgba(23, 34, 56, 0.2);
}

.carousel-arrow:hover {
  background: var(--brand-dark);
}

.carousel-arrow:disabled {
  cursor: not-allowed;
  opacity: 0.3;
  transform: translateY(-50%);
}

.carousel-arrow.previous {
  left: 6px;
}

.carousel-arrow.next {
  right: 6px;
}

.service-card,
blockquote {
  flex: 0 0 calc((100% - 40px) / 3);
  min-height: 260px;
  margin: 0;
  padding: 28px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 16px;
  color: var(--ink);
}

.service-number {
  color: var(--brand);
  font-family: var(--heading-font);
  font-weight: 800;
}

.service-card {
  padding: 0;
  overflow: hidden;
}

.service-card-content {
  display: flex;
  min-width: 0;
  padding: 25px;
  flex-direction: column;
}

.service-card h3 {
  margin: 16px 0 8px;
}

.service-card p,
blockquote p {
  margin: 0;
  color: var(--muted);
}

.service-media {
  width: 100%;
  height: 210px;
  overflow: hidden;
  background: color-mix(in srgb, var(--secondary) 10%, white);
}

.service-media img,
.service-media iframe,
.service-media video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 0;
}

.service-card-footer {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 22px;
}

.service-price {
  color: var(--ink);
  font-family: var(--heading-font);
  font-size: 18px;
}

.service-link,
.service-payment-link {
  color: var(--brand-dark);
  font-size: 14px;
  font-weight: 700;
  text-underline-offset: 4px;
}

.service-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  align-items: center;
  justify-content: flex-end;
}

.service-payment-link {
  padding: 9px 13px;
  color: var(--on-brand);
  text-decoration: none;
  background: var(--brand);
  border-radius: 999px;
}

.vertical-services {
  display: grid;
  gap: 24px;
  overflow: visible;
  padding: 0;
  scroll-snap-type: none;
}

.vertical-services .service-card {
  display: grid;
  grid-template-columns: minmax(260px, 0.75fr) minmax(0, 1.25fr);
  min-height: 310px;
}

.vertical-services .service-media {
  height: 100%;
  min-height: 310px;
}

.vertical-services .service-card-content {
  padding: 32px;
}

.horizontal-services .service-card {
  flex-basis: calc((100% - 40px) / 3);
}

.service-card.compact-service-card {
  min-height: 0;
  align-self: flex-start;
}

.compact-service-card .service-card-content {
  padding: 20px;
}

.compact-service-card h3 {
  margin-bottom: 0;
}

.gallery-grid figure {
  flex: 0 0 calc((100% - 40px) / 3);
  height: 280px;
  min-height: 260px;
  margin: 0;
  overflow: hidden;
  background: #e9e8e4;
  border-radius: 15px;
}

.gallery-grid img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 300ms ease;
}

.gallery-lightbox-trigger {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  overflow: hidden;
  background: transparent;
  border: 0;
  cursor: zoom-in;
}

.gallery-grid figure:hover img {
  transform: scale(1.04);
}

.gallery-lightbox {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  width: 100vw;
  max-width: 100%;
  height: 100dvh;
  padding: clamp(16px, 4vw, 48px);
  overflow: hidden;
  background: rgba(7, 12, 22, 0.92);
  place-items: center;
}

.gallery-lightbox img {
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  max-height: calc(100dvh - clamp(32px, 8vw, 96px));
  object-fit: contain;
}

.gallery-lightbox-close {
  position: absolute;
  z-index: 1;
  top: max(12px, env(safe-area-inset-top));
  right: max(12px, env(safe-area-inset-right));
  display: grid;
  width: 44px;
  height: 44px;
  padding: 0;
  color: #ffffff;
  font-size: 32px;
  line-height: 1;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 50%;
  cursor: pointer;
  place-items: center;
}

body.lightbox-open {
  overflow: hidden;
}

.service-card,
.gallery-grid figure,
blockquote {
  scroll-snap-align: start;
}

.social-strip {
  width: min(1160px, calc(100% - 40px));
  margin: 24px auto 0;
}

.follow-heading {
  margin: 0 0 10px;
  color: var(--on-page);
  font-family: var(--heading-font);
  font-size: 15px;
  font-weight: 800;
}

.social-strip-track {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 2px 2px 12px;
  scrollbar-width: none;
}

.footer-social-strip {
  margin-top: 56px;
}

.footer-social-strip .social-strip-track {
  padding-bottom: 2px;
}

.social-strip-track::-webkit-scrollbar {
  display: none;
}

.social-icon-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  padding: 14px;
  color: var(--secondary);
  text-decoration: none;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--ink);
  cursor: pointer;
  transition: 180ms ease;
}

.social-icon-link:hover {
  color: var(--brand-dark);
  border-color: var(--brand);
  transform: translateY(-2px);
}

.social-icon-link svg {
  width: 25px;
  height: 25px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.social-icon-link[aria-label="Facebook"] svg,
.social-icon-link[aria-label="LinkedIn"] svg {
  fill: currentColor;
  stroke: none;
}

.contact-action {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
  align-items: center;
}

.contact-action-details {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 54px;
  padding: 7px 8px 7px 14px;
  white-space: nowrap;
  background: var(--white);
  border: 1px solid var(--brand);
  border-radius: 12px;
}

.contact-action-details[hidden] {
  display: none;
}

.contact-action-details a {
  color: var(--ink);
  font-weight: 700;
  text-decoration: none;
}

.contact-action-details button {
  padding: 7px 10px;
  color: var(--on-brand);
  font-size: 12px;
  font-weight: 700;
  background: var(--brand);
  border: 0;
  border-radius: 7px;
  cursor: pointer;
}

.reviews-section {
  width: auto;
  max-width: none;
  padding-inline: max(20px, calc((100% - 1160px) / 2));
  background: var(--paper);
}

.quote-mark {
  color: var(--brand);
  font-family: Georgia, serif;
  font-size: 50px;
  line-height: 0.8;
}

.review-stars {
  color: var(--brand);
  font-size: 21px;
  letter-spacing: 3px;
}

.review-stars span {
  color: color-mix(in srgb, var(--on-page) 18%, transparent);
}

blockquote p {
  min-height: 90px;
  margin: 18px 0 24px;
  font-size: 16px;
}

blockquote footer {
  display: flex;
  gap: 8px 16px;
  align-items: center;
  justify-content: space-between;
}

blockquote footer strong {
  font-weight: 700;
}

blockquote footer time {
  color: var(--muted);
  font-size: 13px;
  white-space: nowrap;
}

.review-submission-section {
  display: block;
  width: min(100%, 760px);
  padding-top: 70px;
  margin: 70px auto 0;
  border-top: 1px solid var(--border);
}

.review-submission-copy {
  margin-bottom: 28px;
  text-align: center;
}

.review-submission-copy h2 {
  margin-bottom: 16px;
}

.review-submission-copy > p:not(.eyebrow) {
  color: var(--muted);
}

.star-rating {
  padding: 0;
  margin: 0;
  border: 0;
}

.star-rating legend {
  margin-bottom: 7px;
  font-size: 14px;
  font-weight: 700;
}

.star-rating-options {
  display: flex;
  flex-direction: row-reverse;
  justify-content: flex-end;
  width: fit-content;
}

.star-rating-options input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.star-rating-options label {
  display: block;
  padding: 0 3px;
  color: #cfd1d6;
  font-size: 34px;
  line-height: 1;
  cursor: pointer;
}

.star-rating-options label:hover,
.star-rating-options label:hover ~ label,
.star-rating-options input:checked ~ label {
  color: var(--brand);
}

.star-rating-options input:focus-visible + label {
  border-radius: 4px;
  outline: 3px solid color-mix(in srgb, var(--brand) 30%, transparent);
}

.contact-section {
  display: block;
  width: min(100% - 40px, 900px);
}

.contact-copy {
  width: min(100%, 720px);
  margin: 0 auto 30px;
  text-align: center;
}

.contact-copy h2 {
  margin-bottom: 20px;
}

.contact-copy > p:not(.eyebrow) {
  color: var(--muted);
  font-size: 17px;
}

.contact-details {
  display: grid;
  gap: 10px;
  justify-items: center;
  padding: 24px 0 0;
  margin: 24px 0 0;
  list-style: none;
  border-top: 1px solid var(--border);
}

.contact-details a {
  text-underline-offset: 4px;
}

.contact-form {
  display: grid;
  gap: 17px;
  width: min(100%, 720px);
  padding: 32px;
  margin-inline: auto;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: var(--shadow);
  color: var(--ink);
}

.contact-form label {
  display: grid;
  gap: 7px;
  font-size: 14px;
  font-weight: 700;
}

.contact-form input,
.contact-form textarea {
  width: 100%;
  padding: 12px 13px;
  border: 1px solid #cfd1d6;
  border-radius: 9px;
  outline: none;
}

.contact-form input:focus,
.contact-form textarea:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand) 18%, transparent);
}

.contact-form textarea {
  resize: vertical;
}

.spam-trap {
  display: none !important;
}

.captcha-field {
  min-height: 78px;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.h-captcha {
  width: 100%;
  max-width: 100%;
  transform-origin: left top;
}

.h-captcha iframe {
  max-width: 100% !important;
}

.form-status-toast {
  position: fixed;
  z-index: 100;
  right: 22px;
  bottom: 22px;
  max-width: min(390px, calc(100% - 44px));
  padding: 15px 18px;
  color: #ffffff;
  font-weight: 700;
  background: #237a4b;
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(17, 29, 46, 0.24);
  opacity: 0;
  pointer-events: none;
  transform: translateY(18px);
  transition: opacity 180ms ease, transform 180ms ease;
}

.form-status-toast.error {
  background: #9d2d2d;
}

.form-status-toast.visible {
  opacity: 1;
  transform: translateY(0);
}

.contact-form button {
  width: 100%;
}

.appointment-card {
  overflow: hidden;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: var(--shadow);
}

.appointment-frame {
  display: block;
  width: 100%;
  height: 760px;
  background: var(--white);
  border: 0;
}

.site-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 36px 0;
  border-top: 1px solid var(--border);
}

.site-header,
body > main,
.home-main,
.home-page-section,
.page-main,
.content-section,
.contact-section,
.review-submission-section {
  max-width: 100%;
  min-width: 0;
}

.contact-section > *,
.review-submission-section > * {
  min-width: 0;
}

.footer-brand .brand-mark,
.footer-brand img {
  border-color: var(--border);
}

.site-footer small {
  color: color-mix(in srgb, var(--on-page) 70%, transparent);
}

.footer-meta {
  display: grid;
  gap: 5px;
  text-align: right;
}

.gudispace-attribution a {
  color: inherit;
  font-weight: 700;
}

@media (max-width: 850px) {
  .desktop-nav {
    display: none;
  }

  .menu-button {
    display: grid;
    gap: 4px;
    width: 42px;
    height: 42px;
    padding: 10px;
    background: color-mix(in srgb, var(--on-secondary) 8%, transparent);
    border: 0;
    border-radius: 9px;
    cursor: pointer;
    place-content: center;
  }

  .menu-button > span:not(.sr-only) {
    width: 20px;
    height: 2px;
    background: var(--on-secondary);
  }

  .mobile-nav {
    position: fixed;
    z-index: 19;
    top: 76px;
    left: 50%;
    width: min(100% - 40px, 1160px);
    padding: 8px;
    margin: 0;
    background: color-mix(in srgb, var(--secondary-dark) 96%, transparent);
    border: 1px solid color-mix(in srgb, var(--on-secondary) 12%, transparent);
    border-radius: 10px;
    transform: translateX(-50%);
  }

  .mobile-nav:not([hidden]) {
    display: grid;
  }

  .mobile-nav a {
    display: block;
  }

  .hero {
    grid-template-columns: minmax(0, 1.15fr) minmax(240px, 0.85fr);
    gap: 30px;
  }

  .service-card,
  blockquote,
  .gallery-grid figure {
    flex-basis: calc((100% - 20px) / 2);
  }

  .horizontal-services .service-card {
    flex-basis: calc((100% - 20px) / 2);
  }

  .vertical-services .service-card {
    grid-template-columns: minmax(220px, 0.8fr) minmax(0, 1.2fr);
  }

  .about-card {
    grid-template-columns: 1fr;
    gap: 35px;
  }

  .contact-section {
    width: min(100% - 40px, 900px);
  }
}

@media (max-width: 620px) {
  .contact-form input,
  .contact-form textarea {
    font-size: 16px;
  }

  .nav-shell,
  .hero,
  .content-section,
  .site-footer,
  .mobile-nav {
    width: min(100% - 28px, 1160px);
  }

  .site-header {
    min-height: auto;
  }

  .nav-shell {
    min-height: 68px;
  }

  .brand {
    max-width: calc(100% - 60px);
  }

  .brand strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hero {
    grid-template-columns: minmax(0, 1.25fr) minmax(105px, 0.75fr);
    gap: 14px;
    min-height: 430px;
  }

  .hero-copy {
    padding: 45px 0;
  }

  h1 {
    font-size: clamp(28px, 8vw, 39px);
  }

  .hero-description {
    font-size: 15px;
  }

  .hero-art {
    min-height: 170px;
  }

  .hero-image-wrap,
  .hero-monogram {
    border-radius: 18px;
  }

  .primary-button {
    padding: 11px 14px;
    font-size: 13px;
  }

  .secondary-link {
    font-size: 13px;
  }

  .content-section {
    padding: 62px 0;
  }

  .section-heading {
    display: grid;
    gap: 16px;
    margin-bottom: 30px;
  }

  .about-card {
    padding: 26px 20px;
  }

  .about-card > p {
    font-size: 16px;
  }

  .service-card,
  blockquote,
  .gallery-grid figure {
    flex-basis: 86%;
  }

  .horizontal-services .service-card {
    flex-basis: 92%;
    height: 520px;
    min-height: 520px;
  }

  .horizontal-services .service-card-content {
    min-height: 275px;
  }

  .horizontal-services .compact-service-card {
    height: auto;
    min-height: 0;
  }

  .horizontal-services .compact-service-card .service-card-content {
    min-height: 0;
  }

  .horizontal-services .service-card p {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
  }

  .vertical-services .service-card {
    display: block;
    min-height: 0;
  }

  .vertical-services .service-media {
    height: 220px;
    min-height: 0;
  }

  .vertical-services .service-card-content {
    padding: 24px 20px;
  }

  .gallery-grid figure {
    height: 250px;
    min-height: 230px;
  }

  .carousel-arrow.previous {
    left: 4px;
  }

  .carousel-arrow.next {
    right: 4px;
  }

  .social-strip {
    width: min(100% - 28px, 1160px);
  }


  .reviews-section {
    width: auto;
    padding-inline: 14px;
  }

  .review-submission-section {
    padding-top: 45px;
    margin-top: 45px;
  }

  blockquote p {
    min-height: auto;
  }

  .contact-form {
    padding: 24px 18px;
  }

  .h-captcha {
    margin-bottom: -14px;
    transform: scale(0.82);
  }

  .appointment-frame {
    height: 680px;
  }

  .site-footer {
    align-items: start;
    flex-direction: column;
    gap: 12px;
  }

  .footer-meta {
    text-align: left;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
"""

TEMPLATE_OVERRIDES = {
    "classic": """

/* Template 1: Classic Dark */
""",
    "modern": """

/* Template 2: Modern Light */
.site-header {
  color: var(--ink);
  background:
    radial-gradient(circle at 78% 42%, color-mix(in srgb, var(--brand) 24%, transparent), transparent 25rem),
    linear-gradient(145deg, #f8faf8, #e9efea);
}

.nav-shell {
  background: rgba(250, 252, 250, 0.92);
  border-color: rgba(24, 32, 51, 0.12);
}

.brand-mark {
  color: var(--brand-dark);
  background: var(--white);
  border-color: color-mix(in srgb, var(--brand) 50%, white);
}

.brand img {
  border-color: rgba(24, 32, 51, 0.14);
}

.desktop-nav a {
  color: var(--muted);
}

.desktop-nav a:hover {
  color: var(--ink);
  background: transparent;
}

.desktop-nav a.active {
  color: var(--brand-dark);
}

.hero {
  grid-template-columns: minmax(0, 0.9fr) minmax(340px, 1.1fr);
}

.hero .eyebrow {
  color: var(--brand-dark);
}

.hero-description {
  color: var(--muted);
}

.secondary-link {
  color: var(--ink);
  text-decoration-color: var(--brand);
}

.hero-image-wrap,
.hero-monogram {
  width: min(100%, 380px);
  background: var(--white);
  border-color: rgba(24, 32, 51, 0.1);
  border-radius: 50% 50% 22px 22px;
  box-shadow: 0 30px 70px rgba(23, 34, 56, 0.16);
}

.service-card,
blockquote {
  border-top: 3px solid var(--brand);
  border-radius: 8px;
}

.gallery-grid figure,
.contact-form,
.about-card {
  border-radius: 8px;
}

@media (max-width: 850px) {
  .menu-button {
    background: rgba(24, 32, 51, 0.07);
  }

  .menu-button > span:not(.sr-only) {
    background: var(--ink);
  }

  .mobile-nav {
    background: rgba(250, 252, 250, 0.98);
    border-color: rgba(24, 32, 51, 0.12);
  }

  .mobile-nav a {
    color: var(--ink);
  }
}

@media (max-width: 620px) {
  .hero {
    grid-template-columns: minmax(0, 1.1fr) minmax(100px, 0.9fr);
  }

  .hero-image-wrap,
  .hero-monogram {
    width: min(100%, 180px);
    border-radius: 50% 50% 14px 14px;
  }
}
""",
    "bold": """

/* Template 3: Bold Gradient */
.site-header {
  min-height: 720px;
  background:
    radial-gradient(circle at 18% 20%, color-mix(in srgb, var(--brand-light) 28%, transparent), transparent 24rem),
    linear-gradient(135deg, var(--brand-dark), #332253 62%, #172238);
}

.nav-shell {
  width: min(1040px, calc(100% - 40px));
  background: rgba(23, 24, 43, 0.72);
  border-radius: 0 0 24px 24px;
}

.desktop-nav a {
  border-radius: 99px;
}

.hero {
  grid-template-columns: 1fr;
  gap: 10px;
  min-height: 640px;
  text-align: center;
}

.hero-copy {
  max-width: 780px;
  padding: 70px 0 18px;
  margin-inline: auto;
}

.hero-description {
  margin-inline: auto;
}

.hero-actions {
  justify-content: center;
}

.primary-button {
  padding-inline: 26px;
  border-radius: 99px;
}

.hero-art {
  min-height: 180px;
  padding-bottom: 48px;
}

.hero-image-wrap,
.hero-monogram {
  width: 160px;
  border-radius: 50%;
  box-shadow: 0 20px 55px rgba(0, 0, 0, 0.32);
}

.hero-monogram span {
  font-size: 62px;
}

.section-heading {
  display: grid;
  gap: 12px;
  justify-items: center;
  text-align: center;
}

.section-heading > p {
  max-width: 620px;
}

.about-card {
  max-width: 850px;
  margin-inline: auto;
  text-align: center;
  border-radius: 30px;
}

.service-card,
blockquote {
  border: 0;
  border-radius: 24px;
  box-shadow: 0 10px 32px rgba(23, 34, 56, 0.08);
}

.service-card:nth-child(3n + 1) {
  background: color-mix(in srgb, var(--brand) 12%, white);
}

.gallery-grid figure {
  border-radius: 28px;
}

.contact-section {
  padding: 60px;
  margin-block: 70px;
  color: var(--white);
  background: linear-gradient(135deg, var(--brand-dark), #332253);
  border-radius: 30px;
}

.contact-copy > p:not(.eyebrow) {
  color: rgba(255, 255, 255, 0.72);
}

.contact-details {
  border-color: rgba(255, 255, 255, 0.2);
}

.contact-form {
  border: 0;
  border-radius: 24px;
}

@media (max-width: 850px) {
  .mobile-nav {
    width: min(100% - 40px, 1040px);
    background: rgba(23, 24, 43, 0.96);
    border-radius: 18px;
  }

  .contact-section {
    width: min(100% - 40px, 1160px);
    padding: 40px;
  }
}

@media (max-width: 620px) {
  .site-header {
    min-height: 610px;
  }

  .nav-shell,
  .mobile-nav {
    width: min(100% - 28px, 1040px);
  }

  .hero {
    grid-template-columns: 1fr;
    min-height: 540px;
  }

  .hero-copy {
    padding: 55px 0 12px;
  }

  .hero-art {
    min-height: 125px;
    padding-bottom: 34px;
  }

  .hero-image-wrap,
  .hero-monogram {
    width: 112px;
  }

  .hero-monogram span {
    font-size: 42px;
  }

  .contact-section {
    width: min(100% - 28px, 1160px);
    padding: 30px 18px;
    margin-block: 35px;
    border-radius: 22px;
  }
}
""",
}

LAYOUT_OVERRIDES = {
    "logo-left": """

/* Template 1: logo left, content right */
body[data-template="logo-left"] .hero {
  grid-template-columns: minmax(260px, 0.8fr) minmax(0, 1.2fr);
}

body[data-template="logo-left"] .hero-art {
  grid-row: 1;
  grid-column: 1;
}

body[data-template="logo-left"] .hero-copy {
  grid-row: 1;
  grid-column: 2;
}

@media (max-width: 620px) {
  body[data-template="logo-left"] .hero {
    grid-template-columns: 1fr;
  }

  body[data-template="logo-left"] .hero-art,
  body[data-template="logo-left"] .hero-copy {
    grid-column: 1;
  }

  body[data-template="logo-left"] .hero-art {
    grid-row: 1;
  }

  body[data-template="logo-left"] .hero-copy {
    grid-row: 2;
  }
}
""",
    "logo-right": """

/* Template 2: content left, logo right */
body[data-template="logo-right"] .hero {
  grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr);
}

body[data-template="logo-right"] .hero-copy {
  grid-row: 1;
  grid-column: 1;
}

body[data-template="logo-right"] .hero-art {
  grid-row: 1;
  grid-column: 2;
}

@media (max-width: 620px) {
  body[data-template="logo-right"] .hero {
    grid-template-columns: 1fr;
  }

  body[data-template="logo-right"] .hero-art,
  body[data-template="logo-right"] .hero-copy {
    grid-column: 1;
  }

  body[data-template="logo-right"] .hero-copy {
    grid-row: 1;
  }

  body[data-template="logo-right"] .hero-art {
    grid-row: 2;
  }
}
""",
    "centered": """

/* Template 3: centered and stacked */
body[data-template="centered"] .hero {
  grid-template-columns: 1fr;
  gap: 0;
  min-height: 650px;
  text-align: center;
}

body[data-template="centered"] .hero-art {
  grid-row: 1;
  grid-column: 1;
  min-height: 245px;
  padding-top: 45px;
}

body[data-template="centered"] .hero-image-wrap,
body[data-template="centered"] .hero-monogram {
  width: min(100%, 190px);
  border-radius: 50%;
}

body[data-template="centered"] .hero-monogram span {
  font-size: 72px;
}

body[data-template="centered"] .hero-copy {
  grid-row: 2;
  grid-column: 1;
  padding: 18px 0 65px;
  margin-inline: auto;
}

body[data-template="centered"] .hero-description {
  margin-inline: auto;
}

body[data-template="centered"] .hero-actions {
  justify-content: center;
}

@media (max-width: 620px) {
  body[data-template="centered"] .hero {
    grid-template-columns: 1fr;
    min-height: 540px;
  }

  body[data-template="centered"] .hero-art {
    min-height: 175px;
    padding-top: 35px;
  }

  body[data-template="centered"] .hero-image-wrap,
  body[data-template="centered"] .hero-monogram {
    width: min(100%, 125px);
  }

  body[data-template="centered"] .hero-monogram span {
    font-size: 48px;
  }

  body[data-template="centered"] .hero-copy {
    padding: 12px 0 48px;
  }
}
""",
}

GENERATED_PAGES_CSS = """

.page-site-header {
  min-height: 330px;
  padding-top: 76px;
  color: var(--on-secondary);
  background: var(--hero-background);
  background-position: center;
  background-size: cover;
}

.page-banner {
  display: grid;
  width: min(1160px, calc(100% - 40px));
  min-height: 250px;
  margin-inline: auto;
  align-content: center;
}

body[data-header-image="true"] .page-banner {
  min-height: auto;
  margin-block: 55px;
  padding: 32px;
  background: var(--header-primary-surface);
  border: 1px solid color-mix(in srgb, var(--brand) 24%, transparent);
  border-radius: 22px;
  box-shadow: 0 20px 50px rgb(0 0 0 / 18%);
  backdrop-filter: blur(4px);
}

.page-banner h1 {
  margin: 0;
}

.desktop-nav a.active,
.mobile-nav a.active {
  text-decoration: underline;
  text-decoration-color: var(--brand);
  text-decoration-thickness: 3px;
  text-underline-offset: 8px;
  background: transparent;
  box-shadow: none;
}

.page-main {
  min-height: 420px;
}

.home-main {
  min-height: 1px;
  border-top: 1px solid color-mix(in srgb, var(--on-page) 10%, transparent);
}

.home-page-section {
  scroll-margin-top: 90px;
}

.home-page-section + .home-page-section {
  border-top: 1px solid var(--border);
}

.home-page-section .page-main {
  min-height: 0;
}

.home-page-section .reviews-page {
  padding-block: 1px;
}

.data-status {
  padding: 25px;
  color: var(--muted);
  text-align: center;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.data-status.error {
  color: #9d2d2d;
}

.reviews-page {
  background: var(--paper);
}

@media (max-width: 620px) {
  .page-banner {
    width: min(100% - 28px, 1160px);
    min-height: 210px;
  }

  .page-site-header {
    min-height: 278px;
  }
}
"""

DATA_PAGE_JS = r"""

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );
}

async function loadJson(path) {
  if (window.location.protocol === "file:") {
    throw new Error(
      "Open this website through start.command or a web host to load JSON data.",
    );
  }
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load ${path} (${response.status}).`);
  }
  return response.json();
}

function safeHttpUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function safeAssetUrl(value) {
  if (!value) return "";
  if (
    typeof value === "string" &&
    /^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(value)
  ) {
    return value;
  }
  try {
    const url = new URL(value, window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

let currentCompanyData = null;
let currentSiteData = null;

function companyInitials(companyName) {
  return String(companyName)
    .match(/[A-Za-z0-9]+/g)
    ?.slice(0, 3)
    .map((word) => word[0].toUpperCase())
    .join("") || "CO";
}

function applyCompanyData(company) {
  if (!company || typeof company !== "object" || Array.isArray(company)) {
    throw new Error("company.json must contain a company object.");
  }
  const companyName = String(company.companyName || "").trim();
  if (!companyName) {
    throw new Error("company.json must include companyName.");
  }
  currentCompanyData = company;

  document.querySelectorAll("[data-company-name]").forEach((element) => {
    element.textContent = companyName;
  });
  document.querySelectorAll("[data-company-tagline]").forEach((element) => {
    element.textContent = String(company.tagline || "");
  });
  document.querySelectorAll("[data-company-description]").forEach((element) => {
    element.textContent = String(company.description || "");
  });
  document.querySelectorAll("[data-company-about]").forEach((element) => {
    element.textContent = String(company.about || "");
  });

  const logoUrl = safeAssetUrl(company.image_src || company.image_path);
  document.body.dataset.logoDisplay = logoUrl ? "image" : "text";
  const initials = companyInitials(companyName);
  document.querySelectorAll("[data-company-logo-slot]").forEach((slot) => {
    const variant = slot.dataset.logoVariant;
    slot.replaceChildren();
    if (logoUrl) {
      const image = document.createElement("img");
      image.src = logoUrl;
      image.alt = `${companyName} logo`;
      if (variant === "hero") {
        const wrapper = document.createElement("div");
        wrapper.className = "hero-image-wrap";
        wrapper.append(image);
        slot.append(wrapper);
      } else {
        slot.append(image);
      }
      return;
    }
    if (variant === "hero") {
      const monogram = document.createElement("div");
      monogram.className = "hero-monogram";
      monogram.setAttribute("aria-hidden", "true");
      const text = document.createElement("span");
      text.textContent = initials;
      monogram.append(text);
      slot.append(monogram);
    } else {
      const mark = document.createElement("span");
      mark.className = "brand-mark";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = initials;
      slot.append(mark);
    }
  });

  document.querySelectorAll(".brand").forEach((brand) => {
    brand.setAttribute("aria-label", `${companyName} home`);
  });
  document.querySelectorAll("[data-review-form]").forEach((form) => {
    form.dataset.company = companyName;
  });
  document.querySelectorAll('[data-company-subject="contact"]').forEach((field) => {
    field.value = `New contact request for ${companyName}`;
  });
  document.querySelectorAll('[data-company-subject="review"]').forEach((field) => {
    const form = field.closest("form");
    const rating = form?.querySelector('input[name="stars"]:checked')?.value;
    field.value = rating
      ? `New ${rating}-star customer review for ${companyName}`
      : `New customer review for ${companyName}`;
  });
  document
    .querySelectorAll("[data-company-appointment-title]")
    .forEach((frame) => {
      frame.title = `Schedule an appointment with ${companyName}`;
    });

  const startYear = Number(company.yearStarted);
  const copyrightYears = document.querySelector("#copyright-years");
  if (copyrightYears && Number.isInteger(startYear)) {
    copyrightYears.dataset.startYear = String(startYear);
    updateCopyrightYears();
  }
  const pageTitle = document.body.dataset.pageTitle;
  document.title =
    document.body.dataset.page === "index"
      ? companyName
      : `${pageTitle} | ${companyName}`;
  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.content = String(company.description || "");
  }
}

function normalizeHexColor(value) {
  const color = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : "";
}

function mixHexColor(color, target, amount) {
  const sourceValue = Number.parseInt(color.slice(1), 16);
  const targetValue = Number.parseInt(target.slice(1), 16);
  const channels = [16, 8, 0].map((shift) => {
    const source = (sourceValue >> shift) & 255;
    const destination = (targetValue >> shift) & 255;
    return Math.round(source + (destination - source) * amount);
  });
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function contrastHexColor(color) {
  const value = Number.parseInt(color.slice(1), 16);
  const channels = [16, 8, 0].map((shift) => {
    const channel = ((value >> shift) & 255) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return luminance > 0.48 ? "#172238" : "#ffffff";
}

function rgbaHexColor(color, percentage) {
  const alpha = Math.max(0, Math.min(100, percentage)) / 100;
  const value = Number.parseInt(color.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function blendHexColors(color, background, percentage) {
  return mixHexColor(background, color, Math.max(0, Math.min(100, percentage)) / 100);
}

const templateFonts = {
  modern: {
    url: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@700;800&display=swap",
    body: '"DM Sans", sans-serif',
    heading: '"Manrope", sans-serif',
  },
  clean: {
    url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
    body: '"Inter", sans-serif',
    heading: '"Inter", sans-serif',
  },
  classic: {
    url: "https://fonts.googleapis.com/css2?family=Lora:wght@600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap",
    body: '"Source Sans 3", sans-serif',
    heading: '"Lora", serif',
  },
};

function applyTemplateData(template) {
  if (!template || typeof template !== "object" || Array.isArray(template)) {
    throw new Error("template.json must contain a template object.");
  }
  const templateId = String(template.templateId || "");
  if (["logo-left", "logo-right", "centered"].includes(templateId)) {
    document.body.dataset.template = templateId;
  }
  const primary = normalizeHexColor(template.primaryColor);
  const secondary = normalizeHexColor(template.secondaryColor);
  const root = document.documentElement.style;
  if (primary) {
    root.setProperty("--brand", primary);
    root.setProperty("--brand-dark", mixHexColor(primary, "#000000", 0.22));
    root.setProperty("--brand-light", mixHexColor(primary, "#ffffff", 0.38));
    root.setProperty("--on-brand", contrastHexColor(primary));
  }
  if (secondary) {
    root.setProperty("--secondary", secondary);
    root.setProperty(
      "--secondary-dark",
      mixHexColor(secondary, "#000000", 0.24),
    );
    root.setProperty(
      "--secondary-light",
      mixHexColor(secondary, "#ffffff", 0.36),
    );
    root.setProperty("--on-secondary", contrastHexColor(secondary));
  }

  const usePageBackground = template.usePageColor === true;
  const pageColor =
    normalizeHexColor(template.pageColor) || "#fbfaf7";
  const transparent = template.transparentPageColor === true;
  const opacityValue = Number(template.pageColorOpacity);
  const opacity = Number.isFinite(opacityValue)
    ? Math.max(10, Math.min(100, opacityValue))
    : 70;
  const paper = usePageBackground
    ? transparent
      ? rgbaHexColor(pageColor, opacity)
      : pageColor
    : "#fbfaf7";
  const contrastBackground =
    usePageBackground && transparent
      ? blendHexColors(pageColor, secondary || "#172238", opacity)
      : usePageBackground
        ? pageColor
        : "#fbfaf7";
  root.setProperty("--paper", paper);
  root.setProperty("--on-page", contrastHexColor(contrastBackground));
  root.setProperty(
    "--page-blur",
    usePageBackground && transparent ? "18px" : "0px",
  );
  document.body.style.background =
    usePageBackground && transparent
      ? `radial-gradient(circle at 12% 28%, color-mix(in srgb, var(--brand) 48%, transparent), transparent 30rem), radial-gradient(circle at 88% 72%, color-mix(in srgb, var(--secondary-light) 45%, transparent), transparent 34rem), linear-gradient(135deg, var(--secondary-dark), var(--secondary), var(--brand-dark))`
      : paper;

  const backgroundImage = safeAssetUrl(
    template.background_image_src || template.background_image_path,
  );
  document.body.dataset.headerImage = String(Boolean(backgroundImage));
  if (backgroundImage) {
    root.setProperty("--on-secondary", "#111827");
  }
  const heroBackground = backgroundImage
    ? `url("${backgroundImage.replaceAll('"', '\\"')}") center center / cover no-repeat`
    : "radial-gradient(circle at 82% 42%, color-mix(in srgb, var(--brand) 28%, transparent), transparent 26rem), linear-gradient(135deg, var(--secondary-dark), var(--secondary) 58%, var(--secondary-dark))";
  root.setProperty("--hero-background", heroBackground);

  const sectionOrder = [
    "about",
    "services",
    "gallery",
    "contact",
    "reviews",
    "appointment",
  ];
  const enabledSections =
    template.sections && typeof template.sections === "object"
      ? template.sections
      : {};
  document.querySelectorAll("[data-section-link]").forEach((link) => {
    const sectionName = link.dataset.sectionLink;
    link.hidden =
      sectionName !== "index" && enabledSections[sectionName] === false;
  });
  const homeSections = document.querySelector("#home-sections");
  if (homeSections) {
    homeSections.dataset.pages = sectionOrder
      .filter((sectionName) => enabledSections[sectionName] !== false)
      .map((sectionName) => `${sectionName}.html`)
      .join(",");
  }
  document.querySelectorAll("[data-services-heading]").forEach((heading) => {
    heading.textContent = String(template.servicesHeading || "What we offer");
  });
  document.querySelectorAll("#service-list").forEach((list) => {
    const horizontal = template.servicesLayout === "horizontal";
    list.classList.toggle("horizontal-services", horizontal);
    list.classList.toggle("vertical-services", !horizontal);
  });
  const appointmentUrl = safeHttpUrl(template.appointmentUrl);
  document
    .querySelectorAll("[data-company-appointment-title]")
    .forEach((frame) => {
      frame.src = appointmentUrl || "about:blank";
    });

  const font = templateFonts[String(template.font || "")];
  if (font) {
    let fontLink = document.querySelector("[data-runtime-font]");
    if (!fontLink) {
      fontLink = document.createElement("link");
      fontLink.rel = "stylesheet";
      fontLink.dataset.runtimeFont = "";
      document.head.append(fontLink);
    }
    fontLink.href = font.url;
    document.body.style.fontFamily = font.body;
    root.setProperty("--heading-font", font.heading);
  }
}

function updateFormSettings(kind, settings) {
  const endpoint = safeHttpUrl(settings?.formEndpoint);
  const accessKey = String(settings?.accessKey || "").trim();
  const isWeb3Forms =
    endpoint &&
    new URL(endpoint).hostname.toLowerCase().replace(/^www\./, "") ===
      "api.web3forms.com";
  const configured = Boolean(endpoint && (!isWeb3Forms || accessKey));
  document
    .querySelectorAll(`[data-form-kind="${kind}"]`)
    .forEach((form) => {
      form.hidden = !configured;
      const container = form.closest("[data-form-container]");
      if (container) container.hidden = !configured;
      if (endpoint) form.action = endpoint;
      let accessKeyField = form.querySelector("[data-form-access-key]");
      if (!accessKeyField && accessKey) {
        accessKeyField = document.createElement("input");
        accessKeyField.type = "hidden";
        accessKeyField.name = "access_key";
        accessKeyField.dataset.formAccessKey = "";
        form.prepend(accessKeyField);
      }
      if (accessKeyField) accessKeyField.value = accessKey;
    });
  return configured;
}

function safeEmail(value) {
  const email = String(value || "").trim();
  return email && !/[\r\n]/.test(email) ? email : "";
}

function applyContactData(contact) {
  if (!contact || typeof contact !== "object" || Array.isArray(contact)) {
    throw new Error("contact.json must contain a contact object.");
  }
  const formEnabled = updateFormSettings("contact", contact);
  const email = safeEmail(contact.email);
  const phone = String(contact.phone || "").trim();
  const phoneHref = phone.replace(/[^+\d]/g, "");
  const address = String(contact.address || "").trim();
  document.querySelectorAll("[data-contact-heading]").forEach((heading) => {
    heading.textContent = formEnabled ? "Send us a message" : "Contact us";
  });
  document.querySelectorAll("[data-contact-copy]").forEach((copy) => {
    copy.textContent = formEnabled
      ? "Tell us what you need and we will get back to you with the next steps."
      : "Use the contact details below to get in touch.";
  });

  document.querySelectorAll("[data-contact-details]").forEach((list) => {
    list.replaceChildren();
    if (email) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `mailto:${email}`;
      link.textContent = email;
      item.append(link);
      list.append(item);
    }
    if (phone && phoneHref) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `tel:${phoneHref}`;
      link.textContent = phone;
      item.append(link);
      list.append(item);
    }
    if (address) {
      const item = document.createElement("li");
      item.textContent = address;
      list.append(item);
    }
    list.hidden = list.childElementCount === 0;
  });

  document
    .querySelectorAll('[data-contact-action-container="call"]')
    .forEach((container) => {
      const visible = Boolean(contact.showCall && phone && phoneHref);
      container.hidden = !visible;
      const button = container.querySelector("[data-contact-action]");
      const link = container.querySelector(".contact-action-details a");
      const copy = container.querySelector("[data-copy-value]");
      if (button) {
        button.dataset.contactValue = phone;
        button.dataset.contactHref = `tel:${phoneHref}`;
      }
      if (link) {
        link.href = `tel:${phoneHref}`;
        link.textContent = phone;
      }
      if (copy) copy.dataset.copyValue = phone;
    });

  document
    .querySelectorAll('[data-contact-action-container="email"]')
    .forEach((container) => {
      const visible = Boolean(contact.showEmail && email);
      container.hidden = !visible;
      const link = container.querySelector(".contact-action-details a");
      const copy = container.querySelector("[data-copy-value]");
      if (link) {
        link.href = `mailto:${email}`;
        link.textContent = email;
      }
      if (copy) copy.dataset.copyValue = email;
    });
}

function applySocialMediaData(social) {
  if (!social || typeof social !== "object" || Array.isArray(social)) {
    throw new Error("socialMedia.json must contain a social media object.");
  }
  document.querySelectorAll("[data-social-platform]").forEach((link) => {
    const url = safeHttpUrl(social[link.dataset.socialPlatform]);
    link.hidden = !url;
    if (url) link.href = url;
  });
}

function updateSocialStripVisibility() {
  document.querySelectorAll("[data-social-location]").forEach((strip) => {
    const actions = strip.querySelector(".social-strip-track");
    strip.hidden = ![...actions.children].some((item) => !item.hidden);
  });
}

function applyRuntimeSettings(siteData) {
  const social = siteData.socialMedia || {};
  const contact = siteData.contact || {};
  const review = siteData.reviewSettings || {};
  const template = {
    ...(siteData.template || {}),
    appointmentUrl: siteData.appointment?.url || "",
  };
  applySocialMediaData(social);
  applyContactData(contact);
  updateFormSettings("review", review);
  applyTemplateData(template);
  updateSocialStripVisibility();
}

function youtubeEmbedUrl(value) {
  const safeUrl = safeHttpUrl(value);
  if (!safeUrl) return "";
  const url = new URL(safeUrl);
  const host = url.hostname.replace(/^www\./, "");
  let videoId = "";
  if (host === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] || "";
  } else if (["youtube.com", "m.youtube.com"].includes(host)) {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v") || "";
    } else if (
      url.pathname.startsWith("/embed/") ||
      url.pathname.startsWith("/shorts/")
    ) {
      videoId = url.pathname.split("/").filter(Boolean)[1] || "";
    }
  }
  return /^[A-Za-z0-9_-]{6,20}$/.test(videoId)
    ? `https://www.youtube-nocookie.com/embed/${videoId}`
    : "";
}

function renderServiceMedia(service) {
  const video = safeHttpUrl(service.video);
  const youtube = youtubeEmbedUrl(video);
  if (youtube) {
    return `<div class="service-media service-video"><iframe src="${escapeHtml(youtube)}" title="${escapeHtml(service.title)} video" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
  }
  const host = video ? new URL(video).hostname : "";
  if (video && (host.endsWith("facebook.com") || host.endsWith("fb.watch"))) {
    const embed = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(video)}&show_text=false`;
    return `<div class="service-media service-video"><iframe src="${escapeHtml(embed)}" title="${escapeHtml(service.title)} video" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`;
  }
  if (video) {
    const path = new URL(video).pathname.toLowerCase();
    if ([".mp4", ".webm", ".ogg", ".mov", ".m4v"].some((extension) => path.endsWith(extension))) {
      return `<div class="service-media service-video"><video src="${escapeHtml(video)}" controls preload="metadata" playsinline title="${escapeHtml(service.title)} video"></video></div>`;
    }
    return `<div class="service-media service-video"><iframe src="${escapeHtml(video)}" title="${escapeHtml(service.title)} video" loading="lazy" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
  }
  const image = safeAssetUrl(service.image_src || service.image_path);
  return image
    ? `<div class="service-media"><img src="${escapeHtml(image)}" alt="${escapeHtml(service.title)}" loading="lazy" /></div>`
    : "";
}

async function renderServices(services = currentSiteData?.services) {
  const list = document.querySelector("#service-list");
  const status = document.querySelector("#services-status");
  if (!list) return;
  try {
    if (!Array.isArray(services)) throw new Error("services.json must contain a list.");
    list.innerHTML = services
      .map((service, index) => {
        const titleOnly =
          Boolean(String(service.title || "").trim()) &&
          ![
            service.description,
            service.price,
            service.link,
            service.paymentLink,
            service.image_src,
            service.image_path,
            service.video,
          ].some(Boolean);
        const hasFooter =
          Boolean(service.price) ||
          Boolean(safeHttpUrl(service.link)) ||
          Boolean(safeHttpUrl(service.paymentLink));
        return `
          <article class="service-card${titleOnly ? " compact-service-card" : ""}">
            ${renderServiceMedia(service)}
            <div class="service-card-content">
              <span class="service-number">${String(index + 1).padStart(2, "0")}</span>
              <h3>${escapeHtml(service.title)}</h3>
              ${service.description ? `<p>${escapeHtml(service.description)}</p>` : ""}
              ${hasFooter ? `<div class="service-card-footer">
                ${service.price ? `<strong class="service-price">${escapeHtml(service.price)}</strong>` : ""}
                ${
                  safeHttpUrl(service.link)
                    ? `<a class="service-link" href="${escapeHtml(safeHttpUrl(service.link))}" target="_blank" rel="noopener noreferrer">View offering <span aria-hidden="true">↗</span></a>`
                    : ""
                }
                ${
                  safeHttpUrl(service.paymentLink)
                    ? `<a class="service-payment-link" href="${escapeHtml(safeHttpUrl(service.paymentLink))}" target="_blank" rel="noopener noreferrer">Pay now <span aria-hidden="true">↗</span></a>`
                    : ""
                }
              </div>` : ""}
            </div>
          </article>`;
      })
      .join("");
    status.hidden = true;
  } catch (error) {
    status.textContent = error.message;
    status.classList.add("error");
  }
}

async function renderReviews(reviews = currentSiteData?.reviews) {
  const list = document.querySelector("#review-list");
  const status = document.querySelector("#reviews-status");
  if (!list) return;
  try {
    if (!Array.isArray(reviews)) throw new Error("reviews.json must contain a list.");
    if (reviews.length === 0) {
      status.textContent = "No reviews.";
      list.closest("[data-carousel]")?.setAttribute("hidden", "");
      return;
    }
    list.innerHTML = reviews
      .map(
        (item) => `
          <blockquote>
            ${
              Number.isInteger(Number(item.stars)) &&
              Number(item.stars) >= 1 &&
              Number(item.stars) <= 5
                ? `<div class="review-stars" aria-label="${Number(item.stars)} out of 5 stars">${"★".repeat(Number(item.stars))}<span aria-hidden="true">${"★".repeat(5 - Number(item.stars))}</span></div>`
                : ""
            }
            <span class="quote-mark">“</span>
            <p>${escapeHtml(item.review)}</p>
            <footer>
              <strong>${escapeHtml(item.name)}</strong>
              ${item.date ? `<time datetime="${escapeHtml(item.date)}">${escapeHtml(formatReviewDate(item.date))}</time>` : ""}
            </footer>
          </blockquote>`,
      )
      .join("");
    status.hidden = true;
  } catch (error) {
    status.textContent = error.message;
    status.classList.add("error");
  }
}

function formatReviewDate(value) {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

async function renderGallery(images = currentSiteData?.gallery) {
  const list = document.querySelector("#gallery-list");
  const status = document.querySelector("#gallery-status");
  if (!list) return;
  try {
    if (!Array.isArray(images)) throw new Error("gallery.json must contain a list.");
    list.innerHTML = images
      .map((image) => {
        const imageUrl = safeAssetUrl(image.image_src || image.image_path);
        return `
          <figure>
            <button class="gallery-lightbox-trigger" type="button" data-gallery-open data-gallery-src="${escapeHtml(imageUrl)}" aria-label="View full image">
              <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(image.alt || `${currentCompanyData?.companyName || "Company"} gallery image`)}" loading="lazy" />
            </button>
          </figure>`;
      })
      .join("");
    status.hidden = true;
  } catch (error) {
    status.textContent = error.message;
    status.classList.add("error");
  }
}

async function loadHomeSections() {
  const container = document.querySelector("#home-sections");
  if (!container) return;
  const status = document.querySelector("#home-sections-status");
  const pages = (container.dataset.pages || "").split(",").filter(Boolean);
  try {
    const pageDocuments = await Promise.all(
      pages.map(async (page) => {
        const response = await fetch(page, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Could not load ${page} (${response.status}).`);
        }
        const source = await response.text();
        const parsed = new DOMParser().parseFromString(source, "text/html");
        const main = parsed.querySelector("main");
        if (!main) throw new Error(`${page} does not contain a main section.`);
        return { page, content: main.innerHTML };
      }),
    );

    status.remove();
    pageDocuments.forEach(({ page, content }) => {
      const section = document.createElement("section");
      section.className = "home-page-section";
      section.id = page.replace(/\.html$/, "");
      section.innerHTML = content;
      container.append(section);
    });
  } catch (error) {
    status.textContent = error.message;
    status.classList.add("error");
  }
}

function initializeHomeNavigation() {
  const container = document.querySelector("#home-sections");
  if (!container) return;
  const targets = [
    document.querySelector("#top"),
    ...container.querySelectorAll(".home-page-section"),
  ].filter(Boolean);
  let currentId = "";
  let frameRequested = false;

  function updateActiveNavigation() {
    frameRequested = false;
    const requestedId = document.body.dataset.navigationTarget;
    let activeTarget = requestedId
      ? targets.find((target) => target.id === requestedId)
      : null;
    if (!activeTarget) {
      const viewportTop = 80;
      const viewportBottom = window.innerHeight;
      let largestVisibleArea = -1;
      for (const target of targets) {
        const bounds = target.getBoundingClientRect();
        const visibleArea = Math.max(
          0,
          Math.min(bounds.bottom, viewportBottom) -
            Math.max(bounds.top, viewportTop),
        );
        if (visibleArea > largestVisibleArea) {
          largestVisibleArea = visibleArea;
          activeTarget = target;
        }
      }
    }

    if (
      !requestedId &&
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 4
    ) {
      activeTarget = targets[targets.length - 1];
    }

    if (!activeTarget || activeTarget.id === currentId) return;
    currentId = activeTarget.id;
    const href = `#${currentId}`;
    document.body.dataset.currentSection = currentId;
    document
      .querySelectorAll(".desktop-nav a, .mobile-nav a")
      .forEach((link) => {
        const isActive = link.getAttribute("href") === href;
        link.classList.toggle("active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
  }

  function requestNavigationUpdate() {
    const requestedId = document.body.dataset.navigationTarget;
    if (requestedId) {
      window.clearTimeout(window.navigationTargetTimer);
      window.navigationTargetTimer = window.setTimeout(() => {
        if (document.body.dataset.navigationTarget === requestedId) {
          delete document.body.dataset.navigationTarget;
          requestNavigationUpdate();
        }
      }, 180);
    }
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(updateActiveNavigation);
  }

  window.addEventListener("scroll", requestNavigationUpdate, { passive: true });
  window.addEventListener("resize", requestNavigationUpdate);
  updateActiveNavigation();
}

async function initializeDataPages() {
  try {
    const siteData = await loadJson("data/data.json");
    if (!siteData || typeof siteData !== "object" || Array.isArray(siteData)) {
      throw new Error("data.json must contain a website data object.");
    }
    currentSiteData = siteData;
    applyCompanyData(siteData.company);
    applyRuntimeSettings(siteData);
    await loadHomeSections();
    applyCompanyData(siteData.company);
    applyRuntimeSettings(siteData);
    await Promise.all([
      renderServices(siteData.services),
      renderReviews(siteData.reviews),
      renderGallery(siteData.gallery),
    ]);
  } catch (error) {
    showFormToast(error.message, true);
  }
  await initializeWeb3FormsCaptcha();
  initializeReviewForms();
  initializeCarousels();
  initializeHomeNavigation();
  if (window.location.hash) {
    document.querySelector(window.location.hash)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

initializeDataPages();
"""


def validate_configuration(payload):
    if not isinstance(payload, dict):
        raise ValueError("Request body must be an object.")

    sections = payload.get("sections")
    expected_sections = {
        "about",
        "services",
        "gallery",
        "reviews",
        "contact",
        "appointment",
    }
    if not isinstance(sections, dict) or set(sections) != expected_sections:
        raise ValueError("Section selection is invalid.")
    if any(not isinstance(value, bool) for value in sections.values()):
        raise ValueError("Section selections must be true or false.")

    data = {
        "companyName": clean_text(
            payload.get("companyName"),
            "Company name",
            True,
            COMPANY_NAME_MAX_LENGTH,
        ),
        "template": clean_text(payload.get("template"), "Template", True, 20),
        "yearStarted": validate_year(payload.get("yearStarted")),
        "tagline": clean_text(
            payload.get("tagline", ""),
            "Tagline",
            False,
            TAGLINE_MAX_LENGTH,
        ),
        "description": clean_text(
            payload.get("description", ""),
            "Company description",
            False,
            DESCRIPTION_MAX_LENGTH,
        ),
        "brandColor": validate_color(payload.get("brandColor")),
        "secondaryColor": validate_color(payload.get("secondaryColor")),
        "headerTextColor": clean_text(
            payload.get("headerTextColor", "light"),
            "Header text color",
            True,
            10,
        ),
        "pageColor": validate_color(payload.get("pageColor", "#fbfaf7")),
        "usePageColor": payload.get("usePageColor", False),
        "transparentPageColor": payload.get("transparentPageColor", False),
        "pageColorOpacity": validate_percentage(
            payload.get("pageColorOpacity", 70), "Page color strength"
        ),
        "font": clean_text(payload.get("font"), "Font", True, 20),
        "backgroundImage": payload.get("backgroundImage"),
        "about": clean_text(
            payload.get("about", ""),
            "About content",
            sections["about"],
            ABOUT_MAX_LENGTH,
        ),
        "services": parse_services(payload.get("services", [])),
        "servicesLayout": clean_text(
            payload.get("servicesLayout", "vertical"),
            "Services layout",
            True,
            20,
        ),
        "servicesHeading": clean_text(
            payload.get("servicesHeading", "What we offer"),
            "Services section heading",
            False,
            120,
        )
        or "What we offer",
        "reviews": parse_reviews(payload.get("reviews", [])),
        "reviewFormEndpoint": validate_url(
            payload.get("reviewFormEndpoint", ""),
            "Review form service endpoint",
            False,
        ),
        "reviewAccessKey": clean_text(
            payload.get("reviewAccessKey", ""),
            "Review Web3Forms access key",
            False,
            200,
        ),
        "formEndpoint": validate_url(
            payload.get("formEndpoint", ""),
            "Form service endpoint",
            sections["contact"],
        ),
        "contactAccessKey": clean_text(
            payload.get("contactAccessKey", ""),
            "Contact Web3Forms access key",
            False,
            200,
        ),
        "email": clean_text(payload.get("email", ""), "Contact email", True, 320),
        "phone": clean_text(payload.get("phone", ""), "Phone", False, 80),
        "showCall": payload.get("showCall", False),
        "showEmail": payload.get("showEmail", False),
        "address": clean_text(payload.get("address", ""), "Address", False, 300),
        "instagram": validate_url(
            payload.get("instagram", ""), "Instagram URL", False
        ),
        "facebook": validate_url(
            payload.get("facebook", ""), "Facebook URL", False
        ),
        "linkedin": validate_url(
            payload.get("linkedin", ""), "LinkedIn URL", False
        ),
        "twitter": validate_url(
            payload.get("twitter", ""), "Twitter or X URL", False
        ),
        "youtube": validate_url(
            payload.get("youtube", ""), "YouTube URL", False
        ),
        "applePodcast": validate_url(
            payload.get("applePodcast", ""), "Apple Podcasts URL", False
        ),
        "spotify": validate_url(
            payload.get("spotify", ""), "Spotify URL", False
        ),
        "appointmentUrl": validate_calendly_url(
            payload.get("appointmentUrl", ""), sections["appointment"]
        ),
        "sections": sections,
    }

    if data["template"] not in TEMPLATES:
        raise ValueError("Template must be logo-left, logo-right, or centered.")
    if data["headerTextColor"] not in {"light", "dark"}:
        raise ValueError("Header text color must be light or dark.")
    if data["font"] not in FONTS:
        raise ValueError("Font must be modern, clean, or classic.")
    if not isinstance(data["usePageColor"], bool) or not isinstance(
        data["transparentPageColor"], bool
    ):
        raise ValueError(
            "Page background and transparency options must be true or false."
        )
    if data["servicesLayout"] not in {"vertical", "horizontal"}:
        raise ValueError("Services layout must be vertical or horizontal.")
    if not isinstance(data["showCall"], bool) or not isinstance(
        data["showEmail"], bool
    ):
        raise ValueError("Call and email display options must be true or false.")
    if data["showCall"] and not data["phone"]:
        raise ValueError("Add a phone number or turn off the call action.")
    if data["showEmail"] and not data["email"]:
        raise ValueError("Add an email address or turn off the email action.")

    if sections["services"] and not data["services"]:
        raise ValueError("Add at least one service or turn off the Services section.")
    if (
        sections["reviews"]
        and not data["reviewFormEndpoint"]
        and not data["formEndpoint"]
    ):
        raise ValueError(
            "Add a review form service endpoint so review submissions can reach the owner."
        )
    review_endpoint = data["reviewFormEndpoint"] or data["formEndpoint"]
    review_access_key = data["reviewAccessKey"] or data["contactAccessKey"]
    logo = payload.get("logo")
    gallery = payload.get("gallery", [])
    decoded_logo = None
    if logo is not None:
        decoded_logo = decode_image(logo, "Logo")
    background_image = data["backgroundImage"]
    decoded_background_image = (
        decode_image(background_image, "Background")
        if background_image
        else None
    )

    if not isinstance(gallery, list) or len(gallery) > MAX_GALLERY_IMAGES:
        raise ValueError(
            f"Gallery must contain no more than {MAX_GALLERY_IMAGES} images."
        )
    decoded_gallery = [
        decode_image(image, f"Gallery image {index}")
        for index, image in enumerate(gallery, start=1)
    ]
    decoded_service_images = [
        decode_image(service["image"], f"Service {index} image")
        if service["image"]
        else None
        for index, service in enumerate(data["services"], start=1)
    ]
    if sections["gallery"] and not decoded_gallery:
        raise ValueError(
            "Add at least one gallery image or turn off the Gallery section."
        )
    return (
        data,
        decoded_logo,
        decoded_gallery,
        decoded_service_images,
        decoded_background_image,
    )


def build_generated_site(data, asset_paths):
    data = {
        **data,
        "companyName": "Company",
        "yearStarted": datetime.now().year,
        "tagline": "",
        "description": "",
        "about": "",
        "services": [],
        "servicesLayout": "vertical",
        "servicesHeading": "What we offer",
        "reviews": [],
        "reviewFormEndpoint": "https://api.web3forms.com/submit",
        "reviewAccessKey": "",
        "formEndpoint": "https://api.web3forms.com/submit",
        "contactAccessKey": "",
        "email": "",
        "phone": "",
        "showCall": False,
        "showEmail": False,
        "address": "",
        "instagram": "",
        "facebook": "",
        "linkedin": "",
        "twitter": "",
        "youtube": "",
        "applePodcast": "",
        "spotify": "",
        "appointmentUrl": "",
        "template": "logo-left",
        "brandColor": "#c79245",
        "secondaryColor": "#172238",
        "headerTextColor": "light",
        "usePageColor": False,
        "pageColor": "#fbfaf7",
        "transparentPageColor": False,
        "pageColorOpacity": 70,
        "font": "modern",
        "backgroundImage": None,
        "sections": {
            "about": True,
            "services": True,
            "gallery": True,
            "reviews": True,
            "contact": True,
            "appointment": True,
        },
    }
    asset_paths = {"logo": "", "gallery": [], "backgroundImage": ""}
    _, styles_css, _ = build_preview_site(data, asset_paths)
    styles_css += GENERATED_PAGES_CSS
    company = data["companyName"]
    escaped_company = html.escape(company)
    enabled = data["sections"]
    navigation = [("index.html", "Home")]
    navigation.extend(
        (f"{name}.html", label)
        for name, label in (
            ("about", "About"),
            ("services", "What we offer"),
            ("gallery", "Gallery"),
            ("contact", "Contact"),
            ("reviews", "Reviews"),
            ("appointment", "Appointment"),
        )
        if enabled[name]
    )

    logo = (
        f'<img src="{html.escape(asset_paths["logo"])}" alt="{escaped_company} logo" />'
        if asset_paths["logo"]
        else f'<span class="brand-mark" aria-hidden="true">{html.escape(initials(company))}</span>'
    )
    hero_logo = (
        f'<div class="hero-image-wrap"><img src="{html.escape(asset_paths["logo"])}" alt="{escaped_company} logo" /></div>'
        if asset_paths["logo"]
        else f'<div class="hero-monogram" aria-hidden="true"><span>{html.escape(initials(company))}</span></div>'
    )
    brand_logo_slot = (
        f'<span class="company-logo-slot" data-company-logo-slot data-logo-variant="brand">{logo}</span>'
    )
    hero_logo_slot = (
        f'<span class="company-logo-slot" data-company-logo-slot data-logo-variant="hero">{hero_logo}</span>'
    )

    def nav_links(active_page, home=False):
        return "".join(
            f'<a href="{"#top" if href == "index.html" else "#" + href.removesuffix(".html") if home else href}" data-section-link="{href.removesuffix(".html")}"{" class=\"active\"" if href == active_page else ""}>{html.escape(label)}</a>'
            for href, label in navigation
        )

    def document(page_name, title, description, body, home=False):
        links = nav_links(page_name, home=home)
        if home:
            header = f"""
    <header class="site-header">
      <nav class="nav-shell" aria-label="Main navigation">
        <a class="brand" href="index.html" aria-label="{escaped_company} home">{brand_logo_slot}<strong data-company-name>{escaped_company}</strong></a>
        <div class="desktop-nav">{links}</div>
        <button class="menu-button" type="button" aria-expanded="false" aria-controls="mobile-menu">
          <span></span><span></span><span></span><span class="sr-only">Open navigation</span>
        </button>
      </nav>
      <div class="mobile-nav" id="mobile-menu" hidden>{links}</div>
      <div class="hero" id="top">
        <div class="hero-copy">
          <p class="eyebrow">Welcome to <span data-company-name>{escaped_company}</span></p>
          <h1 data-company-tagline>{html.escape(data["tagline"])}</h1>
          <p class="hero-description" data-company-description>{html.escape(data["description"])}</p>
          <div class="hero-actions">
            {'<a class="primary-button" href="#contact">Send a message <span aria-hidden="true">→</span></a>' if enabled["contact"] else ''}
            {f'<a class="secondary-link" href="#{navigation[1][0].removesuffix(".html")}">Learn more <span aria-hidden="true">↓</span></a>' if len(navigation) > 1 else ''}
          </div>
        </div>
        <div class="hero-art">{hero_logo_slot}<strong class="hero-text-logo" data-company-name>{escaped_company}</strong></div>
      </div>
    </header>"""
        else:
            header = f"""
    <header class="page-site-header">
      <nav class="nav-shell" aria-label="Main navigation">
        <a class="brand" href="index.html" aria-label="{escaped_company} home">{brand_logo_slot}<strong data-company-name>{escaped_company}</strong></a>
        <div class="desktop-nav">{links}</div>
        <button class="menu-button" type="button" aria-expanded="false" aria-controls="mobile-menu">
          <span></span><span></span><span></span><span class="sr-only">Open navigation</span>
        </button>
      </nav>
      <div class="mobile-nav" id="mobile-menu" hidden>{links}</div>
      <div class="page-banner">
        <p class="eyebrow" data-company-name>{html.escape(company)}</p>
        <h1>{html.escape(title)}</h1>
      </div>
    </header>"""

        return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="{html.escape(description, quote=True)}" />
    <title>{html.escape(title)} | {escaped_company}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="{html.escape(FONTS[data["font"]]["url"], quote=True)}" rel="stylesheet" />
    <link rel="stylesheet" href="styles.css?v={SITE_ASSET_VERSION}" />
    <script src="script.js?v={SITE_ASSET_VERSION}" defer></script>
  </head>
  <body data-page="{html.escape(page_name.removesuffix(".html"))}" data-page-title="{html.escape(title, quote=True)}" data-template="{html.escape(data["template"], quote=True)}" data-header-text="{html.escape(data["headerTextColor"], quote=True)}" data-header-image="{"true" if asset_paths.get("backgroundImage") else "false"}" data-logo-display="{"image" if asset_paths.get("logo") else "text"}">
    {header}
    {body}
    {build_social_strip(data, "footer", False, True)}
    <footer class="site-footer">
      <a class="brand footer-brand" href="index.html">{brand_logo_slot}<strong data-company-name>{escaped_company}</strong></a>
      <div class="footer-meta">
        <small>© <span id="copyright-years" data-start-year="{data["yearStarted"]}"></span> <span data-company-name>{escaped_company}</span>. All rights reserved.</small>
        <small class="gudispace-attribution">Built using <a href="https://gudispace.com/" target="_blank" rel="noopener noreferrer">GudiSpace.com</a></small>
      </div>
    </footer>
  </body>
</html>
"""

    home_page_names = [href for href, _ in navigation if href != "index.html"]
    home_page_list = ",".join(home_page_names)
    pages = {
        "index.html": document(
            "index.html",
            company,
            data["description"],
            f"""{build_social_strip(data, "top", True, True)}
    <main class="home-main" id="home-sections" data-pages="{html.escape(home_page_list, quote=True)}">
      <div class="data-status" id="home-sections-status">Loading website sections…</div>
    </main>""",
            home=True,
        )
    }

    if enabled["about"]:
        pages["about.html"] = document(
            "about.html",
            "About us",
            f"Learn about {company}.",
            f"""<main class="page-main">
      <section class="content-section about-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">About us</p>
            <h2>About <span data-company-name>{escaped_company}</span></h2>
          </div>
        </div>
        <div class="about-card"><p data-company-about>{html.escape(data["about"])}</p></div>
      </section>
    </main>""",
        )

    if enabled["services"]:
        if data["servicesLayout"] == "horizontal":
            services_container = """
        <div class="carousel-shell" data-carousel>
          <button class="carousel-arrow previous" type="button" data-carousel-direction="-1" aria-label="Previous services">←</button>
          <div class="service-grid horizontal-services" id="service-list" data-carousel-track></div>
          <button class="carousel-arrow next" type="button" data-carousel-direction="1" aria-label="Next services">→</button>
        </div>"""
        else:
            services_container = (
                '<div class="service-grid vertical-services" id="service-list"></div>'
            )
        pages["services.html"] = document(
            "services.html",
            "What we offer",
            f"What {company} offers.",
            f"""<main class="page-main">
      <section class="content-section">
        {section_heading("Our work", "What we offer").replace("<h2>", '<h2 data-services-heading>')}
        <div class="data-status" id="services-status">Loading services…</div>
        {services_container}
      </section>
    </main>""",
        )

    if enabled["gallery"]:
        pages["gallery.html"] = document(
            "gallery.html",
            "Gallery",
            f"Gallery from {company}.",
            f"""<main class="page-main">
      <section class="content-section">
        {section_heading("Explore our work", "Gallery")}
        <div class="data-status" id="gallery-status">Loading gallery…</div>
        <div class="carousel-shell" data-carousel>
          <button class="carousel-arrow previous" type="button" data-carousel-direction="-1" aria-label="Previous gallery images">←</button>
          <div class="gallery-grid" id="gallery-list" data-carousel-track></div>
          <button class="carousel-arrow next" type="button" data-carousel-direction="1" aria-label="Next gallery images">→</button>
        </div>
      </section>
    </main>""",
        )

    if enabled["reviews"]:
        pages["reviews.html"] = document(
            "reviews.html",
            "Customer reviews",
            f"Customer reviews for {company}.",
            f"""<main class="page-main reviews-page">
      <section class="content-section">
        {section_heading("Customer feedback", "Reviews")}
        <div class="data-status" id="reviews-status">Loading reviews…</div>
        <div class="carousel-shell" data-carousel>
          <button class="carousel-arrow previous" type="button" data-carousel-direction="-1" aria-label="Previous reviews">←</button>
          <div class="review-grid" id="review-list" data-carousel-track></div>
          <button class="carousel-arrow next" type="button" data-carousel-direction="1" aria-label="Next reviews">→</button>
        </div>
        {build_review_form(data, True)}
      </section>
    </main>""",
        )

    if enabled["contact"]:
        contact_bits = []
        if data["email"]:
            contact_bits.append(
                f'<li><a href="mailto:{html.escape(data["email"])}">{html.escape(data["email"])}</a></li>'
            )
        if data["phone"]:
            phone_link = re.sub(r"[^+\d]", "", data["phone"])
            contact_bits.append(
                f'<li><a href="tel:{html.escape(phone_link)}">{html.escape(data["phone"])}</a></li>'
            )
        if data["address"]:
            contact_bits.append(f"<li>{html.escape(data['address'])}</li>")
        pages["contact.html"] = document(
            "contact.html",
            "Contact",
            f"Contact {company}.",
            f"""<main class="page-main">
      <section class="content-section contact-section">
        <div class="contact-copy">
          <p class="eyebrow">Start a conversation</p>
          <h2 data-contact-heading>Contact us</h2>
          <p data-contact-copy>Use the contact details below to get in touch.</p>
          <ul class="contact-details" data-contact-details{" hidden" if not contact_bits else ""}>{"".join(contact_bits)}</ul>
        </div>
        {build_contact_form(data, True)}
      </section>
    </main>""",
        )

    if enabled["appointment"]:
        pages["appointment.html"] = document(
            "appointment.html",
            "Schedule an appointment",
            f"Schedule an appointment with {company}.",
            f"""<main class="page-main">
      <section class="content-section appointment-section">
        {section_heading("Book a time", "Schedule an appointment")}
        <div class="appointment-card">
          <iframe
            class="appointment-frame"
            src="{html.escape(data["appointmentUrl"], quote=True)}"
            title="Schedule an appointment with {escaped_company}"
            data-company-appointment-title
            loading="lazy"
          ></iframe>
        </div>
      </section>
    </main>""",
        )

    return pages, styles_css, SITE_JS + DATA_PAGE_JS


def generate_website(payload):
    (
        data,
        decoded_logo,
        decoded_gallery,
        decoded_service_images,
        decoded_background_image,
    ) = (
        validate_configuration(payload)
    )

    output_text = clean_text(payload.get("outputPath"), "Output folder", True, 2000)
    output_path = Path(output_text).expanduser().resolve()
    if output_path == PROJECT_DIR:
        raise ValueError("The output folder cannot be the website builder folder itself.")
    if output_path.exists() and not output_path.is_dir():
        raise ValueError("The output path exists and is not a folder.")
    if output_path.exists() and any(output_path.iterdir()):
        raise ValueError("The output folder must be empty or not exist yet.")

    output_path.mkdir(parents=True, exist_ok=True)
    data_path = output_path / "data"
    company_path = data_path / "company"
    company_path.mkdir(parents=True, exist_ok=True)
    asset_paths = {"logo": "", "gallery": [], "backgroundImage": ""}
    logo_source = payload.get("logo")
    background_source = data["backgroundImage"]
    gallery_sources = payload.get("gallery", [])
    logo_thumbnail = media_thumbnail(logo_source)
    background_thumbnail = media_thumbnail(background_source)
    logo_id = media_id(logo_source, "company")
    background_id = media_id(background_source, "background")
    gallery_thumbnails = [media_thumbnail(image) for image in gallery_sources]
    gallery_ids = [media_id(image, "gallery") for image in gallery_sources]

    if decoded_logo is not None:
        raw, extension = decoded_logo
        logo_name = f"{logo_id}{extension}"
        (company_path / logo_name).write_bytes(raw)
        asset_paths["logo"] = f"data/company/{logo_name}"

    if decoded_background_image is not None:
        background_path = data_path / "background"
        background_path.mkdir(parents=True, exist_ok=True)
        raw, extension = decoded_background_image
        background_name = f"{background_id}{extension}"
        (background_path / background_name).write_bytes(raw)
        asset_paths["backgroundImage"] = f"data/background/{background_name}"

    if decoded_gallery:
        (data_path / "gallery").mkdir(parents=True, exist_ok=True)
    for index, (raw, extension) in enumerate(decoded_gallery, start=1):
        image_name = f"{gallery_ids[index - 1]}{extension}"
        (data_path / "gallery" / image_name).write_bytes(raw)
        asset_paths["gallery"].append(f"data/gallery/{image_name}")

    generated_services = []
    for index, (service, decoded_image) in enumerate(
        zip(data["services"], decoded_service_images), start=1
    ):
        generated_service = {**service, "image": ""}
        if decoded_image:
            service_images_path = data_path / "service"
            service_images_path.mkdir(parents=True, exist_ok=True)
            raw, extension = decoded_image
            image_name = f"{service['image_id']}{extension}"
            (service_images_path / image_name).write_bytes(raw)
            generated_service["image"] = f"data/service/{image_name}"
        generated_services.append(generated_service)
    data["services"] = generated_services

    pages, styles_css, script_js = build_generated_site(data, asset_paths)
    for filename, page_html in pages.items():
        (output_path / filename).write_text(page_html, encoding="utf-8")
    (output_path / "styles.css").write_text(styles_css, encoding="utf-8")
    (output_path / "script.js").write_text(script_js, encoding="utf-8")
    (data_path / "data.json").write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "company": {
                "companyName": data["companyName"],
                "image_id": logo_id,
                "image_path": asset_paths["logo"],
                "image_src": "",
                "image_thumbnail": logo_thumbnail,
                "yearStarted": data["yearStarted"],
                "tagline": data["tagline"],
                "description": data["description"],
                "about": data["about"],
                },
                "template": {
                    "templateId": data["template"],
                    "primaryColor": data["brandColor"],
                    "secondaryColor": data["secondaryColor"],
                    "headerTextColor": data["headerTextColor"],
                    "usePageColor": data["usePageColor"],
                    "pageColor": data["pageColor"],
                    "transparentPageColor": data["transparentPageColor"],
                    "pageColorOpacity": data["pageColorOpacity"],
                    "font": data["font"],
                    "background_image_id": background_id,
                    "background_image_path": asset_paths["backgroundImage"],
                    "background_image_src": "",
                    "background_image_thumbnail": background_thumbnail,
                    "servicesHeading": data["servicesHeading"],
                    "servicesLayout": data["servicesLayout"],
                    "sections": data["sections"],
                },
                "services": [
                    {
                        **{
                            key: value
                            for key, value in service.items()
                            if key != "image"
                        },
                        "image_path": service["image"],
                        "image_src": "",
                        "image_thumbnail": service["image_thumbnail"],
                    }
                    for service in data["services"]
                ],
                "gallery": [
                    {
                        "image_id": gallery_ids[index],
                        "image_path": path,
                        "image_src": "",
                        "image_thumbnail": gallery_thumbnails[index],
                        "alt": "",
                    }
                    for index, path in enumerate(asset_paths["gallery"])
                ],
                "reviews": [
                {
                    "name": review["name"],
                    "review": review["review"],
                    "date": review["date"],
                    "stars": review["stars"],
                }
                for review in data["reviews"]
                ],
                "contact": {
                    "formEndpoint": data["formEndpoint"],
                    "accessKey": data["contactAccessKey"],
                    "email": data["email"],
                    "phone": data["phone"],
                    "address": data["address"],
                    "showCall": data["showCall"],
                    "showEmail": data["showEmail"],
                },
                "reviewSettings": {
                    "formEndpoint": data["reviewFormEndpoint"]
                    or data["formEndpoint"],
                    "accessKey": data["reviewAccessKey"]
                    or data["contactAccessKey"],
                },
                "socialMedia": {
                    "instagram": data["instagram"],
                    "facebook": data["facebook"],
                    "linkedin": data["linkedin"],
                    "twitter": data["twitter"],
                    "youtube": data["youtube"],
                    "applePodcast": data["applePodcast"],
                    "spotify": data["spotify"],
                },
                "appointment": {"url": data["appointmentUrl"]},
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    start_script = """#!/bin/bash
cd "$(dirname "$0")" || exit 1
python3 -m http.server 8765 --bind 127.0.0.1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null' EXIT INT TERM
sleep 1
open "http://127.0.0.1:8765"
wait "$server_pid"
"""
    start_path = output_path / "start.command"
    start_path.write_text(start_script, encoding="utf-8")
    start_path.chmod(0o755)
    return output_path


def preview_website(payload):
    (
        data,
        decoded_logo,
        decoded_gallery,
        decoded_service_images,
        decoded_background_image,
    ) = (
        validate_configuration(payload)
    )

    def as_data_url(decoded_image):
        raw, extension = decoded_image
        encoded = base64.b64encode(raw).decode("ascii")
        return f"data:{MIME_BY_EXTENSION[extension]};base64,{encoded}"

    asset_paths = {
        "logo": as_data_url(decoded_logo) if decoded_logo else "",
        "gallery": [as_data_url(image) for image in decoded_gallery],
        "backgroundImage": (
            as_data_url(decoded_background_image)
            if decoded_background_image
            else ""
        ),
    }
    data["services"] = [
        {
            **service,
            "image": as_data_url(decoded_image) if decoded_image else "",
        }
        for service, decoded_image in zip(data["services"], decoded_service_images)
    ]
    index_html, styles_css, script_js = build_preview_site(data, asset_paths)
    preview_html = index_html.replace(
        f'<link rel="stylesheet" href="styles.css?v={SITE_ASSET_VERSION}" />',
        f"<style>{styles_css}</style>",
    )
    preview_html = preview_html.replace(
        f'<script src="script.js?v={SITE_ASSET_VERSION}" defer></script>',
        "",
    )
    preview_html = preview_html.replace(
        "</body>",
        f"<script>{script_js}</script></body>",
    )
    return preview_html


class BuilderHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PROJECT_DIR), **kwargs)

    def do_POST(self):
        request_path = urlparse(self.path).path
        if request_path not in {"/api/generate", "/api/preview"}:
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            if content_length <= 0 or content_length > MAX_REQUEST_SIZE:
                raise ValueError("Request is empty or too large.")
            raw_body = self.rfile.read(content_length)
            payload = json.loads(raw_body)
            if request_path == "/api/preview":
                self.send_json(HTTPStatus.OK, {"html": preview_website(payload)})
                return
            output_path = generate_website(payload)
            self.send_json(
                HTTPStatus.CREATED,
                {"outputPath": str(output_path), "message": "Website generated."},
            )
        except (ValueError, json.JSONDecodeError, OSError) as error:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": str(error)})

    def do_GET(self):
        if urlparse(self.path).path == "/api/health":
            self.send_json(
                HTTPStatus.OK, {"status": "ok", "version": BUILDER_VERSION}
            )
            return
        super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    server = ThreadingHTTPServer((HOST, PORT), BuilderHandler)
    url = f"http://{HOST}:{PORT}"
    print(f"Website Builder is running at {url}")
    print("Press Control-C to stop.")
    threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Website Builder.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
