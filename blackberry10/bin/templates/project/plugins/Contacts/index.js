/*
 * Copyright 2013 Research In Motion Limited.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var pimContacts,
    contactUtils = require("./contactUtils"),
    contactConsts = require("./contactConsts"),
    ContactError = require("./ContactError"),
    ContactFindOptions = require("./ContactFindOptions"),
    noop = function () {};

function getAccountFilters(options) {
    if (options.includeAccounts) {
        options.includeAccounts = options.includeAccounts.map(function (acct) {
            return acct.id.toString();
        });
    }

    if (options.excludeAccounts) {
        options.excludeAccounts = options.excludeAccounts.map(function (acct) {
            return acct.id.toString();
        });
    }
}

function populateFilter(filter, field, value) {
    if (field === "displayName" || field === "name") {
        filter.push({
            "fieldName" : ContactFindOptions.SEARCH_FIELD_GIVEN_NAME,
            "fieldValue" : value
        });

        filter.push({
            "fieldName" : ContactFindOptions.SEARCH_FIELD_FAMILY_NAME,
            "fieldValue" : value
        });
    } else if (field === "nickname") {
        // not supported by Cascades
    } else if (field === "phoneNumbers") {
        filter.push({
            "fieldName" : ContactFindOptions.SEARCH_FIELD_PHONE,
            "fieldValue" : value
        });
    } else if (field === "emails") {
        filter.push({
            "fieldName" : ContactFindOptions.SEARCH_FIELD_EMAIL,
            "fieldValue" : value
        });
    } else if (field === "addresses") {
        // not supported by Cascades
    } else if (field === "ims") {
        // not supported by Cascades
    } else if (field === "organizations") {
        filter.push({
            "fieldName" : ContactFindOptions.SEARCH_FIELD_ORGANIZATION_NAME,
            "fieldValue" : value
        });
    } else if (field === "birthday") {
        // not supported by Cascades
    } else if (field === "note") {
        // not supported by Cascades
    } else if (field === "photos") {
        // not supported by Cascades
    } else if (field === "categories") {
        // not supported by Cascades
    } else if (field === "urls") {
        // not supported by Cascades
    }
    // More fields supported by Cascades
    // ContactFindOptions.SEARCH_FIELD_BBMPIN
    // ContactFindOptions.SEARCH_FIELD_LINKEDIN
    // ContactFindOptions.SEARCH_FIELD_TWITTER
    // ContactFindOptions.SEARCH_FIELD_VIDEO_CHAT
}

function convertBirthday(birthday) {
    //Convert date string from native to milliseconds since epoch for cordova-js
    var birthdayInfo;
    if (birthday) {
        birthdayInfo = birthday.split("-");
        return new Date(birthdayInfo[0], birthdayInfo[1] - 1, birthdayInfo[2]).getTime();
    } else {
        return null;
    }
}

function processJnextSaveData(result, JnextData) {
    var data = JnextData,
        birthdayInfo;

    if (data._success === true) {
        data.birthday = convertBirthday(data.birthday);
        result.callbackOk(data, false);
    } else {
        result.callbackError(data.code, false);
    }
}

function processJnextFindData(result, JnextData) {
    var data = JnextData,
        i,
        l,
        birthdayInfo;

    if (data._success === true) {
        for (i = 0, l = data.contacts.length; i < l; i++) {
            data.contacts[i].birthday = convertBirthday(data.contacts[i].birthday);
        }
        result.callbackOk(data.contacts, false);
    } else {
        result.callbackError(data.code, false);
    }
}

module.exports = {
    search: function (successCb, failCb, args, env) {
        console.log("search is called");
        var findOptions = {},
            cordovaFindOptions = {},
            result,
            i,
            l,
            key;

        for (key in args) {
            if (args.hasOwnProperty(key)) {
                cordovaFindOptions[key] = JSON.parse(decodeURIComponent(args[key]));
            }
        }

        result = new PluginResult(args, env);
        findOptions._eventId = cordovaFindOptions.callbackId;
        findOptions.fields = cordovaFindOptions[0];
        findOptions.options = {};
        findOptions.options.filter = [];
        if (cordovaFindOptions[1].filter) {
            for (i = 0, l = findOptions.fields.length; i < l; i++) {
                populateFilter(findOptions.options.filter, findOptions.fields[i], cordovaFindOptions[1].filter);
            }
        }

        if (!contactUtils.validateFindArguments(findOptions.options)) {
            result.callbackError({
                "result": escape(JSON.stringify({
                    "_success": false,
                    "code": ContactError.INVALID_ARGUMENT_ERROR
                }))
            });
            result.noResult(true);
            return;
        }

        getAccountFilters(findOptions.options);
        pimContacts.getInstance().find(findOptions, result, processJnextFindData);

        result.noResult(true);
    },
    save: function (successCb, failCb, args, env) {
        var attributes = {},
            result = new PluginResult(args, env),
            key,
            nativeEmails = [];

        attributes = JSON.parse(decodeURIComponent(args[0]));

        //convert birthday format for our native .so file
        if (attributes.birthday) {
            attributes.birthday = new Date(attributes.birthday).toDateString();
        }

        if (attributes.emails) {
            attributes.emails.forEach(function (email) {
                if (email.value) {
                    if (email.type) {
                        nativeEmails.push({ "type" : email.type, "value" : email.value });
                    } else {
                        nativeEmails.push({ "type" : "home", "value" : email.value });
                    }
                }
            });
            attributes.emails = nativeEmails;
        }

        if (attributes.id !== null) {
            attributes.id = window.parseInt(attributes.id);
        }

        attributes._eventId = JSON.parse(decodeURIComponent(args.callbackId));
        pimContacts.getInstance().save(attributes, result, processJnextSaveData);
        result.noResult(true);
    },
    remove: function (successCb, failCb, args, env) {
        var attributes = {
                "contactId": window.parseInt(JSON.parse(decodeURIComponent(args[0]))),
                "_eventId": JSON.parse(decodeURIComponent(args.callbackId))
            },
            result = new PluginResult(args, env);

        if (!window.isNaN(attributes.contactId)) {
            pimContacts.getInstance().remove(attributes, result);
            result.noResult(true);
        } else {
            result.callbackError(ContactError.UNKNOWN_ERROR);
            result.noResult(false);
        }
    }
};

///////////////////////////////////////////////////////////////////
// JavaScript wrapper for JNEXT plugin
///////////////////////////////////////////////////////////////////

JNEXT.PimContacts = function ()
{
    var self = this,
        hasInstance = false;

    self.find = function (args, pluginResult, handler) {
        self.eventHandlers[args._eventId] = {
            "result" : pluginResult,
            "action" : "find",
            "handler" : handler
        };
        JNEXT.invoke(self.m_id, "find " + JSON.stringify(args));
        return "";
    };

    self.getContact = function (args) {
        return JSON.parse(JNEXT.invoke(self.m_id, "getContact " + JSON.stringify(args)));
    };

    self.save = function (args, pluginResult, handler) {
        self.eventHandlers[args._eventId] = {
            "result" : pluginResult,
            "action" : "save",
            "handler" : handler
        };
        JNEXT.invoke(self.m_id, "save " + JSON.stringify(args));
        return "";
    };

    self.remove = function (args, pluginResult) {
        self.eventHandlers[args._eventId] = {
            "result" : pluginResult,
            "action" : "remove"
        };
        JNEXT.invoke(self.m_id, "remove " + JSON.stringify(args));
        return "";
    };

    self.getId = function () {
        return self.m_id;
    };

    self.getContactAccounts = function () {
        var value = JNEXT.invoke(self.m_id, "getContactAccounts");
        return JSON.parse(value);
    };

    self.init = function () {
        if (!JNEXT.require("libpimcontacts")) {
            return false;
        }

        self.m_id = JNEXT.createObject("libpimcontacts.PimContacts");

        if (self.m_id === "") {
            return false;
        }

        JNEXT.registerEvents(self);
    };

    self.onEvent = function (strData) {
        var arData = strData.split(" "),
            strEventDesc = arData[0],
            callbackInfo,
            args = {};

        if (strEventDesc === "result") {
            args.result = escape(strData.split(" ").slice(2).join(" "));
            callbackInfo = self.eventHandlers[arData[1]];
            if (callbackInfo.action === "save" || callbackInfo.action === "find") {
                callbackInfo.handler(callbackInfo.result, JSON.parse(decodeURIComponent(args.result)));
            } else {
                callbackInfo.result.callbackOk(JSON.parse(decodeURIComponent(args.result)));
            }
        }
    };

    self.m_id = "";
    self.eventHandlers = {};

    self.getInstance = function () {
        if (!hasInstance) {
            self.init();
            hasInstance = true;
        }
        return self;
    };
};

pimContacts = new JNEXT.PimContacts();
