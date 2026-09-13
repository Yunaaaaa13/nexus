import json
import time
from pathlib import Path

import requests
import yfinance as yf


# ============================================================
# CONFIG
# ============================================================

GITHUB_API_URL = (
    "https://api.github.com/repos/"
    "Pholenk/IDX-Dataset/contents/"
    "dataset/stocks/csv"
)

OUTPUT_DIR = Path("app/scripts")

CANDIDATE_FILE = (
    OUTPUT_DIR / "discovered_stock_candidates.json"
)

VALID_FILE = (
    OUTPUT_DIR / "yahoo_valid_stocks.json"
)

INVALID_FILE = (
    OUTPUT_DIR / "yahoo_invalid_stocks.json"
)

UNIVERSE_FILE = (
    OUTPUT_DIR / "nexus_stock_universe.json"
)

PROGRESS_FILE = (
    OUTPUT_DIR / "yahoo_validation_progress.json"
)

HEADERS = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "NEXUS-Market-Intelligence",
}


# ============================================================
# HELPERS
# ============================================================

def normalize_symbol(symbol: str):
    """
    Normalisasi ticker saham.

    Contoh:
        BBCA       -> BBCA
        BBCA.JK    -> BBCA
        bbca       -> BBCA
    """

    if not symbol:
        return None

    symbol = (
        str(symbol)
        .upper()
        .replace(".JK", "")
        .strip()
    )

    if not symbol:
        return None

    if not symbol.isalnum():
        return None

    if not 1 <= len(symbol) <= 6:
        return None

    return symbol


# ============================================================
# STEP 1
# GET IDX DATASET
# ============================================================

def get_idx_tickers(max_retries=5, use_cache=True):
    """
    Mengambil seluruh ticker yang memiliki file dataset
    dari Pholenk/IDX-Dataset.

    CATATAN:
    Dataset ini dapat mengandung ticker historis/delisted.
    Karena itu hasilnya disebut CANDIDATES, bukan ACTIVE STOCKS.
    """

    print()
    print("=" * 70)
    print("STEP 1 — FETCH IDX DATASET")
    print("=" * 70)

    # 1. Gunakan cache lokal jika file kandidat sudah ada
    if use_cache and CANDIDATE_FILE.exists():
        try:
            cached_data = json.loads(CANDIDATE_FILE.read_text(encoding="utf-8"))
            if cached_data and isinstance(cached_data, list):
                candidates = [
                    item["symbol"]
                    for item in cached_data
                    if isinstance(item, dict) and "symbol" in item
                ]
                if candidates:
                    print(
                        f"Menggunakan kandidat lokal dari cache "
                        f"({CANDIDATE_FILE.name}): {len(candidates)} ticker."
                    )
                    return sorted(set(candidates))
        except Exception as e:
            print(f"Gagal membaca cache lokal ({e}), mencoba fetch dari GitHub...")

    all_files = []
    page = 1

    while True:
        print(f"Fetching GitHub page {page}...")

        items = None
        for attempt in range(1, max_retries + 1):
            try:
                response = requests.get(
                    GITHUB_API_URL,
                    headers=HEADERS,
                    params={
                        "per_page": 1000,
                        "page": page,
                    },
                    timeout=30,
                )
                print(f"HTTP status: {response.status_code}")
                response.raise_for_status()
                items = response.json()
                break
            except Exception as error:
                print(
                    f"  Attempt {attempt}/{max_retries} failed: "
                    f"{str(error)[:120]}"
                )
                if attempt < max_retries:
                    sleep_time = attempt * 2
                    print(f"  Retrying in {sleep_time}s...")
                    time.sleep(sleep_time)
                else:
                    print("  Semua percobaan fetch GitHub gagal.")

        if items is None:
            # Fallback ke cache jika ada
            if CANDIDATE_FILE.exists():
                print("Fallback ke cache lokal CANDIDATE_FILE...")
                cached_data = json.loads(CANDIDATE_FILE.read_text(encoding="utf-8"))
                return sorted(set(item["symbol"] for item in cached_data if "symbol" in item))
            raise RuntimeError(f"Gagal mengambil data dari GitHub setelah {max_retries} percobaan.")

        if not items:
            break

        all_files.extend(items)

        if len(items) < 1000:
            break

        page += 1

    tickers = set()

    for item in all_files:

        if item.get("type") != "file":
            continue

        filename = item.get(
            "name",
            "",
        )

        if not filename.lower().endswith(".csv"):
            continue

        symbol = normalize_symbol(
            filename[:-4]
        )

        if symbol:
            tickers.add(symbol)

    result = sorted(tickers)

    print()
    print(
        f"Dataset ticker candidates: "
        f"{len(result)}"
    )

    return result


# ============================================================
# STEP 2
# SAVE CANDIDATES
# ============================================================

def save_candidates(tickers):

    data = []

    for symbol in tickers:

        data.append(
            {
                "symbol": symbol,
                "yahoo_symbol": f"{symbol}.JK",
                "source": "Pholenk/IDX-Dataset",
                "status": "candidate",
            }
        )

    CANDIDATE_FILE.write_text(
        json.dumps(
            data,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )


# ============================================================
# STEP 3
# VALIDATION PROGRESS
# ============================================================

def load_progress():

    if not PROGRESS_FILE.exists():

        return {
            "valid": [],
            "invalid": [],
        }

    try:

        data = json.loads(
            PROGRESS_FILE.read_text(
                encoding="utf-8",
            )
        )

        return {
            "valid": data.get(
                "valid",
                [],
            ),
            "invalid": data.get(
                "invalid",
                [],
            ),
        }

    except Exception:

        return {
            "valid": [],
            "invalid": [],
        }


def save_progress(
    valid,
    invalid,
):

    PROGRESS_FILE.write_text(
        json.dumps(
            {
                "valid": sorted(valid),
                "invalid": sorted(invalid),
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )


# ============================================================
# STEP 4
# YAHOO VALIDATION
# ============================================================

def validate_yahoo(
    symbol,
    retries=3,
):

    yahoo_symbol = f"{symbol}.JK"

    for attempt in range(
        1,
        retries + 1,
    ):

        try:

            ticker = yf.Ticker(
                yahoo_symbol
            )

            history = ticker.history(
                period="1mo",
                interval="1d",
                auto_adjust=False,
            )

            if (
                history is not None
                and not history.empty
            ):
                return {
                    "available": True,
                    "reason": "historical_data_found",
                }

            if attempt < retries:
                time.sleep(2)

        except Exception as error:

            print(
                f"\n      "
                f"Attempt {attempt}/{retries}: "
                f"{str(error)[:120]}"
            )

            if attempt < retries:

                time.sleep(2)

    return {
        "available": False,
        "reason": "no_yahoo_data_after_retry",
    }


# ============================================================
# STEP 5
# BUILD FINAL UNIVERSE
# ============================================================

def build_final_universe(
    candidates,
    valid,
    invalid,
):

    universe = []

    valid_set = set(valid)
    invalid_set = set(invalid)

    for symbol in candidates:

        if symbol in valid_set:

            universe.append(
                {
                    "symbol": symbol,
                    "yahoo_symbol": f"{symbol}.JK",
                    "status": "active",
                    "yahoo_available": True,
                    "source": "Pholenk/IDX-Dataset + Yahoo Finance",
                }
            )

        elif symbol in invalid_set:

            universe.append(
                {
                    "symbol": symbol,
                    "yahoo_symbol": f"{symbol}.JK",
                    "status": "unavailable",
                    "yahoo_available": False,
                    "source": "Pholenk/IDX-Dataset",
                }
            )

    return universe


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 70)
    print("NEXUS STOCK UNIVERSE DISCOVERY")
    print("=" * 70)

    # --------------------------------------------------------
    # STEP 1
    # --------------------------------------------------------

    candidates = get_idx_tickers()

    if not candidates:

        print()
        print(
            "ERROR: "
            "Tidak ada ticker ditemukan."
        )

        return

    # --------------------------------------------------------
    # STEP 2
    # Save candidate universe
    # --------------------------------------------------------

    save_candidates(
        candidates
    )

    print()
    print(
        f"Candidate file saved:"
    )

    print(
        CANDIDATE_FILE
    )

    # --------------------------------------------------------
    # STEP 3
    # Load progress
    # --------------------------------------------------------

    print()
    print("=" * 70)
    print("STEP 2 — LOAD VALIDATION PROGRESS")
    print("=" * 70)

    progress = load_progress()

    valid = set(
        progress["valid"]
    )

    invalid = set(
        progress["invalid"]
    )

    # IMPORTANT:
    # hanya progress untuk ticker yang masih ada
    # di candidate universe yang digunakan sekarang.

    candidate_set = set(candidates)

    valid &= candidate_set
    invalid &= candidate_set

    processed = (
        valid
        | invalid
    )

    remaining = [
        symbol
        for symbol in candidates
        if symbol not in processed
    ]

    print(
        f"Already validated: "
        f"{len(processed)}"
    )

    print(
        f"Remaining: "
        f"{len(remaining)}"
    )

    # --------------------------------------------------------
    # STEP 4
    # Yahoo validation
    # --------------------------------------------------------

    print()
    print("=" * 70)
    print("STEP 3 — YAHOO FINANCE VALIDATION")
    print("=" * 70)

    total_remaining = len(
        remaining
    )

    for index, symbol in enumerate(
        remaining,
        start=1,
    ):

        print(
            f"[{index:03d}/{total_remaining:03d}] "
            f"Checking {symbol}.JK...",
            end=" ",
            flush=True,
        )

        result = validate_yahoo(
            symbol
        )

        if result["available"]:

            valid.add(symbol)

            print(
                "VALID"
            )

        else:

            invalid.add(symbol)

            print(
                "UNAVAILABLE"
            )

        # Save immediately.
        save_progress(
            valid,
            invalid,
        )

        time.sleep(
            0.25
        )

    # --------------------------------------------------------
    # STEP 5
    # Separate output files
    # --------------------------------------------------------

    valid_data = []

    for symbol in sorted(valid):

        valid_data.append(
            {
                "symbol": symbol,
                "yahoo_symbol": f"{symbol}.JK",
                "status": "active",
                "yahoo_available": True,
            }
        )

    invalid_data = []

    for symbol in sorted(invalid):

        invalid_data.append(
            {
                "symbol": symbol,
                "yahoo_symbol": f"{symbol}.JK",
                "status": "unavailable",
                "yahoo_available": False,
            }
        )

    VALID_FILE.write_text(
        json.dumps(
            valid_data,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    INVALID_FILE.write_text(
        json.dumps(
            invalid_data,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    # --------------------------------------------------------
    # STEP 6
    # FINAL NEXUS UNIVERSE
    # --------------------------------------------------------

    final_universe = build_final_universe(
        candidates,
        valid,
        invalid,
    )

    UNIVERSE_FILE.write_text(
        json.dumps(
            final_universe,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    # --------------------------------------------------------
    # RESULT
    # --------------------------------------------------------

    print()
    print("=" * 70)
    print("FINAL DISCOVERY RESULT")
    print("=" * 70)

    print(
        f"Total candidates : "
        f"{len(candidates)}"
    )

    print(
        f"Yahoo available  : "
        f"{len(valid)}"
    )

    print(
        f"Yahoo unavailable: "
        f"{len(invalid)}"
    )

    if candidates:

        percentage = (
            len(valid)
            / len(candidates)
            * 100
        )

        print(
            f"Yahoo availability: "
            f"{percentage:.2f}%"
        )

    print()
    print("=" * 70)
    print("OUTPUT FILES")
    print("=" * 70)

    print(
        f"Candidates:"
        f"\n{CANDIDATE_FILE}"
    )

    print(
        f"\nYahoo valid:"
        f"\n{VALID_FILE}"
    )

    print(
        f"\nYahoo unavailable:"
        f"\n{INVALID_FILE}"
    )

    print(
        f"\nNEXUS universe:"
        f"\n{UNIVERSE_FILE}"
    )

    print()
    print(
        "Discovery completed."
    )


if __name__ == "__main__":
    main()