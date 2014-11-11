import os
import urllib
import datetime
import json
import jinja2
import webapp2
import logging
import time
import threading
import re

from google.appengine.api import users
from google.appengine.ext import ndb

from google.appengine.api import urlfetch
from google.appengine.ext import db

TEMP_ENV = jinja2.Environment(
	loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
	extensions=['jinja2.ext.autoescape'],
	autoescape=True
	)
def isInt(s):
    try: 
        int(s)
        return True
    except ValueError:
        return False

class MainHandler(webapp2.RequestHandler):
    def get(self):
        user = users.get_current_user()
        user_agent_string = self.request.headers['user-agent']
        temp_unavail = TEMP_ENV.get_template('templates/sorry.html')

        if "Chrome" in user_agent_string:
            if user:
                url = users.create_logout_url(self.request.uri)
                login_url = "Logout"
                temp = TEMP_ENV.get_template('templates/index.html')
                queryCon = ContactDB.query(ndb.AND(
                    ContactDB.conOwner==str(user.user_id())
                    )
                ).order(ContactDB.conLastName).fetch()
                
            else:
                url = users.create_login_url(self.request.uri)
                login_url = 'Login'
                temp = TEMP_ENV.get_template('templates/welcome.html')
                queryCon = {}

            values = {
                'current_user' : user,
                'login_url_text' : login_url,
                'login_url_link' : url,
                'current_contact_list' : queryCon
            }
            self.response.write(temp.render(values))
        else:
            self.response.write(temp_unavail.render())

class SaveContact(webapp2.RequestHandler):
    def post(self):
        user = users.get_current_user()
        if user:
            addCon = ContactDB()
            addCon.conFirstName = self.request.get('fname')
            addCon.conLastName = self.request.get('lname')
            addCon.conEmail = self.request.get('email')
            addCon.conPhone = self.request.get('phone')
            addCon.conOwner = str(user.user_id())
            addCon.put()
            time.sleep(2)
            self.redirect('/mylastcontact')


class FetchLastContact(webapp2.RequestHandler):
    def get(self):
        user = users.get_current_user()
        if user:
            queryCon = ContactDB.query(ndb.AND(
                ContactDB.conOwner==str(user.user_id())
                )
            ).order(-ContactDB.conSaveDate).fetch()
            contactInfo = {
                'id' : queryCon[0].key.id(),
                'fname' : queryCon[0].conFirstName,
                'lname' : queryCon[0].conLastName,
                'email' : queryCon[0].conEmail,
                'phone' : queryCon[0].conPhone
            }
            self.response.headers['Content-type'] = 'application/json'
            self.response.write(json.dumps(contactInfo))

class DeleteContact(webapp2.RequestHandler):
    def get(self, contact_id):
        getID = int(contact_id)
        ndb.Key(ContactDB, getID).delete()
        time.sleep(2)
        self.redirect('/')

class EditContact(webapp2.RequestHandler):
    def get(self, contact_id):
        user = users.get_current_user()
        if user:
            getID = int(contact_id)
            queryCon = ContactDB.get_by_id(getID)
            values = {
                'current_contact_list' : queryCon,
                'current_contact_id' : getID
            }
            temp = TEMP_ENV.get_template('templates/edit.html')
            self.response.write(temp.render(values))
        else:
            pass
    def post(self, contact_id):
        getID = int(contact_id)
        queryCon = ContactDB.get_by_id(getID)
        queryCon.conFirstName = self.request.get('fname')
        queryCon.conLastName = self.request.get('lname')
        queryCon.conEmail = self.request.get('email')
        queryCon.conPhone = self.request.get('phone')
        queryCon.put()
        time.sleep(1.5)
        self.redirect('/')

class SearchContact(webapp2.RequestHandler):
    def get(self):
        user = users.get_current_user()
        search = self.request.get('q')
        contactInfo = []
        if isInt(search):
            queryCon = ContactDB.query(ndb.AND(
                ContactDB.conOwner == str(user.user_id()),
                ContactDB.conPhone == search
                )).fetch()
        elif re.match("^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))+", search):
            queryCon = ContactDB.query(ndb.AND(
                ContactDB.conOwner == str(user.user_id()),
                ContactDB.conEmail == search
                )).fetch()
        else:
            queryCon = ContactDB.query(ndb.AND(
                ContactDB.conOwner == str(user.user_id()),
                ndb.OR(
                    ContactDB.conFirstName == search.capitalize(),
                    ContactDB.conLastName == search.capitalize()
                    )
                )).fetch()

        for x in queryCon:
            details = {
                'id'    : x.key.id(),
                'fname' : x.conFirstName,
                'lname' : x.conLastName,
                'email' : x.conEmail,
                'phone' : x.conPhone
            }
            contactInfo.append(details)

        self.response.headers['Content-type'] = 'application/json'
        self.response.write(json.dumps(contactInfo))

class ContactDB(ndb.Model):
    conSaveDate = ndb.DateTimeProperty(auto_now_add=True)
    conFirstName = ndb.StringProperty(indexed=True)
    conLastName = ndb.StringProperty(indexed=True)
    conEmail = ndb.StringProperty(indexed=True)
    conPhone = ndb.StringProperty(indexed=True)
    conOwner = ndb.StringProperty(indexed=True)

app = webapp2.WSGIApplication([
    ('/', MainHandler),
    ('/user',SaveContact),
    ('/mylastcontact',FetchLastContact),
    ('/delete/(\d+)', DeleteContact),
    ('/edit/(\d+)', EditContact),
    ('/search', SearchContact)
], debug=True)
