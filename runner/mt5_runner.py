import os
import time
import json
from typing import Optional

try:
    import MetaTrader5 as mt5
except Exception as e:
    print("MetaTrader5 package is required: pip install MetaTrader5")
    raise e

API_URL = os.environ.get("API_URL", "http://localhost:3000/api/signal")
SYMBOL = os.environ.get("PAIR", "EURUSD")
TIMEFRAME = os.environ.get("TIMEFRAME", "M15")
RISK_PERCENT = float(os.environ.get("RISK_PERCENT", "1"))
CAPITAL_USD = float(os.environ.get("CAPITAL_USD", "1000"))
CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", "0.6"))
POLL_SECONDS = int(os.environ.get("POLL_SECONDS", "60"))

import urllib.request

def http_get_json(url: str):
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read().decode("utf-8"))


def ensure_initialized() -> None:
    if not mt5.initialize():
        raise RuntimeError(f"MT5 initialize failed: {mt5.last_error()}")
    acc = mt5.account_info()
    if acc is None:
        raise RuntimeError("No MT5 account is logged in")


def get_lot_size(symbol: str, entry: float, stop_loss: float, risk_percent: float, capital_usd: float) -> float:
    info = mt5.symbol_info(symbol)
    if info is None:
        raise RuntimeError(f"Symbol not found: {symbol}")
    if not info.visible:
        if not mt5.symbol_select(symbol, True):
            raise RuntimeError(f"Failed to select symbol: {symbol}")

    point = info.point
    stop_points = abs(entry - stop_loss) / point
    if stop_points <= 0:
        return 0.0

    # Fallbacks for brokers not filling tick values properly
    tick_value = info.trade_tick_value if info.trade_tick_value > 0 else 0.1

    risk_usd = capital_usd * (risk_percent / 100.0)
    cost_per_lot = stop_points * tick_value
    if cost_per_lot <= 0:
        return 0.0

    raw_lot = risk_usd / cost_per_lot
    # normalize to broker min/step/max
    lot = max(info.volume_min, min(raw_lot, info.volume_max))
    # snap to step
    step = info.volume_step
    lot = round(lot / step) * step
    return float(lot)


def place_order(symbol: str, action: str, entry: Optional[float], sl: Optional[float], tp: Optional[float], lot: float) -> bool:
    tick = mt5.symbol_info_tick(symbol)
    if tick is None:
        raise RuntimeError("No tick data")
    price = tick.ask if action == "buy" else tick.bid
    order_type = mt5.ORDER_TYPE_BUY if action == "buy" else mt5.ORDER_TYPE_SELL

    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": symbol,
        "volume": lot,
        "type": order_type,
        "price": price,
        "sl": sl or 0.0,
        "tp": tp or 0.0,
        "deviation": 20,
        "magic": 4427997,
        "comment": "ai-forex-bot",
        "type_filling": mt5.ORDER_FILLING_FOK,
    }
    result = mt5.order_send(request)
    print("ORDER_RESULT", result)
    return result is not None and result.retcode == mt5.TRADE_RETCODE_DONE


def main():
    print("Starting MT5 runner for", SYMBOL, TIMEFRAME)
    ensure_initialized()
    while True:
        try:
            url = f"{API_URL}?pair={SYMBOL}&timeframe={TIMEFRAME}"
            data = http_get_json(url)
            action = data.get("action", "hold")
            conf = float(data.get("confidence", 0))
            if action == "hold" or conf < CONFIDENCE_THRESHOLD:
                print("HOLD or low confidence, skipping.")
            else:
                entry = data.get("entry")
                sl = data.get("stopLoss")
                tp = data.get("takeProfit")
                if entry is None or sl is None:
                    print("Missing entry/SL; skip for safety.")
                else:
                    lot = get_lot_size(SYMBOL, float(entry), float(sl), RISK_PERCENT, CAPITAL_USD)
                    if lot <= 0:
                        print("Calculated lot size <= 0, skip.")
                    else:
                        ok = place_order(SYMBOL, action, float(entry), float(sl), float(tp) if tp else None, lot)
                        print("Order placed?", ok)
        except Exception as e:
            print("Error:", e)
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
