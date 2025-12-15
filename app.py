import os
from flask import Flask, jsonify, render_template, request
from supabase import create_client, Client

# --- Cấu hình Supabase (Thay thế bằng thông tin của bạn) ---
# Cách tốt nhất là lưu các biến này trong biến môi trường (environment variables)
SUPABASE_URL = "https://fgjwnjbnngicpviyecxe.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnanduamJubmdpY3B2aXllY3hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0OTk5MTcsImV4cCI6MjA4MDA3NTkxN30.fQxEvgoxuBe8uGF-lCCD3OXn4JuomrA8VLoLkivcesE"

# Khởi tạo Supabase Client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Lỗi khi khởi tạo Supabase Client: {e}")
    # Nếu đang chạy trong môi trường production, bạn có thể dừng ứng dụng
    # hoặc xử lý lỗi khác.

app = Flask(__name__, template_folder='templates')

def fetch_table(table_name: str):
    try:
        response = supabase.table(table_name).select("*").execute()
        return True, response.data
    except Exception as e:
        return False, str(e)
    
def fetch_xa_by_tinh(tinh_id: str):
    try:
        response = supabase.table('xa').select("*").eq('tinh_id', tinh_id).execute()
        return True, response.data
    except Exception as e:
        return False, str(e)

def fetch_postal_code_by_xa(xa_id: str):
    try:
        response = supabase.table('xa').select("*").eq('id', xa_id).execute()
        if response.data and len(response.data) > 0:
            return True, response.data[0]
        return False, "Không tìm thấy dữ liệu"
    except Exception as e:
        return False, str(e)

@app.route('/api/dvhc/tinh', methods=['GET'])
def get_tinh():
    ok, result = fetch_table('tinh')
    if not ok:
        return jsonify({"success": False, "message": f"Lỗi khi lấy dữ liệu 'tinh': {result}"}), 500
    return jsonify({"success": True, "table": "tinh", "data": result}), 200

@app.route('/api/dvhc/xa', methods=['GET'])
def get_xa():
    ok, result = fetch_table('xa')
    if not ok:
        return jsonify({"success": False, "message": f"Lỗi khi lấy dữ liệu 'xa': {result}"}), 500
    return jsonify({"success": True, "table": "xa", "data": result}), 200

@app.route('/api/dvhc/xa/<tinh_id>', methods=['GET'])
def get_xa_thuoc_tinh(tinh_id):
    ok, result = fetch_xa_by_tinh(tinh_id)
    if not ok:
        return jsonify({"success": False, "message": f"Lỗi khi lấy dữ liệu 'xa': {result}"}), 500
    return jsonify({"success": True, "table": "xa", "data": result}), 200

@app.route('/api/dvhc/postal-code/<xa_id>', methods=['GET'])
def get_postal_code(xa_id):
    ok, result = fetch_postal_code_by_xa(xa_id)
    if not ok:
        return jsonify({"success": False, "message": f"Lỗi khi lấy mã bưu chính: {result}"}), 500
    return jsonify({"success": True, "data": result}), 200

@app.route('/api/dvhc', methods=['GET'])
def index():
    return render_template('index.html')
  
if __name__ == '__main__':
    # Đảm bảo bạn đang sử dụng port 5000 hoặc bất kỳ port nào bạn muốn
    app.run(debug=True, port=3001)