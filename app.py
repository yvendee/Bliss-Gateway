from flask import Flask, jsonify, request, render_template, session, redirect, url_for, flash, send_from_directory, send_file, make_response

# from dotenv import load_dotenv
import mysql.connector
import os
# from swagger.swaggerui import setup_swagger
import random
import string
from datetime import datetime, timedelta
import requests
import pytz
from dotenv import load_dotenv  ## pip install python-dotenv
import openai  ## pip install openai==0.28.0
from flask_cors import CORS ## pip install flask-cors
import json 
import hashlib
from functools import wraps
from io import BytesIO
from werkzeug.utils import secure_filename


# Allowed file extensions
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif'}

# Function to check if the file is allowed
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS



app = Flask(__name__, template_folder='templates', static_folder='static', static_url_path='/static')

CORS(app)  # This allows all origins (wildcard)

# Set up Swagger
# setup_swagger(app)


app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev_secret_key")  # Set a strong secret key


# #Load environment variables from .env file
# load_dotenv()

# # Configure DeepSeek
# openai.api_key = os.getenv("DEEPSEEK_API_KEY")
# openai.api_base = "https://api.deepseek.com/v1"

# Check if the file "dev" exists
if not os.path.exists('dev'):
    # Retrieve MySQL connection details from environment variable
    mysql_details = os.getenv('MYSQL_DETAILS')

    if mysql_details:
        # Split the details by "@"
        details = mysql_details.split('@')

        # Extract the individual values
        host = details[0]
        user = details[1]
        password = details[2]
        database = details[3]
        port = int(details[4])

        # MySQL connection setup
        try:
            db_connection = mysql.connector.connect(
                host=host,
                user=user,
                password=password,
                database=database,
                port=port
            )
            print("Connection successful")

        except mysql.connector.Error as err:
            print(f"Error connecting to MySQL: {err}")
            db_connection = None
    else:
        print("MYSQL_DETAILS environment variable is not set.")
        db_connection = None
else:
    print("File 'dev' exists. Skipping MySQL connection setup.")


# Helper function to reconnect to MySQL
def reconnect_to_mysql():
    global db_connection

    mysql_details = os.getenv('MYSQL_DETAILS')

    if mysql_details:
        # Split the details by "@"
        details = mysql_details.split('@')

        # Extract the individual values
        host = details[0]
        user = details[1]
        password = details[2]
        database = details[3]
        port = int(details[4])

        # MySQL connection setup
        try:
            db_connection = mysql.connector.connect(
                host=host,
                user=user,
                password=password,
                database=database,
                port=port
            )
            print("Reconnection successful")
            return True

        except mysql.connector.Error as err:
            print(f"Error reconnecting to MySQL: {err}")
            db_connection = None
            return False
    else:
        print("MYSQL_DETAILS environment variable is not set.")
        db_connection = None
        return False

def generate_random_string(length=32):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def get_cursor():
    if db_connection:
        return db_connection.cursor()
    else:
        return None

def is_mysql_available():
    return db_connection is not None

# Route to handle MySQL errors
def handle_mysql_error(e):
    print(f"MySQL Error: {e}")
    return jsonify({"error": "MySQL database operation failed. Please check the database connection."}), 500


# Check if the file "dev" exists
if not os.path.exists('dev'):
    # Execute this route if "dev" is not present and MySQL is available
    @app.route('/', methods=['GET'])
    def index():
        if is_mysql_available():
            # return jsonify({
            #     "message": {
            #         "status": "ok",
            #         "developer": "kayven",
            #         "email": "yvendee2020@gmail.com"
            #     }
            # })
            return render_template("index.html")
        else:
            return jsonify({"error": "MySQL database not responding, please check the database service"}), 500
else:
    # Execute this route if "dev" exists
    @app.route('/', methods=['GET'])
    def index():
        # return jsonify({"message": "Welcome to the baao disaster link"})
        return render_template("index.html")

# Route to reconnect to MySQL
@app.route('/reconnect-mysql', methods=['GET'])
def reconnect_mysql():
    if reconnect_to_mysql():
        return jsonify({"message": "Reconnected to MySQL successfully!"}), 200
    else:
        return jsonify({"error": "Failed to reconnect to MySQL."}), 500


## ------ create table ---------------- ##
@app.route('/create-auth-table', methods=['POST'])
def create_auth_table():
    if not is_mysql_available():
        return handle_mysql_error("MySQL not available")

    cursor = get_cursor()
    if not cursor:
        return handle_mysql_error("Unable to get MySQL cursor")

    try:
        create_table_query = """
        CREATE TABLE IF NOT EXISTS auth (
            id INT AUTO_INCREMENT PRIMARY KEY,
            uID TEXT,
            passwordHash TEXT,
            role TEXT,
            groupId TEXT,
            email TEXT,
            status TEXT,
            token TEXT,
            resetCode TEXT,
            userName TEXT,
            organizationName TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            modifiedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
        """
        cursor.execute(create_table_query)
        db_connection.commit()
        return jsonify({"message": "auth table created successfully."}), 200

    except mysql.connector.Error as e:
        return handle_mysql_error(e)

    finally:
        cursor.close()

# | Route                         | Purpose                                               |
# | ----------------------------- | ----------------------------------------------------- |
# | `POST /create-booking-tables` | Create the 4 booking tables                           |
# | `POST /create-payments-table` | Create the payments table                             |

@app.route('/create-booking-tables', methods=['POST'])
def create_booking_tables():
    if not is_mysql_available():
        return handle_mysql_error("MySQL not available")
    
    cursor = get_cursor()
    if not cursor:
        return handle_mysql_error("Unable to get MySQL cursor")
    
    try:
        booking_table_template = """
        CREATE TABLE IF NOT EXISTS {table} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_id VARCHAR(50) NOT NULL,
            customer_name VARCHAR(100),
            destination VARCHAR(100),
            date DATE,
            amount DECIMAL(10,2),
            status VARCHAR(50)
        );
        """

        for table in ["flight_bookings", "tour_bookings", "kabayan_bookings", "itinerary_bookings"]:
            cursor.execute(booking_table_template.format(table=table))

        db_connection.commit()
        return jsonify({"message": "Booking tables created successfully."}), 200
    
    except mysql.connector.Error as e:
        return handle_mysql_error(e)
    
    finally:
        cursor.close()

@app.route('/create-payments-table', methods=['POST'])
def create_payments_table():
    if not is_mysql_available():
        return handle_mysql_error("MySQL not available")
    
    cursor = get_cursor()
    if not cursor:
        return handle_mysql_error("Unable to get MySQL cursor")

    try:
        payment_table_query = """
        CREATE TABLE IF NOT EXISTS payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_id VARCHAR(50) NOT NULL,
            amount_due DECIMAL(10,2),
            amount_paid DECIMAL(10,2),
            status VARCHAR(50)
        );
        """
        cursor.execute(payment_table_query)

        db_connection.commit()
        return jsonify({"message": "Payments table created successfully."}), 200

    except mysql.connector.Error as e:
        return handle_mysql_error(e)

    finally:
        cursor.close()

@app.route('/create-notifications-table', methods=['POST'])
def create_notifications_table():
    if not is_mysql_available():
        return handle_mysql_error("MySQL not available")
    
    cursor = get_cursor()
    if not cursor:
        return handle_mysql_error("Unable to get MySQL cursor")
    
    try:
        create_table_query = """
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            uID TEXT,
            category TEXT,
            title TEXT,
            message TEXT,
            type TEXT,
            is_read BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """
        cursor.execute(create_table_query)
        db_connection.commit()
        return jsonify({"message": "Notifications table created successfully."}), 200

    except mysql.connector.Error as e:
        return handle_mysql_error(e)

    finally:
        cursor.close()


## ------ insert record ---------------- ##
@app.route('/insert-mock-auth', methods=['POST'])
def insert_mock_auth():
    if not is_mysql_available():
        return handle_mysql_error("MySQL not available")

    cursor = get_cursor()
    if not cursor:
        return handle_mysql_error("Unable to get MySQL cursor")

    try:
        mock_data = {
            "uID": generate_random_string(12),
            "passwordHash": "admin1234",
            "role": "admin",
            "groupId": "group-001",
            "email": "yvendee2020@gmail.com",
            "status": "active",
            "token": generate_random_string(40),
            "resetCode": generate_random_string(6),
            "userName": "testuser",
            "organizationName": "test organization"
        }

        insert_query = """
        INSERT INTO auth (
            uID, passwordHash, role, groupId, email, status, token, resetCode, userName, organizationName
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """
        cursor.execute(insert_query, (
            mock_data["uID"],
            mock_data["passwordHash"],
            mock_data["role"],
            mock_data["groupId"],
            mock_data["email"],
            mock_data["status"],
            mock_data["token"],
            mock_data["resetCode"],
            mock_data["userName"],
            mock_data["organizationName"]
        ))

        db_connection.commit()
        return jsonify({"message": "Mock auth record inserted successfully."}), 201

    except mysql.connector.Error as e:
        return handle_mysql_error(e)

    finally:
        cursor.close()


@app.route('/insert-mock-auth-client', methods=['POST'])
def insert_mock_client():
    if not is_mysql_available():
        return handle_mysql_error("MySQL not available")

    cursor = get_cursor()
    if not cursor:
        return handle_mysql_error("Unable to get MySQL cursor")

    try:
        mock_data = {
            "uID": generate_random_string(12),
            "passwordHash": "client1234", 
            "role": "client",
            "groupId": "group-002",
            "email": "yvendee18@gmail.com",
            "status": "active",
            "token": generate_random_string(40),
            "resetCode": generate_random_string(6),
            "userName": "testclient",
            "organizationName": "client org"
        }

        insert_query = """
        INSERT INTO auth (
            uID, passwordHash, role, groupId, email, status, token, resetCode, userName, organizationName
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """
        cursor.execute(insert_query, (
            mock_data["uID"],
            mock_data["passwordHash"],
            mock_data["role"],
            mock_data["groupId"],
            mock_data["email"],
            mock_data["status"],
            mock_data["token"],
            mock_data["resetCode"],
            mock_data["userName"],
            mock_data["organizationName"]
        ))

        db_connection.commit()
        return jsonify({"message": "Mock client record inserted successfully."}), 201

    except mysql.connector.Error as e:
        return handle_mysql_error(e)

    finally:
        cursor.close()


# | Route                         | Purpose                                               |
# | ----------------------------- | ----------------------------------------------------- |
# | `POST /insert-mock-bookings`  | Insert 1 mock record into each booking table          |
# | `POST /insert-mock-payments`  | Insert matching payment records for given booking IDs |

@app.route('/insert-mock-bookings', methods=['POST'])
def insert_mock_bookings():
    if not is_mysql_available():
        return handle_mysql_error("MySQL not available")
    
    cursor = get_cursor()
    if not cursor:
        return handle_mysql_error("Unable to get MySQL cursor")

    try:
        from datetime import date
        import random, string

        def generate_booking_id():
            return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

        inserted_bookings = []

        booking_tables = ["flight_bookings", "tour_bookings", "kabayan_bookings", "itinerary_bookings"]
        for table in booking_tables:
            booking_id = generate_booking_id()
            cursor.execute(f"""
                INSERT INTO {table} (booking_id, customer_name, destination, date, amount, status)
                VALUES (%s, %s, %s, %s, %s, %s);
            """, (
                booking_id,
                "John Doe",
                "Japan",
                date.today(),
                1999.99,
                "confirmed"
            ))
            inserted_bookings.append(booking_id)

        db_connection.commit()
        return jsonify({
            "message": "Mock bookings inserted successfully.",
            "booking_ids": inserted_bookings
        }), 201

    except mysql.connector.Error as e:
        return handle_mysql_error(e)

    finally:
        cursor.close()

@app.route('/insert-mock-payments', methods=['POST'])
def insert_mock_payments():
    if not is_mysql_available():
        return handle_mysql_error("MySQL not available")

    cursor = get_cursor()
    if not cursor:
        return handle_mysql_error("Unable to get MySQL cursor")

    try:
        data = request.get_json()
        booking_ids = data.get('booking_ids', [])

        if not booking_ids:
            return jsonify({"error": "No booking_ids provided"}), 400

        for booking_id in booking_ids:
            cursor.execute("""
                INSERT INTO payments (booking_id, amount_due, amount_paid, status)
                VALUES (%s, %s, %s, %s);
            """, (
                booking_id,
                1999.99,
                1999.99,
                "verified"
            ))

        db_connection.commit()
        return jsonify({"message": "Mock payments inserted successfully."}), 201

    except mysql.connector.Error as e:
        return handle_mysql_error(e)

    finally:
        cursor.close()

@app.route('/insert-mock-notifications', methods=['POST'])
def insert_mock_notifications():
    if not is_mysql_available():
        return handle_mysql_error("MySQL not available")
    
    cursor = get_cursor()
    if not cursor:
        return handle_mysql_error("Unable to get MySQL cursor")
    
    try:
        # Mock notification data
        mock_notifications = [
            {"uID": "hSONQhOgnFPV", "category": "System", "title": "Welcome", "message": "Welcome to the platform!", "type": "info", "is_read": False},
            {"uID": "hSONQhOgnFPV", "category": "Promotion", "title": "Special Offer", "message": "Get 20% off your next purchase.", "type": "alert", "is_read": False},
            {"uID": "hSONQhOgnFPV", "category": "Reminder", "title": "Action Required", "message": "Please update your payment info.", "type": "warning", "is_read": False},
        ]
        
        # Insert each mock notification
        insert_query = """
        INSERT INTO notifications (uID, category, title, message, type, is_read) 
        VALUES (%s, %s, %s, %s, %s, %s);
        """
        for notification in mock_notifications:
            cursor.execute(insert_query, (
                notification["uID"],
                notification["category"],
                notification["title"],
                notification["message"],
                notification["type"],
                notification["is_read"]
            ))

        db_connection.commit()
        return jsonify({"message": "Mock notifications inserted successfully."}), 201

    except mysql.connector.Error as e:
        return handle_mysql_error(e)

    finally:
        cursor.close()


## ------ show records ---------------- ##
@app.route('/show-table/<table_name>', methods=['GET'])
def show_table_content(table_name):
    if not is_mysql_available():
        return handle_mysql_error("MySQL not available")

    cursor = get_cursor()
    if not cursor:
        return handle_mysql_error("Unable to get MySQL cursor")

    try:
        # Validate table name to prevent SQL injection (only allow known safe table names)
        allowed_tables = [
            'auth', 'flight_bookings', 'tour_bookings', 'kabayan_bookings', 'itinerary_bookings', 'payments',
            'subscribers', 'weather_data', 
            'evacuation_data', 'flooding_data', 'forecast_data', 'broadcast'
        ]

        if table_name not in allowed_tables:
            return jsonify({"error": "Invalid table name"}), 400

        query = f"SELECT * FROM {table_name};"
        cursor.execute(query)
        rows = cursor.fetchall()
        column_names = [desc[0] for desc in cursor.description]

        results = [dict(zip(column_names, row)) for row in rows]

        return jsonify({ "table": table_name, "data": results }), 200

    except mysql.connector.Error as e:
        return handle_mysql_error(e)

    finally:
        cursor.close()



@app.route("/services")
def services_page():
    # Render the HTML template for the /ui route
    return render_template("services.html")


@app.route("/about")
def about_page():
    # Render the HTML template for the /ui route
    return render_template("about.html")


@app.route("/admin-dashboard")
def admin_dashboard_page():
    # Render the HTML template for the /ui route
    return render_template("admin/admin_dashboard.html")

@app.route("/admin-notif")
def admin_notif_page():
    # Render the HTML template for the /ui route
    return render_template("admin/admin_notif.html")

@app.route("/admin-profile")
def admin_profile_page():
    # Render the HTML template for the /ui route
    return render_template("admin/admin_profile.html")


@app.route("/admin-payments")
def admin_payments_page():
    # Render the HTML template for the /ui route
    return render_template("admin/admin_payments.html")


@app.route("/admin-manage-clients")
def admin_manage_clients_page():
    # Render the HTML template for the /ui route
    return render_template("admin/admin_manage_clients.html")


@app.route("/admin-manage-feedbacks")
def admin_manage_feedbacks_page():
    # Render the HTML template for the /ui route
    return render_template("admin/admin_manage_feedbacks.html")

@app.route("/client-notif")
def client_notif_page():
    # Render the HTML template for the /ui route
    return render_template("client/client_notif.html")

@app.route("/admin-sidebar")
def admin_sidebar_page():
    # Render the HTML template for the /ui route
    return render_template("admin_sidebar.html")


@app.route("/login")
def login_page():
    # Render the HTML template for the /ui route
    return render_template("auth/login.html")

@app.route("/auth/client-signup")
def auth_client_signup():
    # Render the HTML template for the /ui route
    return render_template("auth/client_signup.html")


@app.route("/auth/admin-signup")
def auth_admin_signup():
    # Render the HTML template for the /ui route
    return render_template("auth/admin_signup.html")


@app.route("/forgot-password")
def forgot_password_page():
    # Render the HTML template for the /ui route
    return render_template("auth/forgot_password.html")


# static\js\auth\client_signup.js
# static\js\auth\login.js
# static\js\auth\admin_signup.js
# static\js\header_load.js
# static\js\admin\admin_dashboard.js
# static\js\logout.js
# static\js\admin\admin_global.js

# templates\admin\admin_profile.html

@app.route("/header")
def header_page():
    # Render the HTML template for the /ui route
    return render_template("header.html")

@app.route('/api/logout')
def logout_session():
    session.clear()
    return redirect(url_for('login_page'))


# @app.route('/api/login', methods=['POST'])
# def login_api():
#     if not is_mysql_available():
#         return handle_mysql_error("MySQL not available")
    
#     cursor = get_cursor()
#     if not cursor:
#         return handle_mysql_error("Unable to get MySQL cursor")

#     try:
#         data = request.form  # Handles form data from the login page
#         username = data.get('userName')
#         password = data.get('password')

#         if not username or not password:
#             return jsonify({"error": "Missing credentials"}), 400

#         # Hash password to compare with stored hash
#         # password_hash = hashlib.sha256(password.encode()).hexdigest()
#         password_hash = password

#         # Query user
#         query = """
#             SELECT * FROM auth WHERE userName = %s AND passwordHash = %s AND status = 'active' LIMIT 1;
#         """
#         cursor.execute(query, (username, password_hash))
#         user = cursor.fetchone()

#         if user:
#             # Store essential info in session
#             session['user'] = {
#                 "id": user[0],
#                 "uID": user[1],
#                 "userName": user[9],
#                 "role": user[3],
#                 "email": user[5]
#             }
#             return redirect(url_for('dashboard'))  # Redirect to a protected page (example)
#         else:
#             flash("Invalid username or password", "danger")
#             return redirect(url_for('login_page'))

#     except mysql.connector.Error as e:
#         return handle_mysql_error(e)

#     finally:
#         cursor.close()



@app.route('/api/login', methods=['POST'])
def login_api():
    if not is_mysql_available():
        return handle_mysql_error("MySQL not available")
    
    cursor = get_cursor()
    if not cursor:
        return handle_mysql_error("Unable to get MySQL cursor")

    try:
        data = request.get_json()  # Expecting JSON from JS fetch
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"status": "error", "message": "Missing credentials"}), 400

        # No password hashing for now
        password_hash = password

        # Query user by email and password
        query = """
            SELECT * FROM auth WHERE email = %s AND passwordHash = %s AND status = 'active' LIMIT 1;
        """
        cursor.execute(query, (email, password_hash))
        user = cursor.fetchone()

        if user:
            session['user'] = {
                "id": user[0],
                "uID": user[1],
                "userName": user[9],
                "role": user[3],
                "email": user[5]
            }
            return jsonify({
                "status": "success",
                "message": "Login successful",
                "role": user[3]  # Send back role for frontend redirect
            }), 200
        else:
            return jsonify({"status": "error", "message": "Invalid email or password"}), 401

    except mysql.connector.Error as e:
        return handle_mysql_error(e)

    finally:
        cursor.close()


@app.route('/api/check-session', methods=['GET'])
def check_session():
    user = session.get('user')

    if user:
        return jsonify({
            "isLoggedIn": True,
            "userRole": user.get("role", "client"),
            # "firstName": user.get("firstName", ""),
            "firstName": user.get("userName", "")
            
        })
    else:
        return jsonify({
            "isLoggedIn": False
        })


@app.route('/api/get-admin-avatar', methods=['GET'])
def get_admin_avatar():
    # Set default avatar URL using static path
    default_avatar = url_for('static', filename='icons/profile.png')

    avatar_url = session.get('admin_avatar')
    if avatar_url:
        return jsonify({"avatar_url": avatar_url})

    return jsonify({"avatar_url": default_avatar})


@app.route('/api/dashboard-overview', methods=['GET'])
def dashboard_overview():
    if not is_mysql_available():
        return handle_mysql_error("MySQL not available")
    
    cursor = get_cursor()
    if not cursor:
        return handle_mysql_error("Unable to get MySQL cursor")
    
    try:
        # 1. Total Users (role = 'client')
        cursor.execute("SELECT COUNT(*) AS total_users FROM auth WHERE role = 'client'")
        total_users = cursor.fetchone()[0] or 0

        # 2. Function to fetch bookings with payments
        def fetch_bookings_with_payments(table_name):
            query = f"""
                SELECT 
                    b.id, b.booking_id, b.customer_name, b.destination, b.date, b.amount, b.status,
                    p.amount_due, p.amount_paid, p.status AS payment_status
                FROM {table_name} b
                LEFT JOIN payments p ON b.booking_id = p.booking_id
                ORDER BY b.id DESC
            """
            cursor.execute(query)
            columns = [col[0] for col in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]

        # 3. Fetch bookings from all 4 tables
        flights = fetch_bookings_with_payments("flight_bookings")
        tours = fetch_bookings_with_payments("tour_bookings")
        kabayans = fetch_bookings_with_payments("kabayan_bookings")
        itineraries = fetch_bookings_with_payments("itinerary_bookings")

        # 4. Total revenue from payments with status = 'verified'
        cursor.execute("SELECT SUM(amount_paid) AS total_revenue FROM payments WHERE status = 'verified'")
        total_revenue = cursor.fetchone()[0] or 0.00

        return jsonify({
            "total_users": total_users,
            "flight_bookings": flights,
            "tour_bookings": tours,
            "kabayan_bookings": kabayans,
            "itinerary_bookings": itineraries,
            "total_revenue": float(total_revenue)
        }), 200

    except mysql.connector.Error as e:
        return handle_mysql_error(e)

    finally:
        cursor.close()

@app.route('/api/get-notifications', methods=['GET'])
def get_notifications():
    if 'user' not in session:
        return jsonify({"error": "not_logged_in"}), 401

    user_id = session['user']['uID']
    
    cursor = get_cursor()
    if not cursor:
        return jsonify({"error": "Unable to get MySQL cursor"}), 500

    try:
        # Query to fetch notifications for the logged-in user
        query = """
        SELECT id, uID, category, title, message, created_at, type, is_read 
        FROM notifications 
        WHERE uID = %s 
        ORDER BY created_at DESC
        """
        cursor.execute(query, (user_id,))
        result = cursor.fetchall()

        # If no notifications, return an empty list
        if not result:
            return jsonify([])  # Empty list if no records found

        # Process the query results
        notifications = []
        for row in result:
            notifications.append({
                "id": row[0],
                "uID": row[1],
                "category": row[2],
                "title": row[3],
                "message": row[4],
                "created_at": row[5],
                "type": row[6],
                "is_read": row[7]
            })

        return jsonify(notifications)

    except mysql.connector.Error as e:
        app.logger.error(f"MySQL error: {str(e)}")
        return jsonify({"error": "Database error"}), 500

    finally:
        cursor.close()  # Close the cursor



@app.route('/logout', methods=['GET'])
def logout_user():
    session.clear()
    return redirect(url_for('index'))
    # session.clear()
    # response = make_response(redirect('/'))
    # response.set_cookie(key=session.cookie_name, value='', expires=0)
    # return response





if __name__ == '__main__':
    app.run(debug=True)
