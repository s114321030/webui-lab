import argparse
import sys
import time
from typing import Any

import requests


API_URL = "https://www.dcard.tw/service/api/v2/forums/ncnu/posts"
POST_URL = "https://www.dcard.tw/f/ncnu/p/{post_id}"
DEFAULT_KEYWORDS = ["賣", "售"]


def fetch_json(session: requests.Session, url: str, params: dict[str, Any] | None = None) -> Any:
    response = session.get(url, params=params, timeout=15)
    response.raise_for_status()
    return response.json()


def summarize(text: str, max_length: int = 160) -> str:
    summary = " ".join(text.split())
    if len(summary) > max_length:
        return summary[:max_length].rstrip() + "..."
    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description="搜尋 Dcard 暨南大學板最新文章")
    parser.add_argument("--pages", type=int, default=2, help="要掃描的列表頁數（每頁最多 100 篇，預設 2）")
    parser.add_argument("--limit", type=int, default=100, help="每頁文章數（1-100，預設 100）")
    parser.add_argument("--delay", type=float, default=0.5, help="每次 API 請求間隔秒數（預設 0.5）")
    parser.add_argument(
        "--keywords",
        nargs="+",
        default=DEFAULT_KEYWORDS,
        help="標題需包含的任一關鍵字（預設：賣 售）",
    )
    args = parser.parse_args()
    if args.pages < 1 or not 1 <= args.limit <= 100 or args.delay < 0:
        parser.error("--pages 必須至少為 1、--limit 必須介於 1 到 100，且 --delay 不可小於 0")

    session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0 (compatible; NCNUPostSearch/1.0)"})
    matches: list[tuple[str, str, int]] = []
    before: int | None = None
    request_count = 0

    try:
        for _ in range(args.pages):
            params: dict[str, Any] = {"limit": args.limit}
            if before is not None:
                params["before"] = before
            if request_count:
                time.sleep(args.delay)
            posts = fetch_json(session, API_URL, params)
            request_count += 1
            if not isinstance(posts, list) or not posts:
                break

            for post in posts:
                post_id = post.get("id")
                if post_id is None:
                    continue
                if request_count:
                    time.sleep(args.delay)
                detail = fetch_json(session, f"{API_URL}/{post_id}")
                request_count += 1
                title = str(detail.get("title") or post.get("title") or "（無標題）")
                content = str(detail.get("content") or post.get("excerpt") or "")
                if any(keyword in title for keyword in args.keywords):
                    matches.append((title, content, post_id))

            before = min(post["id"] for post in posts if isinstance(post.get("id"), int))

    except (requests.RequestException, ValueError, TypeError) as error:
        print(f"讀取 Dcard API 失敗：{error}", file=sys.stderr)
        return 1

    if not matches:
        print("沒有找到符合關鍵字的文章。")
        return 0

    for title, content, post_id in matches:
        print(f"標題：{title}")
        print(f"摘要：{summarize(content) or '（無內文）'}")
        print(f"連結：{POST_URL.format(post_id=post_id)}")
        print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())