/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
*/

util = require 'util'
exec = require('child_process').exec
path = require 'path'

exports['default example project is generated'] = (test) ->
  test.expect 1
  exec './bin/create', (error, stdout, stderr) ->
    test.ok true, "this assertion should pass" unless error?
    test.done()

exports['default example project has a ./.cordova folder'] = (test) ->
  test.expect 1
  path.exists './example/.cordova', (exists) ->
    test.ok exists, 'the cordova folder exists'
    test.done()

exports['default example project has a /cordova folder'] = (test) ->
  test.expect 1
  path.exists './example/cordova', (exists) ->
    test.ok exists, 'the other cordova folder exists'
    test.done()