from flask import Flask, jsonify, request, render_template, session, redirect, url_for, flash, send_from_directory, send_file
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
    return render_template("admin/admin-dashboard.html")


@app.route("/client-notif")
def client_notif_page():
    # Render the HTML template for the /ui route
    return render_template("client/client_notif.html")


@app.route("/login")
def login_page():
    # Render the HTML template for the /ui route
    return render_template("auth/login.html")

@app.route("/forgot-password")
def forgot_password_page():
    # Render the HTML template for the /ui route
    return render_template("auth/forgot_password.html")



@app.route("/header")
def header_page():
    # Render the HTML template for the /ui route
    return render_template("header.html")

@app.route('/api/logout')
def logout():
    session.clear()
    return redirect(url_for('login_page'))


@app.route('/api/login', methods=['POST'])
def login_api():
    if not is_mysql_available():
        return handle_mysql_error("MySQL not available")
    
    cursor = get_cursor()
    if not cursor:
        return handle_mysql_error("Unable to get MySQL cursor")

    try:
        data = request.form  # Handles form data from the login page
        username = data.get('userName')
        password = data.get('password')

        if not username or not password:
            return jsonify({"error": "Missing credentials"}), 400

        # Hash password to compare with stored hash
        # password_hash = hashlib.sha256(password.encode()).hexdigest()
        password_hash = password

        # Query user
        query = """
            SELECT * FROM auth WHERE userName = %s AND passwordHash = %s AND status = 'active' LIMIT 1;
        """
        cursor.execute(query, (username, password_hash))
        user = cursor.fetchone()

        if user:
            # Store essential info in session
            session['user'] = {
                "id": user[0],
                "uID": user[1],
                "userName": user[9],
                "role": user[3],
                "email": user[5]
            }
            return redirect(url_for('dashboard'))  # Redirect to a protected page (example)
        else:
            flash("Invalid username or password", "danger")
            return redirect(url_for('login_page'))

    except mysql.connector.Error as e:
        return handle_mysql_error(e)

    finally:
        cursor.close()



if __name__ == '__main__':
    app.run(debug=True)
