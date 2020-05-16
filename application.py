import os
import datetime

from flask import Flask, render_template, request, url_for, session, redirect
from flask_socketio import SocketIO, emit
from flask_session.__init__ import Session
from sqlalchemy.orm import scoped_session, sessionmaker


app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)



@app.route("/")
def index():
	if ('user' in session):	
		return redirect(url_for('chats'))
	return render_template('index.html')	
	

@app.route("/chats", methods=["GET", "POST"])
def chats():
	if ('user' in session):
		user = session["user"]
		return render_template('chats.html', user=user)

	user = request.form.get('displayName')
	session["user"] = user
	return render_template('chats.html', user=user)


@socketio.on('send message')
def send(data):
	text = data["text"]
	channel = data["channel"]
	time = data['time']
	user = data["user"]
	emit("receive message", {'text':text, 'channel':channel, 'time':time, 'user':user}, broadcast=True)


@socketio.on('add channel')
def add(data):
	channel_name = data['channel_name']
	emit('complete channel add', {'channel_name':channel_name}, broadcast=True)


@socketio.on("channel click")
def update(data):
	prev = data['prevChannel']
	new = data['newChannel']
	emit('update users', {'prev':prev, 'new':new}, broadcast=True)


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))

