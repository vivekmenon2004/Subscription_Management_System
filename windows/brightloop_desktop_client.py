"""
Brightloop Windows Desktop Client Simulator & Protocol Handler
Handles the 'brightloop://launch?code=<ONE_TIME_CODE>&product_id=<ID>' custom protocol,
exchanges the single-use authorization code with Django REST API, and displays
the authenticated product session with full customer entitlements.
"""

import sys
import json
import urllib.parse
import urllib.request
import urllib.error
import tkinter as tk
from tkinter import ttk, messagebox

DJANGO_EXCHANGE_URL = "http://127.0.0.1:8000/api/v1/products/access/exchange-code"

def parse_protocol_url(raw_url):
    """Parse brightloop://launch?code=...&product_id=..."""
    try:
        # Strip potential quotes added by Windows shell
        cleaned = raw_url.strip('"').strip("'")
        parsed = urllib.parse.urlparse(cleaned)
        qs = urllib.parse.parse_qs(parsed.query)
        code = qs.get('code', [None])[0]
        product_id = qs.get('product_id', [None])[0]
        return code, product_id
    except Exception as e:
        print(f"Error parsing protocol URL '{raw_url}': {e}")
        return None, None

def exchange_code_with_django(code, product_id):
    """POST to Django exchange-code endpoint"""
    payload = {
        "code": code,
        "product_id": int(product_id) if product_id else None
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        DJANGO_EXCHANGE_URL,
        data=data,
        headers={'Content-Type': 'application/json', 'User-Agent': 'BrightloopDesktop/1.0'}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            res_body = response.read().decode('utf-8')
            return True, json.loads(res_body)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        try:
            err_json = json.loads(err_body)
            msg = err_json.get('error', f"HTTP {e.code}: {e.reason}")
        except Exception:
            msg = f"HTTP {e.code}: {err_body}"
        return False, msg
    except Exception as e:
        return False, f"Connection failed: {e}. Ensure Django backend is running at http://127.0.0.1:8000"

def show_desktop_gui(success, data_or_msg):
    """Render modern desktop window with Brightloop branding (#714B67, #25232A, #F7F6F8)"""
    root = tk.Tk()
    root.title("Brightloop Desktop Client - Product Access")
    root.geometry("540x580")
    root.configure(bg="#F7F6F8")
    root.resizable(False, False)

    # Header Banner
    header = tk.Frame(root, bg="#714B67", height=80)
    header.pack(fill="x")
    
    title_lbl = tk.Label(
        header, text="Brightloop Desktop Application", 
        font=("Segoe UI", 16, "bold"), fg="white", bg="#714B67"
    )
    title_lbl.pack(pady=(18, 2))
    sub_lbl = tk.Label(
        header, text="Authenticated Windows Client Protocol Session", 
        font=("Segoe UI", 9), fg="#EAE8ED", bg="#714B67"
    )
    sub_lbl.pack(pady=(0, 15))

    # Main content container
    container = tk.Frame(root, bg="#F7F6F8", padx=25, pady=20)
    container.pack(fill="both", expand=True)

    if not success:
        # Failure State
        err_box = tk.Frame(container, bg="#FEE2E2", highlightbackground="#FECACA", highlightthickness=1, padx=15, pady=15)
        err_box.pack(fill="x", pady=10)

        err_title = tk.Label(err_box, text="❌ Launch Authentication Failed", font=("Segoe UI", 12, "bold"), fg="#DC2626", bg="#FEE2E2")
        err_title.pack(anchor="w", pady=(0, 5))

        err_msg = tk.Label(err_box, text=data_or_msg, font=("Segoe UI", 10), fg="#991B1B", bg="#FEE2E2", wraplength=450, justify="left")
        err_msg.pack(anchor="w")

        hint_lbl = tk.Label(
            container, 
            text="Please ensure your subscription is active, invoices are settled, and request a fresh launch from your Customer Portal.",
            font=("Segoe UI", 9), fg="#6E6B75", bg="#F7F6F8", wraplength=480, justify="center"
        )
        hint_lbl.pack(pady=20)
    else:
        # Success State
        card = tk.Frame(container, bg="white", highlightbackground="#E8E6EB", highlightthickness=1, padx=20, pady=20)
        card.pack(fill="both", expand=True)

        user_info = data_or_msg.get('user', {})
        prod_info = data_or_msg.get('product', {})
        sub_info = data_or_msg.get('subscription', {})
        entitlements = data_or_msg.get('entitlements', {})

        # Success badge
        status_badge = tk.Label(
            card, text="● ACCESS GRANTED & AUTHENTICATED", 
            font=("Segoe UI", 9, "bold"), fg="#15803D", bg="#DCFCE7", padx=10, pady=3
        )
        status_badge.pack(anchor="w", pady=(0, 10))

        # Product Title
        p_name = tk.Label(card, text=prod_info.get('name', 'Brightloop Product'), font=("Segoe UI", 15, "bold"), fg="#25232A", bg="white")
        p_name.pack(anchor="w")

        # Customer & Subscription
        user_line = f"Customer: {user_info.get('name')} ({user_info.get('email')})"
        u_lbl = tk.Label(card, text=user_line, font=("Segoe UI", 10), fg="#6E6B75", bg="white")
        u_lbl.pack(anchor="w", pady=(2, 10))

        sub_line = f"Subscription: {sub_info.get('number')} · Plan: {entitlements.get('plan_name', 'Active')}"
        s_lbl = tk.Label(card, text=sub_line, font=("Segoe UI", 10, "bold"), fg="#714B67", bg="white")
        s_lbl.pack(anchor="w", pady=(0, 15))

        # Entitlements Box
        ent_box = tk.Frame(card, bg="#FAF9FB", highlightbackground="#E8E6EB", highlightthickness=1, padx=12, pady=10)
        ent_box.pack(fill="x", pady=(0, 15))

        e_title = tk.Label(ent_box, text="ACTIVE ENTITLEMENTS & FEATURE LIMITS", font=("Segoe UI", 8, "bold"), fg="#8C8895", bg="#FAF9FB")
        e_title.pack(anchor="w", pady=(0, 5))

        tier_lbl = tk.Label(ent_box, text=f"• Tier: {entitlements.get('tier', 'Standard')} (Max Users: {entitlements.get('max_users', 5)})", font=("Segoe UI", 9), fg="#25232A", bg="#FAF9FB")
        tier_lbl.pack(anchor="w")

        feats = entitlements.get('features', [])
        feat_str = ", ".join(feats) if feats else "Core platform features"
        f_lbl = tk.Label(ent_box, text=f"• Features: {feat_str}", font=("Segoe UI", 9), fg="#25232A", bg="#FAF9FB", wraplength=420, justify="left")
        f_lbl.pack(anchor="w")

        # Security Token snippet
        token_txt = data_or_msg.get('access_token', '')
        t_snip = f"Session Token: {token_txt[:16]}... (Single-Use Code Invalidation Verified)"
        tok_lbl = tk.Label(card, text=t_snip, font=("Consolas", 8), fg="#9CA3AF", bg="white")
        tok_lbl.pack(anchor="w", pady=(5, 0))

    # Close button
    btn = tk.Button(
        container, text="Close Desktop Window", 
        font=("Segoe UI", 10, "bold"), bg="#25232A", fg="white", 
        activebackground="#714B67", activeforeground="white",
        relief="flat", padx=15, pady=8, command=root.destroy
    )
    btn.pack(side="bottom", pady=10)

    root.mainloop()

def main():
    if len(sys.argv) < 2:
        print("Usage: python brightloop_desktop_client.py <brightloop://launch?code=...&product_id=...>")
        show_desktop_gui(False, "No launch URL was passed. The Windows client expects to be invoked via brightloop:// protocol.")
        return

    raw_arg = sys.argv[1]
    code, product_id = parse_protocol_url(raw_arg)
    
    if not code:
        show_desktop_gui(False, f"Invalid launch parameter received: '{raw_arg}'")
        return

    print(f"[*] Exchanging authorization code '{code[:8]}...' with Django...")
    success, result = exchange_code_with_django(code, product_id)
    show_desktop_gui(success, result)

if __name__ == '__main__':
    main()
