from playwright.sync_api import sync_playwright
import os
import sys


BASE_URL = os.environ["REPRO_BASE_URL"]
EMAIL = os.environ["REPRO_EMAIL"]
PASSWORD = os.environ["REPRO_PASSWORD"]


def main() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        console_messages = []
        page.on("console", lambda msg: console_messages.append(f"{msg.type}: {msg.text}"))
        page.on("pageerror", lambda exc: console_messages.append(f"pageerror: {exc}"))

        page.goto(f"{BASE_URL}/login", wait_until="networkidle")
        page.get_by_label("Email").fill(EMAIL)
        page.get_by_label("Password").fill(PASSWORD)
        page.get_by_role("button", name="Log in").click()
        page.wait_for_load_state("networkidle")

        page.goto(f"{BASE_URL}/workspace", wait_until="domcontentloaded")
        page.wait_for_timeout(5000)

        url = page.url
        title = page.title()
        body_text = page.locator("body").inner_text()
        loading_text = "Loading" in body_text or "loading" in body_text

        print(f"URL: {url}")
        print(f"TITLE: {title}")
        print(f"HAS_LOADING_TEXT: {loading_text}")
        print("BODY_HEAD:")
        print(body_text[:1500])
        if console_messages:
            print("CONSOLE:")
            for entry in console_messages[:100]:
                print(entry)

        browser.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
